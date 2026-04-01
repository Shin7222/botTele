import fs from 'fs';
import { downloadTerabox, formatSize } from '../../services/teraboxService.js';
import { checkLimit } from '../../database/db.js';
import { sendFile } from './helpers.js';

const TERABOX_DOMAINS = ['terabox.com','1024tera.com','freeterabox.com','4funbox.com','mirrobox.com','nephobox.com','teraboxapp.com','momerybox.com','tibibox.com'];

export function registerTerabox(bot) {
  bot.command('terabox', async (ctx) => {
    const url = ctx.match?.trim().split(' ')[0];
    if (!url) return ctx.reply('📦 <b>Terabox Downloader</b>\n\nGunakan: /terabox &lt;link&gt;\n\n⚠️ File &gt;49MB dikirim sebagai link.', { parse_mode: 'HTML' });
    if (!TERABOX_DOMAINS.some(d => url.includes(d))) return ctx.reply('❌ Link tidak valid.');

    const { allowed, message } = checkLimit(ctx.from.id);
    if (!allowed) return ctx.reply(message, { parse_mode: 'HTML' });

    const msg = await ctx.reply('📥 Mengambil info file dari Terabox...');
    let filePath = null;
    try {
      const result = await downloadTerabox(url);
      filePath = result.filePath;

      if (!filePath) {
        return ctx.api.editMessageText(ctx.chat.id, msg.message_id,
          `📦 <b>${result.filename}</b>\n📏 Ukuran: ${result.sizeStr}\n\n⚠️ File terlalu besar.\n\n<a href="${result.downloadUrl}">⬇️ Download ${result.filename}</a>\n\n<i>Link expired dalam beberapa menit.</i>`,
          { parse_mode: 'HTML', disable_web_page_preview: true }
        );
      }

      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, `📤 Mengirim ${result.filename} (${result.sizeStr})...`);
      await sendFile(ctx, filePath, `📦 <b>${result.filename}</b>\n📏 ${result.sizeStr}`);
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    } catch (e) {
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, `❌ Gagal download.\n\n<code>${e.message}</code>`, { parse_mode: 'HTML' });
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });
}
