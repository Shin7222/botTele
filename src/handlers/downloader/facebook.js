import fs from 'fs';
import { downloadFacebook } from '../../services/facebookService.js';
import { downloadUrlToFile } from '../../services/downloadHelper.js';
import { checkLimit } from '../../database/db.js';
import { sendFile } from './helpers.js';

export function registerFacebook(bot) {
  bot.command('fb', async (ctx) => {
    const url = ctx.match?.trim().split(' ')[0];
    if (!url) return ctx.reply('📘 <b>Facebook Downloader</b>\n\nGunakan: /fb &lt;link&gt;', { parse_mode: 'HTML' });
    if (!['facebook.com','fb.watch','fb.com'].some(d => url.includes(d)))
      return ctx.reply('❌ Link tidak valid. Gunakan link dari Facebook.');

    const { allowed, message } = checkLimit(ctx.from.id);
    if (!allowed) return ctx.reply(message, { parse_mode: 'HTML' });

    const msg = await ctx.reply('📥 Downloading Facebook...');
    let filePath = null;
    try {
      const info = await downloadFacebook(url);
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, '📤 Mengirim file...');
      filePath = await downloadUrlToFile(info.url, 'fb', '.mp4');
      await sendFile(ctx, filePath, '📘 <b>Facebook</b>');
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    } catch (e) {
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id,
        `❌ Gagal download.\n\n<code>${e.message}</code>`, { parse_mode: 'HTML' });
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });
}
