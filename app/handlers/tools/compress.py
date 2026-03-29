import os
import asyncio
import subprocess
import tempfile
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, CommandHandler, CallbackQueryHandler
from app.database.db import check_limit

MAX_FILE_INPUT  = 100 * 1024 * 1024
MAX_SIZE        = 49 * 1024 * 1024
READ_TIMEOUT    = 300
WRITE_TIMEOUT   = 300
CONNECT_TIMEOUT = 60

QUALITY_OPTS = {
    "high"  : {"crf": "23", "label": "🟢 Tinggi  (kualitas baik, ukuran sedang)"},
    "medium": {"crf": "28", "label": "🟡 Sedang  (seimbang)"},
    "low"   : {"crf": "35", "label": "🔴 Rendah  (ukuran kecil, kualitas turun)"},
}


def compress_video(input_path: str, crf: str = "28") -> str:
    output_path = input_path.rsplit(".", 1)[0] + f"_compressed.mp4"

    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-c:v", "libx264",
        "-crf", crf,
        "-preset", "fast",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        output_path
    ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=300)

    if result.returncode != 0:
        error = result.stderr.decode("utf-8", errors="ignore")
        raise Exception(f"FFmpeg error: {error[-300:]}")

    return output_path


def format_size(size: int) -> str:
    if size >= 1024 * 1024:
        return f"{size / (1024*1024):.1f} MB"
    return f"{size / 1024:.1f} KB"


async def compress(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.message
    replied = message.reply_to_message

    file_obj  = None
    file_name = None

    if replied:
        if replied.video:
            file_obj  = replied.video
            file_name = replied.video.file_name or "video.mp4"
        elif replied.document:
            mime = replied.document.mime_type or ""
            if "video" in mime:
                file_obj  = replied.document
                file_name = replied.document.file_name or "video.mp4"
    elif message.video:
        file_obj  = message.video
        file_name = message.video.file_name or "video.mp4"
    elif message.document:
        mime = message.document.mime_type or ""
        if "video" in mime:
            file_obj  = message.document
            file_name = message.document.file_name or "video.mp4"

    if not file_obj:
        await message.reply_text(
            "🗜️ <b>Video Compressor</b>\n\n"
            "<b>Cara pakai:</b>\n"
            "1️⃣ Kirim video + /compress\n"
            "2️⃣ Reply video dengan /compress\n\n"
            "<b>Level kompresi:</b>\n"
            "🟢 Tinggi  — kualitas baik, ukuran sedang\n"
            "🟡 Sedang  — seimbang\n"
            "🔴 Rendah  — ukuran kecil, kualitas turun\n\n"
            f"⚠️ Maksimal ukuran input: 100MB",
            parse_mode="HTML"
        )
        return

    if file_obj.file_size and file_obj.file_size > MAX_FILE_INPUT:
        size_mb = file_obj.file_size // (1024 * 1024)
        await message.reply_text(f"❌ File terlalu besar ({size_mb}MB). Maksimal 100MB.")
        return

    context.user_data["compress_file_id"]   = file_obj.file_id
    context.user_data["compress_file_name"] = file_name
    context.user_data["compress_file_size"] = file_obj.file_size or 0

    buttons = [
        [InlineKeyboardButton("🟢 Tinggi",  callback_data="compress|high")],
        [InlineKeyboardButton("🟡 Sedang",  callback_data="compress|medium")],
        [InlineKeyboardButton("🔴 Rendah",  callback_data="compress|low")],
    ]

    original_size = format_size(file_obj.file_size or 0)

    await message.reply_text(
        f"🗜️ <b>Video Compressor</b>\n\n"
        f"📄 File    : <code>{file_name}</code>\n"
        f"📏 Ukuran  : {original_size}\n\n"
        f"Pilih level kompresi:",
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(buttons)
    )


async def compress_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    _, quality = query.data.split("|", 1)
    crf        = QUALITY_OPTS[quality]["crf"]
    label      = QUALITY_OPTS[quality]["label"]

    file_id   = context.user_data.get("compress_file_id")
    file_name = context.user_data.get("compress_file_name", "video.mp4")
    orig_size = context.user_data.get("compress_file_size", 0)

    if not file_id:
        await query.message.reply_text("❌ Session habis. Kirim ulang video.")
        return

    boleh, pesan_error = check_limit(query.from_user.id)
    if not boleh:
        await query.message.reply_text(pesan_error, parse_mode="HTML")
        return

    await query.edit_message_text(f"⏳ Mengunduh video...")

    input_path  = None
    output_path = None

    try:
        tmp_dir    = tempfile.mkdtemp()
        ext        = os.path.splitext(file_name)[1] or ".mp4"
        input_path = os.path.join(tmp_dir, f"input{ext}")

        file = await context.bot.get_file(file_id)
        await file.download_to_drive(input_path)

        await query.edit_message_text(f"⚙️ Mengkompres video ({label})...")

        output_path  = await asyncio.to_thread(compress_video, input_path, crf)
        output_size  = os.path.getsize(output_path)
        output_name  = os.path.splitext(file_name)[0] + "_compressed.mp4"

        # Hitung persentase pengurangan
        if orig_size > 0:
            reduction = ((orig_size - output_size) / orig_size) * 100
            reduction_str = f"📉 Berkurang: {reduction:.1f}%"
        else:
            reduction_str = ""

        await query.edit_message_text("📤 Mengirim video...")

        caption = (
            f"🗜️ <b>{output_name}</b>\n"
            f"📏 Sebelum : {format_size(orig_size)}\n"
            f"📏 Sesudah : {format_size(output_size)}\n"
            f"{reduction_str}\n"
            f"⚙️ Kualitas: {label}"
        )

        with open(output_path, "rb") as f:
            if output_size > MAX_SIZE:
                await query.message.reply_document(
                    document=f,
                    caption=caption + "\n⚠️ Dikirim sebagai dokumen.",
                    parse_mode="HTML",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )
            else:
                await query.message.reply_video(
                    video=f,
                    caption=caption,
                    parse_mode="HTML",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )

        await query.message.delete()

    except subprocess.TimeoutExpired:
        await query.edit_message_text("❌ Proses timeout. File terlalu besar atau server sibuk.")

    except Exception as e:
        await query.edit_message_text(f"❌ Gagal kompres.\n\n<code>{e}</code>", parse_mode="HTML")

    finally:
        for p in [input_path, output_path]:
            if p and os.path.exists(p):
                os.remove(p)


def compress_handler(app):
    app.add_handler(CommandHandler("compress", compress))
    app.add_handler(CallbackQueryHandler(compress_callback, pattern="^compress\\|"))
