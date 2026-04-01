import fs from 'fs';
import { downloadTiktok } from '../../services/tiktokService.js';
import { downloadUrlToFile } from '../../services/downloadHelper.js';
import { checkLimit } from '../../database/db.js';
import { sendFile } from './helpers.js';

export function registerTiktok(bot) {
  bot.command('tt', async (ctx) => {
    const url = ctx.match?.trim().split(' ')[0];
    if (!url) return ctx.reply(
      '🎵 <b>TikTok Downloader</b>\n\nGunakan: /tt &lt;link&gt;\n\nContoh:\n<code>/tt https://www.tiktok.com/@user/video/xxx</code>',
      { parse_mode: 'HTML' }
    );
    if (!['tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'].some(d => url.includes(d)))
      return ctx.reply('❌ Link tidak valid. Gunakan link dari TikTok.');

    const { allowed, message } = checkLimit(ctx.from.id);
    if (!allowed) return ctx.reply(message, { parse_mode: 'HTML' });

    const msg = await ctx.reply('📥 Downloading TikTok...');
    let filePath = null;
    try {
      const info = await downloadTiktok(url);
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, '📤 Mengirim file...');
      filePath = await downloadUrlToFile(info.url, 'tt', '.mp4');
      await sendFile(ctx, filePath, `🎵 <b>TikTok</b>\n${info.title || ''}`);
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    } catch (e) {
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id,
        `❌ Gagal download.\n\n<code>${e.message}</code>`, { parse_mode: 'HTML' });
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });
}
