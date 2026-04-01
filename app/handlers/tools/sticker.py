import os
import asyncio
import subprocess
import tempfile
from telegram import Update
from telegram.ext import ContextTypes, CommandHandler
from app.database.db import check_limit

MAX_FILE_INPUT  = 10 * 1024 * 1024  # 10MB
READ_TIMEOUT    = 120
WRITE_TIMEOUT   = 120
CONNECT_TIMEOUT = 30


def convert_to_webp(input_path: str) -> str:
    """Konversi gambar ke WebP 512x512 untuk sticker Telegram."""
    output_path = input_path.rsplit(".", 1)[0] + ".webp"

    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vf", "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000",
        "-vframes", "1",
        output_path
    ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)

    if result.returncode != 0:
        raise Exception("Gagal konversi ke WebP.")

    return output_path


def convert_gif_to_webm(input_path: str) -> str:
    """Konversi GIF ke WebM untuk animated sticker Telegram."""
    output_path = input_path.rsplit(".", 1)[0] + ".webm"

    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vf", "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000",
        "-c:v", "libvpx-vp9",
        "-b:v", "0",
        "-crf", "30",
        "-an",
        "-t", "3",  # maks 3 detik
        output_path
    ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)

    if result.returncode != 0:
        raise Exception("Gagal konversi GIF ke WebM.")

    return output_path


async def sticker(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.message
    replied = message.reply_to_message

    file_obj  = None
    file_name = None
    is_gif    = False

    if replied:
        if replied.photo:
            file_obj  = replied.photo[-1]
            file_name = "photo.jpg"
        elif replied.document:
            mime = replied.document.mime_type or ""
            if "image" in mime or "gif" in mime:
                file_obj  = replied.document
                file_name = replied.document.file_name or "file"
                is_gif    = "gif" in mime
        elif replied.animation:
            file_obj  = replied.animation
            file_name = "animation.gif"
            is_gif    = True
    elif message.photo:
        file_obj  = message.photo[-1]
        file_name = "photo.jpg"
    elif message.document:
        mime = message.document.mime_type or ""
        if "image" in mime or "gif" in mime:
            file_obj  = message.document
            file_name = message.document.file_name or "file"
            is_gif    = "gif" in mime
    elif message.animation:
        file_obj  = message.animation
        file_name = "animation.gif"
        is_gif    = True

    if not file_obj:
        await message.reply_text(
            "🎨 <b>Sticker Maker</b>\n\n"
            "<b>Cara pakai:</b>\n"
            "1️⃣ Kirim foto + /sticker\n"
            "2️⃣ Reply foto/GIF dengan /sticker\n\n"
            "<b>Format yang didukung:</b>\n"
            "🖼️ JPG, PNG, WEBP → Static sticker\n"
            "🎞️ GIF, Animation → Animated sticker\n\n"
            "✅ Otomatis resize ke 512x512",
            parse_mode="HTML"
        )
        return

    if file_obj.file_size and file_obj.file_size > MAX_FILE_INPUT:
        await message.reply_text(f"❌ File terlalu besar. Maksimal 10MB.")
        return

    boleh, pesan_error = check_limit(update.effective_user.id)
    if not boleh:
        await message.reply_text(pesan_error, parse_mode="HTML")
        return

    msg       = await message.reply_text("⏳ Membuat sticker...")
    file_path = None
    out_path  = None

    try:
        tmp_dir   = tempfile.mkdtemp()
        ext       = os.path.splitext(file_name)[1] or (".gif" if is_gif else ".jpg")
        file_path = os.path.join(tmp_dir, f"input{ext}")

        file = await context.bot.get_file(file_obj.file_id)
        await file.download_to_drive(file_path)

        await msg.edit_text("⚙️ Mengkonversi...")

        if is_gif:
            out_path = await asyncio.to_thread(convert_gif_to_webm, file_path)
            with open(out_path, "rb") as f:
                await message.reply_document(
                    document=f,
                    filename="sticker.webm",
                    caption=(
                        "🎨 <b>Animated Sticker</b>\n\n"
                        "Cara tambah ke Telegram:\n"
                        "1️⃣ Buka @Stickers bot\n"
                        "2️⃣ /newpack → beri nama\n"
                        "3️⃣ Kirim file .webm ini\n"
                        "4️⃣ /publish"
                    ),
                    parse_mode="HTML",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )
        else:
            out_path = await asyncio.to_thread(convert_to_webp, file_path)
            with open(out_path, "rb") as f:
                await message.reply_sticker(
                    sticker=f,
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )

        await msg.delete()

    except Exception as e:
        await msg.edit_text(f"❌ Gagal membuat sticker.\n\n<code>{e}</code>", parse_mode="HTML")

    finally:
        for p in [file_path, out_path]:
            if p and os.path.exists(p):
                os.remove(p)

def sticker_handler(app):
    app.add_handler(CommandHandler("sticker", sticker))
