from telegram import Update
from telegram.ext import ContextTypes, CommandHandler

async def idchek_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    await update.message.reply_text(f"Your Telegram user ID is: {user_id}")

def register_idchek_handler(app):
    app.add_handler(CommandHandler("idchek", idchek_handler))