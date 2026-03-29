import os
import asyncio
from telegram import Update
from telegram.ext import ContextTypes
from app.services.gdrive_services import download_gdrive
from app.database.db import check_limit

MAX_SIZE        = 49 * 1024 * 1024
READ_TIMEOUT    = 300
WRITE_TIMEOUT   = 300
CONNECT_TIMEOUT = 60

VIDEO_EXT = [".mp4", ".mkv", ".mov", ".avi", ".webm", ".flv"]
AUDIO_EXT = [".mp3", ".m4a", ".ogg", ".wav", ".flac"]
IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"]


async def gdrive(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text(
            "☁️ <b>Google Drive Downloader</b>\n\n"
            "Gunakan: /gdrive &lt;link&gt;\n\n"
            "Format link yang didukung:\n"
            "• drive.google.com/file/d/ID/view\n"
            "• drive.google.com/open?id=ID\n\n"
            "⚠️ Hanya file publik yang bisa didownload.",
            parse_mode="HTML"
        )
        return

    url = context.args[0]

    if not any(domain in url for domain in ["drive.google.com", "docs.google.com"]):
        await update.message.reply_text("❌ Link tidak valid. Gunakan link dari drive.google.com")
        return

    boleh, pesan_error = check_limit(update.effective_user.id)
    if not boleh:
        await update.message.reply_text(pesan_error, parse_mode="HTML")
        return

    msg       = await update.message.reply_text("📥 Downloading dari Google Drive...")
    file_path = None

    try:
        file_path = await asyncio.to_thread(download_gdrive, url)

        if not os.path.exists(file_path):
            raise FileNotFoundError("File tidak ditemukan setelah download.")

        file_size = os.path.getsize(file_path)
        extension = os.path.splitext(file_path)[1].lower()
        filename  = os.path.basename(file_path)

        await msg.edit_text("📤 Mengirim file...")

        with open(file_path, "rb") as f:
            caption = f"☁️ <b>{filename}</b>\n📏 {file_size // (1024*1024)} MB"

            if file_size > MAX_SIZE:
                await update.message.reply_document(
                    document=f,
                    caption=caption + "\n⚠️ Dikirim sebagai dokumen.",
                    parse_mode="HTML",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )
            elif extension in VIDEO_EXT:
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
        err = str(e)
        if "private" in err.lower() or "kosong" in err.lower():
            pesan = "❌ File tidak bisa didownload.\nPastikan file sudah diset <b>Anyone with the link</b>."
        else:
            pesan = f"❌ Gagal download.\n\n<code>{e}</code>"
        await msg.edit_text(pesan, parse_mode="HTML")

    finally:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
