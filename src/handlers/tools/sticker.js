import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { InputFile } from 'grammy';
import { checkLimit } from '../../database/db.js';

const execFileAsync = promisify(execFile);
const MAX_INPUT = 10 * 1024 * 1024;

async function toWebp(inputPath) {
  const outputPath = inputPath.replace(/\.[^.]+$/, '.webp');
  await execFileAsync('ffmpeg', ['-y','-i',inputPath,'-vf','scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000','-vframes','1',outputPath], { timeout: 60000 });
  return outputPath;
}

async function gifToWebm(inputPath) {
  const outputPath = inputPath.replace(/\.[^.]+$/, '.webm');
  await execFileAsync('ffmpeg', ['-y','-i',inputPath,'-vf','scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000','-c:v','libvpx-vp9','-b:v','0','-crf','30','-an','-t','3',outputPath], { timeout: 60000 });
  return outputPath;
}

export function registerSticker(bot) {
  bot.command('sticker', async (ctx) => {
    const msg = ctx.message;
    const replied = msg.reply_to_message;
    let fileObj = null, fileName = null, isGif = false;

    if (replied?.photo) { fileObj = replied.photo.at(-1); fileName = 'photo.jpg'; }
    else if (replied?.animation) { fileObj = replied.animation; fileName = 'animation.gif'; isGif = true; }
    else if (replied?.document) {
      const mime = replied.document.mime_type || '';
      if (mime.includes('image') || mime.includes('gif')) {
        fileObj = replied.document; fileName = replied.document.file_name || 'file';
        isGif = mime.includes('gif');
      }
    }
    else if (msg.photo) { fileObj = msg.photo.at(-1); fileName = 'photo.jpg'; }
    else if (msg.animation) { fileObj = msg.animation; fileName = 'animation.gif'; isGif = true; }

    if (!fileObj) return ctx.reply('🎨 <b>Sticker Maker</b>\n\nCara pakai:\n1️⃣ Kirim foto + /sticker\n2️⃣ Reply foto/GIF dengan /sticker\n\n✅ Otomatis resize ke 512x512', { parse_mode: 'HTML' });
    if (fileObj.file_size > MAX_INPUT) return ctx.reply('❌ File terlalu besar. Maksimal 10MB.');

    const { allowed, message } = checkLimit(ctx.from.id);
    if (!allowed) return ctx.reply(message, { parse_mode: 'HTML' });

    const statusMsg = await ctx.reply('⏳ Membuat sticker...');
    const tmpDir = os.tmpdir();
    const ext = path.extname(fileName) || (isGif ? '.gif' : '.jpg');
    const inputPath = path.join(tmpDir, `sticker_${Date.now()}${ext}`);
    let outputPath = null;

    try {
      const file = await ctx.api.getFile(fileObj.file_id);
      const res = await fetch(`https://api.telegram.org/file/bot${process.env.TOKEN}/${file.file_path}`);
      fs.writeFileSync(inputPath, Buffer.from(await res.arrayBuffer()));

      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, '⚙️ Mengkonversi...');

      if (isGif) {
        outputPath = await gifToWebm(inputPath);
        await ctx.replyWithDocument(new InputFile(outputPath, 'sticker.webm'), {
          caption: '🎨 <b>Animated Sticker</b>\n\nCara tambah:\n1️⃣ Buka @Stickers bot\n2️⃣ /newpack\n3️⃣ Kirim file .webm ini\n4️⃣ /publish',
          parse_mode: 'HTML'
        });
      } else {
        outputPath = await toWebp(inputPath);
        await ctx.replyWithSticker(new InputFile(outputPath));
      }
      await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
    } catch (e) {
      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, `❌ Gagal membuat sticker.\n\n<code>${e.message}</code>`, { parse_mode: 'HTML' });
    } finally {
      [inputPath, outputPath].forEach(p => { if (p && fs.existsSync(p)) fs.unlinkSync(p); });
    }
  });
}
