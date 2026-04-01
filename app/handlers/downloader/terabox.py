import os
import asyncio
from telegram import Update
from telegram.ext import ContextTypes
from app.services.terabox_services import download_terabox
from app.database.db import check_limit

MAX_SIZE        = 49 * 1024 * 1024
READ_TIMEOUT    = 300
WRITE_TIMEOUT   = 300
CONNECT_TIMEOUT = 60

VIDEO_EXT = [".mp4", ".mkv", ".mov", ".avi", ".webm", ".flv"]
AUDIO_EXT = [".mp3", ".m4a", ".ogg", ".wav", ".flac"]
IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"]

TERABOX_DOMAINS = [
    "terabox.com", "1024tera.com", "freeterabox.com",
    "4funbox.com", "mirrobox.com", "nephobox.com",
    "teraboxapp.com", "momerybox.com", "tibibox.com"
]


def format_size(size: int) -> str:
    if size >= 1024 * 1024 * 1024:
        return f"{size / (1024**3):.1f} GB"
    elif size >= 1024 * 1024:
        return f"{size / (1024**2):.1f} MB"
    return f"{size / 1024:.1f} KB"


async def terabox(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text(
            "📦 <b>Terabox Downloader</b>\n\n"
            "Gunakan: /terabox &lt;link&gt;\n\n"
            "Domain yang didukung:\n"
            "• terabox.com\n"
            "• 1024tera.com\n"
            "• freeterabox.com\n"
            "• teraboxapp.com\n\n"
            "⚠️ File > 49MB dikirim sebagai link download.",
            parse_mode="HTML"
        )
        return

    url = context.args[0]

    if not any(domain in url for domain in TERABOX_DOMAINS):
        await update.message.reply_text("❌ Link tidak valid. Gunakan link dari Terabox.")
        return

    boleh, pesan_error = check_limit(update.effective_user.id)
    if not boleh:
        await update.message.reply_text(pesan_error, parse_mode="HTML")
        return

    msg       = await update.message.reply_text("📥 Mengambil info file dari Terabox...")
    file_path = None

    try:
        result       = await asyncio.to_thread(download_terabox, url)
        filename     = result["filename"]
        file_size    = result["size"]
        download_url = result["download_url"]
        file_path    = result["file_path"]
        size_str     = format_size(file_size)
        extension    = os.path.splitext(filename)[1].lower()

        # File besar → kirim link saja
        if not file_path:
            await msg.edit_text(
                f"📦 <b>{filename}</b>\n"
                f"📏 Ukuran: {size_str}\n\n"
                f"⚠️ File terlalu besar untuk dikirim langsung.\n\n"
                f"<a href='{download_url}'>⬇️ Download {filename}</a>\n\n"
                f"<i>Link expired dalam beberapa menit.</i>",
                parse_mode="HTML",
                disable_web_page_preview=True
            )
            return

        await msg.edit_text(f"📤 Mengirim {filename} ({size_str})...")

        with open(file_path, "rb") as f:
            caption = f"📦 <b>{filename}</b>\n📏 {size_str}"

            if extension in VIDEO_EXT:
                await update.message.reply_video(
                    video=f,
                    caption=caption,
                    parse_mode="HTML",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )
            elif extension in AUDIO_EXT:
                await update.message.reply_audio(
                    audio=f,
                    caption=caption,
                    parse_mode="HTML",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )
            elif extension in IMAGE_EXT:
                await update.message.reply_photo(
                    photo=f,
                    caption=caption,
                    parse_mode="HTML",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )
            else:
                await update.message.reply_document(
                    document=f,
                    caption=caption,
                    parse_mode="HTML",
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
