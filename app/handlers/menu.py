from telegram import Update
from telegram.ext import CommandHandler, ContextTypes

from app.config.time import get_greeting
from app.config.config import BOT_NAME, VERSION, OWNER_CONTACT, OWNER_NAME, ADMIN_LIST
import time

START_TIME = time.time()

def get_uptime():
    uptime_seconds = int(time.time() - START_TIME)
    hours = uptime_seconds // 3600
    minutes = (uptime_seconds % 3600) // 60
    seconds = uptime_seconds % 60
    return f"{hours}h {minutes}m {seconds}s"

def main_menu(user):
    if not user:
        return "❌ Tidak bisa mendapatkan data user."

    greeting = get_greeting()
    username = user.username or user.first_name
    user_id = user.id

    uptime = get_uptime()
    admin_count = len(ADMIN_LIST)

    text = f"""
━━━━━━━━━━━━━━━━━━━
🤖  <b>{BOT_NAME}</b>
━━━━━━━━━━━━━━━━━━━

{greeting} 👋 {username}
Semoga harimu menyenangkan ✨

📌 <b>Informasi Bot</b>
• Nama Bot : {BOT_NAME}
• Versi    : {VERSION}
• Status   : Online ✅
• Uptime   : {uptime}

👤 <b>Info User</b>
• Nama     : {username}
• ID       : {user_id}
• Role     : User
• Limit    : 10

👑 <b>Owner</b>
• Nama     : {OWNER_NAME}
• Kontak   : {OWNER_CONTACT}

🛡️ <b>Admin</b>
• Total Admin : {admin_count}

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
• /capcut   (Template CapCut)

🧠 <b>Tools</b>
• /compress   (Compress file)
• /merge      (Gabung file/video)
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

━━━━━━━━━━━━━━━━━━━
Ketik command langsung
Contoh: <b>/tt</b>
━━━━━━━━━━━━━━━━━━━
"""
    return text


async def show_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    menu_text = main_menu(user)
    await update.message.reply_text(main_menu(update.effective_user), parse_mode="HTML")

def menu_handler(app):
    app.add_handler(CommandHandler("menu", show_menu))