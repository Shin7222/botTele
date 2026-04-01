import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { InputFile, InlineKeyboard } from 'grammy';
import { checkLimit } from '../../database/db.js';

const execFileAsync = promisify(execFile);
const MAX_INPUT = 100 * 1024 * 1024;
const MAX_SIZE = 49 * 1024 * 1024;

const QUALITY_OPTS = {
  high:   { crf: '23', label: '🟢 Tinggi (kualitas baik, ukuran sedang)' },
  medium: { crf: '28', label: '🟡 Sedang (seimbang)' },
  low:    { crf: '35', label: '🔴 Rendah (ukuran kecil, kualitas turun)' },
};

function formatSize(s) {
  return s >= 1024*1024 ? `${(s/(1024*1024)).toFixed(1)} MB` : `${(s/1024).toFixed(1)} KB`;
}

async function compressVideo(inputPath, crf) {
  const outputPath = inputPath.replace(/\.[^.]+$/, '_compressed.mp4');
  await execFileAsync('ffmpeg', ['-y','-i',inputPath,'-c:v','libx264','-crf',crf,'-preset','fast','-c:a','aac','-b:a','128k','-movflags','+faststart',outputPath], { timeout: 300000 });
  return outputPath;
}

const sessions = new Map();

export function registerCompress(bot) {
  bot.command('compress', async (ctx) => {
    const msg = ctx.message;
    const replied = msg.reply_to_message;
    let fileObj = null, fileName = null;

    if (replied?.video) { fileObj = replied.video; fileName = replied.video.file_name || 'video.mp4'; }
    else if (replied?.document?.mime_type?.includes('video')) { fileObj = replied.document; fileName = replied.document.file_name || 'video.mp4'; }
    else if (msg.video) { fileObj = msg.video; fileName = msg.video.file_name || 'video.mp4'; }
    else if (msg.document?.mime_type?.includes('video')) { fileObj = msg.document; fileName = msg.document.file_name || 'video.mp4'; }

    if (!fileObj) return ctx.reply('🗜️ <b>Video Compressor</b>\n\nCara pakai:\n1️⃣ Kirim video + /compress\n2️⃣ Reply video dengan /compress\n\n⚠️ Maksimal input: 100MB', { parse_mode: 'HTML' });
    if (fileObj.file_size > MAX_INPUT) return ctx.reply(`❌ File terlalu besar. Maksimal 100MB.`);

    sessions.set(ctx.from.id, { fileId: fileObj.file_id, fileName, fileSize: fileObj.file_size });

    const kb = new InlineKeyboard()
      .text('🟢 Tinggi', 'compress|high').row()
      .text('🟡 Sedang', 'compress|medium').row()
      .text('🔴 Rendah', 'compress|low');

    await ctx.reply(`🗜️ <b>Video Compressor</b>\n\n📄 File: <code>${fileName}</code>\n📏 Ukuran: ${formatSize(fileObj.file_size)}\n\nPilih level kompresi:`, { parse_mode: 'HTML', reply_markup: kb });
  });

  bot.callbackQuery(/^compress\|/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const quality = ctx.callbackQuery.data.split('|')[1];
    const { crf, label } = QUALITY_OPTS[quality];
    const session = sessions.get(ctx.from.id);
    if (!session) return ctx.reply('❌ Session habis. Kirim ulang video.');

    const { allowed, message } = checkLimit(ctx.from.id);
    if (!allowed) return ctx.reply(message, { parse_mode: 'HTML' });

    await ctx.editMessageText('⏳ Mengunduh video...');
    const tmpDir = os.tmpdir();
    const ext = path.extname(session.fileName) || '.mp4';
    const inputPath = path.join(tmpDir, `input_${Date.now()}${ext}`);
    let outputPath = null;

    try {
      const file = await ctx.api.getFile(session.fileId);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TOKEN}/${file.file_path}`;
      const res = await fetch(fileUrl);
      fs.writeFileSync(inputPath, Buffer.from(await res.arrayBuffer()));

      await ctx.editMessageText(`⚙️ Mengkompres video (${label})...`);
      outputPath = await compressVideo(inputPath, crf);
      const outSize = fs.statSync(outputPath).size;
      const reduction = session.fileSize > 0 ? ((session.fileSize - outSize) / session.fileSize * 100).toFixed(1) : 0;

      const caption = `🗜️ <b>${session.fileName.replace(/\.[^.]+$/, '_compressed.mp4')}</b>\n📏 Sebelum: ${formatSize(session.fileSize)}\n📏 Sesudah: ${formatSize(outSize)}\n📉 Berkurang: ${reduction}%\n⚙️ Kualitas: ${label}`;

      await ctx.editMessageText('📤 Mengirim video...');
      const file2 = new InputFile(outputPath);
      if (outSize > MAX_SIZE) {
        await ctx.replyWithDocument(file2, { caption: caption + '\n⚠️ Dikirim sebagai dokumen.', parse_mode: 'HTML' });
      } else {
        await ctx.replyWithVideo(file2, { caption, parse_mode: 'HTML' });
      }
      await ctx.deleteMessage();
    } catch (e) {
      await ctx.editMessageText(`❌ Gagal kompres.\n\n<code>${e.message}</code>`, { parse_mode: 'HTML' });
    } finally {
      [inputPath, outputPath].forEach(p => { if (p && fs.existsSync(p)) fs.unlinkSync(p); });
    }
  });
}
