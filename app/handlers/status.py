from telegram import Update
from telegram.ext import CallbackContext, CommandHandler
import time
import psutil

async def status_handler(update: Update, context: CallbackContext):
    uptime = time.time()
    mem = psutil.virtual_memory().used / 1024 / 1024
    cpu = psutil.cpu_percent(interval=1)

    text = (
        "Bot Status:\n"
        f"• Uptime: {int(uptime)} seconds\n"
        f"• Memory Usage: {mem:.2f} MB\n"
        f"• CPU Usage: {cpu}%\n"
    )
    await update.message.reply_text(text, parse_mode="HTML")

def register_status_handler(app):
    app.add_handler(CommandHandler("status", status_handler))