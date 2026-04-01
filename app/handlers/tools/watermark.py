import os
import asyncio
import subprocess
import tempfile
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, CommandHandler
from app.database.db import check_limit

MAX_FILE_INPUT  = 100 * 1024 * 1024
MAX_SIZE        = 49 * 1024 * 1024
READ_TIMEOUT    = 300
WRITE_TIMEOUT   = 300
CONNECT_TIMEOUT = 60

POSITIONS = {
    "topleft"    : ("10",        "10",         "↖️ Kiri Atas"),
    "topright"   : ("W-w-10",    "10",         "↗️ Kanan Atas"),
    "bottomleft" : ("10",        "H-h-10",     "↙️ Kiri Bawah"),
    "bottomright": ("W-w-10",    "H-h-10",     "↘️ Kanan Bawah"),
    "center"     : ("(W-w)/2",   "(H-h)/2",    "⬛ Tengah"),
}


def add_watermark_text(input_path: str, text: str, position: str, ext: str) -> str:
    x, y, _   = POSITIONS.get(position, POSITIONS["bottomright"])
    output_path = input_path.rsplit(".", 1)[0] + f"_wm{ext}"

    # Escape karakter khusus untuk ffmpeg
    text_escaped = text.replace("'", "\\'").replace(":", "\\:")

    filter_text = (
        f"drawtext=text='{text_escaped}'"
        f":fontsize=36"
        f":fontcolor=white"
        f":borderw=2"
        f":bordercolor=black"
        f":x={x}"
        f":y={y}"
    )

    if ext in [".jpg", ".jpeg", ".png", ".webp"]:
        cmd = [
            "ffmpeg", "-y",
            "-i", input_path,
            "-vf", filter_text,
            "-q:v", "2",
            output_path
        ]
    else:
        cmd = [
            "ffmpeg", "-y",
            "-i", input_path,
            "-vf", filter_text,
            "-c:v", "libx264",
            "-c:a", "copy",
            "-preset", "fast",
            output_path
        ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=300)

    if result.returncode != 0:
        error = result.stderr.decode("utf-8", errors="ignore")
        raise Exception(f"FFmpeg error: {error[-300:]}")

    return output_path


async def watermark(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.message
    replied = message.reply_to_message
    args    = context.args

    file_obj  = None
    file_name = None
    is_image  = False

    if replied:
        if replied.video:
            file_obj  = replied.video
            file_name = replied.video.file_name or "video.mp4"
        elif replied.photo:
            file_obj  = replied.photo[-1]
            file_name = "photo.jpg"
            is_image  = True
        elif replied.document:
            mime = replied.document.mime_type or ""
            file_obj  = replied.document
            file_name = replied.document.file_name or "file"
            is_image  = "image" in mime
    elif message.video:
        file_obj  = message.video
        file_name = message.video.file_name or "video.mp4"
    elif message.photo:
        file_obj  = message.photo[-1]
        file_name = "photo.jpg"
        is_image  = True

    if not file_obj:
        await message.reply_text(
            "💧 <b>Watermark Tool</b>\n\n"
            "<b>Cara pakai:</b>\n"
            "<code>/watermark &lt;teks&gt;</code>\n\n"
            "<b>Contoh:</b>\n"
            "<code>/watermark © NamaKamu</code>\n\n"
            "Kirim/reply foto atau video beserta perintah di atas.\n\n"
            "<b>Posisi tersedia:</b>\n"
            "↖️ topleft | ↗️ topright\n"
            "↙️ bottomleft | ↘️ bottomright\n"
            "⬛ center\n\n"
            "<b>Dengan posisi:</b>\n"
            "<code>/watermark © NamaKamu bottomright</code>",
            parse_mode="HTML"
        )
        return

    if not args:
        await message.reply_text(
            "❌ Teks watermark tidak ada.\n\n"
            "Contoh: <code>/watermark © NamaKamu</code>",
            parse_mode="HTML"
        )
        return

    # Cek apakah argumen terakhir adalah posisi
    position = "bottomright"
    if args[-1].lower() in POSITIONS:
        position = args[-1].lower()
        text     = " ".join(args[:-1])
    else:
        text = " ".join(args)

    if not text:
        await message.reply_text("❌ Teks watermark tidak boleh kosong.")
        return

    if len(text) > 50:
        await message.reply_text("❌ Teks watermark maksimal 50 karakter.")
        return

    if file_obj.file_size and file_obj.file_size > MAX_FILE_INPUT:
        await message.reply_text(f"❌ File terlalu besar. Maksimal 100MB.")
        return

    boleh, pesan_error = check_limit(update.effective_user.id)
    if not boleh:
        await message.reply_text(pesan_error, parse_mode="HTML")
        return

    _, pos_label = POSITIONS[position][0], POSITIONS[position][2]
    msg = await message.reply_text(
        f"⏳ Menambahkan watermark...\n"
        f"💧 Teks: <code>{text}</code>\n"
        f"📍 Posisi: {pos_label}",
        parse_mode="HTML"
    )

    input_path  = None
    output_path = None

    try:
        tmp_dir   = tempfile.mkdtemp()
        ext       = os.path.splitext(file_name)[1] or (".jpg" if is_image else ".mp4")
        input_path = os.path.join(tmp_dir, f"input{ext}")

        file = await context.bot.get_file(file_obj.file_id)
        await file.download_to_drive(input_path)

        await msg.edit_text("⚙️ Memproses...")

        output_path = await asyncio.to_thread(add_watermark_text, input_path, text, position, ext)
        output_size = os.path.getsize(output_path)
        output_name = os.path.splitext(file_name)[0] + "_watermark" + ext

        caption = (
            f"💧 <b>{output_name}</b>\n"
            f"📝 Watermark: <code>{text}</code>\n"
            f"📍 Posisi: {pos_label}"
        )

        await msg.edit_text("📤 Mengirim file...")

        with open(output_path, "rb") as f:
            if output_size > MAX_SIZE:
                await message.reply_document(
                    document=f,
                    caption=caption + "\n⚠️ Dikirim sebagai dokumen.",
                    parse_mode="HTML",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )
            elif is_image or ext in [".jpg", ".jpeg", ".png", ".webp"]:
                await message.reply_photo(
                    photo=f,
                    caption=caption,
                    parse_mode="HTML",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )
            else:
                await message.reply_video(
                    video=f,
                    caption=caption,
                    parse_mode="HTML",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )

        await msg.delete()

    except Exception as e:
        await msg.edit_text(f"❌ Gagal menambahkan watermark.\n\n<code>{e}</code>", parse_mode="HTML")

    finally:
        for p in [input_path, output_path]:
            if p and os.path.exists(p):
                os.remove(p)

def watermark_handler(app):
    app.add_handler(CommandHandler("watermark",  watermark))