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

async function mergeVideoAudio(videoPath, audioPath) {
  const outputPath = videoPath.replace(/\.[^.]+$/, '_merged.mp4');
  await execFileAsync('ffmpeg', ['-y','-i',videoPath,'-i',audioPath,'-c:v','copy','-c:a','aac','-map','0:v:0','-map','1:a:0','-shortest',outputPath], { timeout: 300000 });
  return outputPath;
}

export function registerMerge(bot) {
  bot.command('merge', async (ctx) => {
    const msg = ctx.message;
    const replied = msg.reply_to_message;

    if (!replied) {
      return ctx.reply('🔀 <b>Merge Video + Audio</b>\n\nCara pakai:\n1️⃣ Kirim video dulu\n2️⃣ Reply video + kirim audio + /merge\n\n⚠️ Maks masing-masing: 100MB', { parse_mode: 'HTML' });
    }

    let videoObj = replied?.video || (replied?.document?.mime_type?.includes('video') ? replied.document : null);
    let audioObj = msg.audio || (msg.document?.mime_type?.includes('audio') ? msg.document : null) || msg.voice;

    if (!videoObj) return ctx.reply('❌ Reply harus berisi <b>video</b>.', { parse_mode: 'HTML' });
    if (!audioObj) return ctx.reply('❌ Sertakan file <b>audio</b> bersama /merge.', { parse_mode: 'HTML' });

    for (const [obj, label] of [[videoObj,'Video'],[audioObj,'Audio']]) {
      if (obj.file_size > MAX_INPUT) return ctx.reply(`❌ ${label} terlalu besar. Maksimal 100MB.`);
    }

    const { allowed, message } = checkLimit(ctx.from.id);
    if (!allowed) return ctx.reply(message, { parse_mode: 'HTML' });

    const statusMsg = await ctx.reply('⏳ Mengunduh video dan audio...');
    const tmpDir = os.tmpdir();
    const videoPath = path.join(tmpDir, `video_${Date.now()}.mp4`);
    const audioExt = audioObj.mime_type?.includes('ogg') ? '.ogg' : audioObj.mime_type?.includes('m4a') ? '.m4a' : '.mp3';
    const audioPath = path.join(tmpDir, `audio_${Date.now()}${audioExt}`);
    let outputPath = null;

    try {
      const [vFile, aFile] = await Promise.all([ctx.api.getFile(videoObj.file_id), ctx.api.getFile(audioObj.file_id)]);
      const token = process.env.TOKEN;
      const [vRes, aRes] = await Promise.all([
        fetch(`https://api.telegram.org/file/bot${token}/${vFile.file_path}`),
        fetch(`https://api.telegram.org/file/bot${token}/${aFile.file_path}`)
      ]);
      fs.writeFileSync(videoPath, Buffer.from(await vRes.arrayBuffer()));
      fs.writeFileSync(audioPath, Buffer.from(await aRes.arrayBuffer()));

      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, '⚙️ Menggabungkan video dan audio...');
      outputPath = await mergeVideoAudio(videoPath, audioPath);
      const outSize = fs.statSync(outputPath).size;

      const caption = `🔀 <b>Hasil Merge</b>\n📏 Ukuran: ${(outSize/(1024*1024)).toFixed(1)} MB`;
      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, '📤 Mengirim hasil merge...');

      const file = new InputFile(outputPath);
      if (outSize > MAX_SIZE) {
        await ctx.replyWithDocument(file, { caption: caption + '\n⚠️ Dikirim sebagai dokumen.', parse_mode: 'HTML' });
      } else {
        await ctx.replyWithVideo(file, { caption, parse_mode: 'HTML' });
      }
      await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
    } catch (e) {
      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, `❌ Gagal merge.\n\n<code>${e.message}</code>`, { parse_mode: 'HTML' });
    } finally {
      [videoPath, audioPath, outputPath].forEach(p => { if (p && fs.existsSync(p)) fs.unlinkSync(p); });
    }
  });
}
