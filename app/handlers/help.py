from telegram import Update
from telegram.ext import CommandHandler, ContextTypes

async def help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("/start - mulai\n/help - bantuan")

def help_handler(app):
    app.add_handler(CommandHandler("help", help))