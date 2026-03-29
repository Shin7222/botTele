import os
import asyncio
from telegram import Update
from telegram.ext import ContextTypes, CommandHandler

from app.services.tt_services import download_tiktok
from app.database.db import check_limit 

MAX_SIZE = 49 * 1024 * 1024


async def tt(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text(
            "📥 <b>TikTok Downloader</b>\n\n"
            "Gunakan:\n"
            "<code>/tt link</code>\n\n"
            "Contoh:\n"
            "<code>/tt https://vt.tiktok.com/xxxxx</code>",
            parse_mode="HTML"
        )
        return

    url = context.args[0]

    # validasi link
    if "tiktok.com" not in url:
        await update.message.reply_text("❌ Link harus dari TikTok")
        return

    # cek limit
    boleh, pesan = check_limit(update.effective_user.id)
    if not boleh:
        await update.message.reply_text(pesan, parse_mode="HTML")
        return

    msg = await update.message.reply_text("📥 Downloading TikTok...")
    file_path = None

    try:
        file_path = await asyncio.to_thread(download_tiktok, url)

        if not os.path.exists(file_path):
            raise Exception("File tidak ditemukan")

        size = os.path.getsize(file_path)

        await msg.edit_text("📤 Mengirim video...")

        with open(file_path, "rb") as f:
            if size > MAX_SIZE:
                await update.message.reply_document(
                    document=f,
                    caption="📥 TikTok (file besar)"
                )
            else:
                await update.message.reply_video(
                    video=f,
                    caption="📥 TikTok"
                )

        await msg.delete()

    except Exception as e:
        await msg.edit_text(f"❌ Error:\n<code>{e}</code>", parse_mode="HTML")

    finally:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)


def ttdl_handler(app):
    app.add_handler(CommandHandler("ttdl", tt))