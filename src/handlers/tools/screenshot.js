import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';
import { InputFile } from 'grammy';
import { checkLimit } from '../../database/db.js';

function isValidUrl(url) {
  try { new URL(url); return true; } catch { return false; }
}

async function takeScreenshot(url) {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `ss_${Date.now()}.jpg`);
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

  const apis = [
    `https://s-shot.ru/900x600/JPEG/900/Z1/?${url}`,
    `https://image.thum.io/get/width/1280/crop/800/${encodeURIComponent(url)}`,
    `https://api.miniature.io/?width=1280&height=800&url=${encodeURIComponent(url)}`,
  ];

  for (const apiUrl of apis) {
    try {
      const res = await fetch(apiUrl, { headers, timeout: 30000 });
      if (res.ok && (res.headers.get('content-type') || '').includes('image')) {
        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > 1000) {
          fs.writeFileSync(filePath, Buffer.from(buffer));
          return filePath;
        }
      }
    } catch {}
  }
  throw new Error('Semua layanan screenshot gagal. Coba lagi nanti.');
}

export function registerScreenshot(bot) {
  bot.command('ss', async (ctx) => {
    let url = ctx.match?.trim().split(' ')[0];
    if (!url) return ctx.reply('📸 <b>Website Screenshot</b>\n\nGunakan: /ss &lt;url&gt;\n\nContoh:\n<code>/ss https://google.com</code>', { parse_mode: 'HTML' });

    if (!url.startsWith('http')) url = 'https://' + url;
    if (!isValidUrl(url)) return ctx.reply('❌ URL tidak valid.');

    const blocked = ['localhost', '127.0.0.1', '192.168.', '10.0.', '0.0.0.0'];
    if (blocked.some(b => url.includes(b))) return ctx.reply('❌ URL tidak diizinkan.');

    const { allowed, message } = checkLimit(ctx.from.id);
    if (!allowed) return ctx.reply(message, { parse_mode: 'HTML' });

    const msg = await ctx.reply(`📸 Mengambil screenshot dari:\n<code>${url}</code>`, { parse_mode: 'HTML' });
    let filePath = null;
    try {
      filePath = await takeScreenshot(url);
      const fileSize = fs.statSync(filePath).size;
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, '📤 Mengirim screenshot...');
      await ctx.replyWithPhoto(new InputFile(filePath), {
        caption: `📸 <b>Screenshot</b>\n🌐 URL: <code>${url.slice(0, 100)}</code>\n📏 Ukuran: ${Math.floor(fileSize/1024)} KB`,
        parse_mode: 'HTML'
      });
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    } catch (e) {
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, `❌ Gagal screenshot.\n\n<code>${e.message}</code>`, { parse_mode: 'HTML' });
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });
}
