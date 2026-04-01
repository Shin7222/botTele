import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { InputFile } from 'grammy';
import { checkLimit } from '../../database/db.js';

const execFileAsync = promisify(execFile);
const MAX_INPUT = 100 * 1024 * 1024;
const MAX_SIZE = 49 * 1024 * 1024;

const POSITIONS = {
  topleft:     { x: '10',       y: '10',       label: '↖️ Kiri Atas' },
  topright:    { x: 'W-w-10',   y: '10',       label: '↗️ Kanan Atas' },
  bottomleft:  { x: '10',       y: 'H-h-10',   label: '↙️ Kiri Bawah' },
  bottomright: { x: 'W-w-10',   y: 'H-h-10',   label: '↘️ Kanan Bawah' },
  center:      { x: '(W-w)/2',  y: '(H-h)/2',  label: '⬛ Tengah' },
};

async function addWatermark(inputPath, text, position, ext) {
  const { x, y } = POSITIONS[position] || POSITIONS.bottomright;
  const outputPath = inputPath.replace(/\.[^.]+$/, `_wm${ext}`);
  const textEscaped = text.replace(/'/g, "\\'").replace(/:/g, '\\:');
  const filter = `drawtext=text='${textEscaped}':fontsize=36:fontcolor=white:borderw=2:bordercolor=black:x=${x}:y=${y}`;
  const isImage = ['.jpg','.jpeg','.png','.webp'].includes(ext);
  const args = isImage
    ? ['-y','-i',inputPath,'-vf',filter,'-q:v','2',outputPath]
    : ['-y','-i',inputPath,'-vf',filter,'-c:v','libx264','-c:a','copy','-preset','fast',outputPath];
  await execFileAsync('ffmpeg', args, { timeout: 300000 });
  return outputPath;
}

export function registerWatermark(bot) {
  bot.command('watermark', async (ctx) => {
    const msg = ctx.message;
    const replied = msg.reply_to_message;
    const args = ctx.match?.trim().split(' ');

    let fileObj = null, fileName = null, isImage = false;
    if (replied?.video) { fileObj = replied.video; fileName = replied.video.file_name || 'video.mp4'; }
    else if (replied?.photo) { fileObj = replied.photo.at(-1); fileName = 'photo.jpg'; isImage = true; }
    else if (replied?.document) { fileObj = replied.document; fileName = replied.document.file_name || 'file'; isImage = (replied.document.mime_type||'').includes('image'); }
    else if (msg.video) { fileObj = msg.video; fileName = msg.video.file_name || 'video.mp4'; }
    else if (msg.photo) { fileObj = msg.photo.at(-1); fileName = 'photo.jpg'; isImage = true; }

    if (!fileObj) return ctx.reply('💧 <b>Watermark Tool</b>\n\nCara pakai:\n<code>/watermark &lt;teks&gt;</code>\n\nKirim/reply foto atau video.', { parse_mode: 'HTML' });
    if (!args?.length) return ctx.reply('❌ Teks watermark tidak ada.\n\nContoh: <code>/watermark © NamaKamu</code>', { parse_mode: 'HTML' });
    if (fileObj.file_size > MAX_INPUT) return ctx.reply('❌ File terlalu besar. Maksimal 100MB.');

    let position = 'bottomright';
    let textParts = [...args];
    if (POSITIONS[args.at(-1)?.toLowerCase()]) {
      position = args.at(-1).toLowerCase();
      textParts = args.slice(0, -1);
    }
    const text = textParts.join(' ');
    if (!text) return ctx.reply('❌ Teks watermark tidak boleh kosong.');
    if (text.length > 50) return ctx.reply('❌ Teks watermark maksimal 50 karakter.');

    const { allowed, message } = checkLimit(ctx.from.id);
    if (!allowed) return ctx.reply(message, { parse_mode: 'HTML' });

    const { label } = POSITIONS[position];
    const statusMsg = await ctx.reply(`⏳ Menambahkan watermark...\n💧 Teks: <code>${text}</code>\n📍 Posisi: ${label}`, { parse_mode: 'HTML' });
    const tmpDir = os.tmpdir();
    const ext = path.extname(fileName) || (isImage ? '.jpg' : '.mp4');
    const inputPath = path.join(tmpDir, `wm_input_${Date.now()}${ext}`);
    let outputPath = null;

    try {
      const file = await ctx.api.getFile(fileObj.file_id);
      const res = await fetch(`https://api.telegram.org/file/bot${process.env.TOKEN}/${file.file_path}`);
      fs.writeFileSync(inputPath, Buffer.from(await res.arrayBuffer()));

      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, '⚙️ Memproses...');
      outputPath = await addWatermark(inputPath, text, position, ext);
      const outSize = fs.statSync(outputPath).size;
      const outName = fileName.replace(/\.[^.]+$/, `_watermark${ext}`);
      const caption = `💧 <b>${outName}</b>\n📝 Watermark: <code>${text}</code>\n📍 Posisi: ${label}`;

      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, '📤 Mengirim file...');
      const fileInput = new InputFile(outputPath);
      if (outSize > MAX_SIZE) {
        await ctx.replyWithDocument(fileInput, { caption: caption + '\n⚠️ Dikirim sebagai dokumen.', parse_mode: 'HTML' });
      } else if (isImage || ['.jpg','.jpeg','.png','.webp'].includes(ext)) {
        await ctx.replyWithPhoto(fileInput, { caption, parse_mode: 'HTML' });
      } else {
        await ctx.replyWithVideo(fileInput, { caption, parse_mode: 'HTML' });
      }
      await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
    } catch (e) {
      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, `❌ Gagal watermark.\n\n<code>${e.message}</code>`, { parse_mode: 'HTML' });
    } finally {
      [inputPath, outputPath].forEach(p => { if (p && fs.existsSync(p)) fs.unlinkSync(p); });
    }
  });
}
