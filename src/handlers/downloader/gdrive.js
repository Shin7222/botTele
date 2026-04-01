import fs from 'fs';
import path from 'path';
import { InputFile } from 'grammy';
import { downloadGdrive } from '../../services/gdriveService.js';
import { checkLimit } from '../../database/db.js';
import { sendFile, MAX_SIZE, VIDEO_EXT, AUDIO_EXT, IMAGE_EXT } from './helpers.js';

export function registerGdrive(bot) {
  bot.command('gdrive', async (ctx) => {
    const url = ctx.match?.trim().split(' ')[0];
    if (!url) return ctx.reply('☁️ <b>Google Drive Downloader</b>\n\nGunakan: /gdrive &lt;link&gt;\n\n⚠️ Hanya file publik.', { parse_mode: 'HTML' });
    if (!['drive.google.com','docs.google.com'].some(d => url.includes(d))) return ctx.reply('❌ Link tidak valid.');

    const { allowed, message } = checkLimit(ctx.from.id);
    if (!allowed) return ctx.reply(message, { parse_mode: 'HTML' });

    const msg = await ctx.reply('📥 Downloading dari Google Drive...');
    let filePath = null;
    try {
      filePath = await downloadGdrive(url);
      const filename = path.basename(filePath);
      const fileSize = fs.statSync(filePath).size;
      const caption = `☁️ <b>${filename}</b>\n📏 ${(fileSize/(1024*1024)).toFixed(1)} MB`;
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, '📤 Mengirim file...');
      await sendFile(ctx, filePath, caption);
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    } catch (e) {
      const err = e.message.toLowerCase();
      const pesan = err.includes('private') || err.includes('kosong')
        ? '❌ File tidak bisa didownload.\nPastikan file sudah diset <b>Anyone with the link</b>.'
        : `❌ Gagal download.\n\n<code>${e.message}</code>`;
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, pesan, { parse_mode: 'HTML' });
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });
}
