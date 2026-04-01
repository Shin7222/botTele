import fs from 'fs';
import { downloadCapcut } from '../../services/capcutService.js';
import { downloadUrlToFile } from '../../services/downloadHelper.js';
import { checkLimit } from '../../database/db.js';
import { sendFile } from './helpers.js';

export function registerCapcut(bot) {
  bot.command('capcut', async (ctx) => {
    const url = ctx.match?.trim().split(' ')[0];
    if (!url) return ctx.reply('✂️ <b>CapCut Downloader</b>\n\nGunakan: /capcut &lt;link&gt;', { parse_mode: 'HTML' });
    if (!['capcut.com','capcut.net'].some(d => url.includes(d)))
      return ctx.reply('❌ Link tidak valid. Gunakan link dari capcut.com');

    const { allowed, message } = checkLimit(ctx.from.id);
    if (!allowed) return ctx.reply(message, { parse_mode: 'HTML' });

    const msg = await ctx.reply('📥 Downloading CapCut...');
    let filePath = null;
    try {
      const info = await downloadCapcut(url);
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, '📤 Mengirim file...');
      filePath = await downloadUrlToFile(info.url, 'cc', '.mp4');
      await sendFile(ctx, filePath, '✂️ <b>CapCut</b>');
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    } catch (e) {
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id,
        `❌ Gagal download.\n\n<code>${e.message}</code>`, { parse_mode: 'HTML' });
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });
}
