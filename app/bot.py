from telegram.ext import ApplicationBuilder
from app.config.config import BOT_TOKEN
from app.handlers.start import start_handler
from app.handlers.help import help_handler
from app.handlers.menu import menu_handler
from app.handlers.ytdl import register_ytdl_handlers
from app.database.db import init_db

def create_app():
    
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    start_handler(app)
    help_handler(app)
    menu_handler(app)
    register_ytdl_handlers(app)

    return app