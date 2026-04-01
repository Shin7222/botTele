import fs from 'fs';
import { InputFile } from 'grammy';
import { downloadYoutube } from '../../services/youtubeService.js';

export function registerYtdl(bot) {
  async function handleYt(ctx, mode) {
    const url = ctx.match?.trim().split(' ')[0];
    if (!url) return ctx.reply(`Format salah! Contoh: /yt${mode} [URL]`);

    const msg = await ctx.reply('⏳ Menyiapkan unduhan...');
    let filePath = null;
    try {
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, `📥 <b>Downloading ${mode.toUpperCase()}...</b>`, { parse_mode: 'HTML' });
      filePath = await downloadYoutube(url, mode);
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, '📤 <b>Mengirim file...</b>', { parse_mode: 'HTML' });
      const file = new InputFile(filePath);
      if (mode === 'audio') {
        await ctx.replyWithAudio(file, { caption: '✅ Audio Berhasil!' });
      } else {
        await ctx.replyWithVideo(file, { caption: '✅ Video Berhasil!' });
      }
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    } catch (e) {
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, `❌ Terjadi kesalahan: ${e.message}`);
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }

  bot.command('ytaudio', (ctx) => handleYt(ctx, 'audio'));
  bot.command('ytvideo', (ctx) => handleYt(ctx, 'video'));
}
