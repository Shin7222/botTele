from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler
from app.config.config import BOT_TOKEN
from app.handlers.start import start_handler
from app.handlers.help import help_handler
from app.handlers.menu import menu_handler
from app.handlers.ytdl import register_ytdl_handlers
from app.database.db import init_db
from app.handlers.idchek import register_idchek_handler
from app.handlers.status import register_status_handler
from app.handlers.downloader.tt import ttdl_handler
from app.handlers.tools.sticker import sticker_handler
from app.handlers.tools.compress import compress_handler
from app.handlers.tools.watermark import watermark_handler
from app.handlers.tools.merge import merge_handler
from app.handlers.tools.screenshot import ss_handler
from app.handlers.games.truth_dare import truth_dare_handler


# ========================
# DOWNLOADER
# ========================
from app.handlers.downloader.tiktok import tt
from app.handlers.downloader.instagram import ig
from app.handlers.downloader.facebook import fb
from app.handlers.downloader.twitter import tw
from app.handlers.downloader.capcut import capcut
from app.handlers.downloader.gdrive import gdrive
from app.handlers.downloader.terabox import terabox

def register_downloader_handlers(app):
    app.add_handler(CommandHandler("tt",      tt))
    app.add_handler(CommandHandler("ig",      ig))
    app.add_handler(CommandHandler("fb",      fb))
    app.add_handler(CommandHandler("tw",      tw))
    app.add_handler(CommandHandler("capcut",  capcut))
    app.add_handler(CommandHandler("gdrive",  gdrive))
    app.add_handler(CommandHandler("terabox", terabox))



def create_app():

    init_db()
    
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    start_handler(app)
    help_handler(app)
    menu_handler(app)
    register_ytdl_handlers(app)
    register_idchek_handler(app)
    register_status_handler(app)
    ttdl_handler(app)
    start_handler(app)
    compress_handler(app)
    watermark_handler(app)
    merge_handler(app)
    ss_handler(app)
    sticker_handler(app)
    truth_dare_handler(app)

    register_downloader_handlers(app)


    return app