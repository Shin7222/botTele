import os
import asyncio
from telegram import Update
from telegram.ext import ContextTypes
from app.services.tt_services import download_tiktok
from app.database.db import check_limit

MAX_SIZE        = 49 * 1024 * 1024
READ_TIMEOUT    = 300
WRITE_TIMEOUT   = 300
CONNECT_TIMEOUT = 60


async def tt(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text(
            "🎵 <b>TikTok Downloader</b>\n\n"
            "Gunakan: /tt &lt;link&gt;\n\n"
            "Contoh:\n"
            "<code>/tt https://www.tiktok.com/@user/video/xxx</code>",
            parse_mode="HTML"
        )
        return

    url = context.args[0]

    if not any(domain in url for domain in ["tiktok.com", "vm.tiktok.com"]):
        await update.message.reply_text("❌ Link tidak valid. Gunakan link dari TikTok.")
        return

    boleh, pesan_error = check_limit(update.effective_user.id)
    if not boleh:
        await update.message.reply_text(pesan_error, parse_mode="HTML")
        return

    msg       = await update.message.reply_text("📥 Downloading TikTok...")
    file_path = None

    try:
        file_path = await asyncio.to_thread(download_tiktok, url)

        if not os.path.exists(file_path):
            raise FileNotFoundError("File tidak ditemukan setelah download.")

        file_size = os.path.getsize(file_path)
        extension = os.path.splitext(file_path)[1].lower()

        await msg.edit_text("📤 Mengirim file...")

        with open(file_path, "rb") as f:
            if file_size > MAX_SIZE:
                await update.message.reply_document(
                    document=f,
                    caption="🎵 TikTok\n⚠️ File besar, dikirim sebagai dokumen.",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )
            elif extension in [".mp4", ".mkv", ".mov", ".webm"]:
                await update.message.reply_video(
                    video=f,
                    caption="🎵 TikTok",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )
            elif extension in [".jpg", ".jpeg", ".png", ".webp"]:
                await update.message.reply_photo(
                    photo=f,
                    caption="🎵 TikTok",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )
            else:
                await update.message.reply_document(
                    document=f,
                    caption="🎵 TikTok",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )

        await msg.delete()

    except Exception as e:
        await msg.edit_text(f"❌ Gagal download.\n\n<code>{e}</code>", parse_mode="HTML")

    finally:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
