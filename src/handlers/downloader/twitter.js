import fs from 'fs';
import { downloadTwitter } from '../../services/twitterService.js';
import { downloadUrlToFile } from '../../services/downloadHelper.js';
import { checkLimit } from '../../database/db.js';
import { sendFile } from './helpers.js';

export function registerTwitter(bot) {
  bot.command('tw', async (ctx) => {
    const url = ctx.match?.trim().split(' ')[0];
    if (!url) return ctx.reply(
      '🐦 <b>Twitter/X Downloader</b>\n\nGunakan: /tw &lt;link&gt;\n\nContoh:\n<code>/tw https://x.com/user/status/xxx</code>',
      { parse_mode: 'HTML' }
    );
    if (!['twitter.com','x.com','t.co'].some(d => url.includes(d)))
      return ctx.reply('❌ Link tidak valid. Gunakan link dari Twitter/X.');

    const { allowed, message } = checkLimit(ctx.from.id);
    if (!allowed) return ctx.reply(message, { parse_mode: 'HTML' });

    const msg = await ctx.reply('📥 Downloading Twitter/X...');
    let filePath = null;
    try {
      const info = await downloadTwitter(url);
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, '📤 Mengirim file...');
      const ext = info.type === 'image' ? '.jpg' : '.mp4';
      filePath = await downloadUrlToFile(info.url, 'tw', ext);
      await sendFile(ctx, filePath, '🐦 <b>Twitter/X</b>');
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    } catch (e) {
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id,
        `❌ Gagal download.\n\n<code>${e.message}</code>`, { parse_mode: 'HTML' });
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });
}
