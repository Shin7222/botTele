import fs from 'fs';
import { downloadInstagram } from '../../services/instagramService.js';
import { downloadUrlToFile } from '../../services/downloadHelper.js';
import { checkLimit } from '../../database/db.js';
import { sendFile } from './helpers.js';

export function registerInstagram(bot) {
  bot.command('ig', async (ctx) => {
    const url = ctx.match?.trim().split(' ')[0];
    if (!url) return ctx.reply(
      '📸 <b>Instagram Downloader</b>\n\nGunakan: /ig &lt;link&gt;\n\nContoh:\n<code>/ig https://www.instagram.com/p/xxx/</code>',
      { parse_mode: 'HTML' }
    );
    if (!url.includes('instagram.com'))
      return ctx.reply('❌ Link tidak valid. Gunakan link dari Instagram.');

    const { allowed, message } = checkLimit(ctx.from.id);
    if (!allowed) return ctx.reply(message, { parse_mode: 'HTML' });

    const msg = await ctx.reply('📥 Downloading Instagram...');
    let filePath = null;
    try {
      const info = await downloadInstagram(url);
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, '📤 Mengirim file...');
      const ext = info.type === 'image' ? '.jpg' : '.mp4';
      filePath = await downloadUrlToFile(info.url, 'ig', ext);
      await sendFile(ctx, filePath, '📸 <b>Instagram</b>');
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    } catch (e) {
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id,
        `❌ Gagal download.\n\n<code>${e.message}</code>`, { parse_mode: 'HTML' });
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });
}
