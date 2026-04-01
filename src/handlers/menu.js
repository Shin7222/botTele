import { getGreeting } from '../config/time.js';
import { BOT_NAME, VERSION, OWNER_NAME, OWNER_CONTACT, ADMIN_LIST } from '../config/config.js';

const START_TIME = Date.now();

function getUptime() {
  const ms = Date.now() - START_TIME;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

export function registerMenu(bot) {
  bot.command('menu', async (ctx) => {
    const user = ctx.from;
    const greeting = getGreeting();
    const username = user.username || user.first_name;

    const text = `
━━━━━━━━━━━━━━━━━━━
🤖  <b>${BOT_NAME}</b>
━━━━━━━━━━━━━━━━━━━

${greeting} 👋 ${username}
Semoga harimu menyenangkan ✨

📌 <b>Informasi Bot</b>
• Nama Bot : ${BOT_NAME}
• Versi    : ${VERSION}
• Status   : Online ✅
• Uptime   : ${getUptime()}

👤 <b>Info User</b>
• Nama     : ${username}
• ID       : ${user.id}
• Role     : User
• Limit    : 10

👑 <b>Owner</b>
• Nama     : ${OWNER_NAME}
• Kontak   : ${OWNER_CONTACT}

🛡️ <b>Admin</b>
• Total Admin : ${ADMIN_LIST.length}

━━━━━━━━━━━━━━━━━━━
📂 <b>Menu Utama</b>
━━━━━━━━━━━━━━━━━━━

🎬 <b>Downloader</b>
• /tt       (TikTok)
• /ig       (Instagram)
• /fb       (Facebook)
• /tw       (Twitter / X)
• /gdrive   (Google Drive)
• /terabox  (Terabox)
• /capcut   (CapCut)
• /ytaudio  (YouTube Audio)
• /ytvideo  (YouTube Video)

🧠 <b>Tools</b>
• /compress   (Compress video)
• /merge      (Gabung video+audio)
• /ss         (Screenshot website)
• /sticker    (Buat sticker)
• /watermark  (Tambah watermark)

🎮 <b>Fun & Game</b>
• /truth
• /dare
• /tod

ℹ️ <b>Lainnya</b>
• /menu
• /help
• /idchek
• /status

━━━━━━━━━━━━━━━━━━━
Ketik command langsung
Contoh: <b>/tt</b>
━━━━━━━━━━━━━━━━━━━`;

    await ctx.reply(text, { parse_mode: 'HTML' });
  });
}
