import os
import asyncio
import subprocess
import tempfile
from telegram import Update
from telegram.ext import ContextTypes, CommandHandler
from app.database.db import check_limit

MAX_FILE_INPUT  = 100 * 1024 * 1024
MAX_SIZE        = 49 * 1024 * 1024
READ_TIMEOUT    = 300
WRITE_TIMEOUT   = 300
CONNECT_TIMEOUT = 60


def merge_video_audio(video_path: str, audio_path: str) -> str:
    output_path = video_path.rsplit(".", 1)[0] + "_merged.mp4"

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", audio_path,
        "-c:v", "copy",       # copy video stream (cepat)
        "-c:a", "aac",        # encode audio ke AAC
        "-map", "0:v:0",      # ambil video dari file pertama
        "-map", "1:a:0",      # ambil audio dari file kedua
        "-shortest",          # sesuaikan durasi dengan yang terpendek
        output_path
    ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=300)

    if result.returncode != 0:
        error = result.stderr.decode("utf-8", errors="ignore")
        raise Exception(f"FFmpeg error: {error[-300:]}")

    return output_path


async def merge(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.message
    replied = message.reply_to_message

    await message.reply_text(
        "🔀 <b>Merge Video + Audio</b>\n\n"
        "<b>Cara pakai:</b>\n"
        "1️⃣ Kirim video terlebih dahulu\n"
        "2️⃣ Kemudian reply video tersebut dengan audio + /merge\n\n"
        "<b>Contoh alur:</b>\n"
        "→ Kirim video.mp4\n"
        "→ Reply video + kirim audio.mp3\n"
        "→ Ketik /merge\n\n"
        "⚠️ Durasi akan disesuaikan dengan file terpendek\n"
        "⚠️ Maksimal masing-masing file: 100MB",
        parse_mode="HTML"
    ) if not replied else None

    # Butuh reply yang berisi video
    if not replied:
        return

    # Ambil video dari reply
    video_obj = None
    if replied.video:
        video_obj = replied.video
    elif replied.document and replied.document.mime_type and "video" in replied.document.mime_type:
        video_obj = replied.document

    # Ambil audio dari pesan sekarang
    audio_obj = None
    if message.audio:
        audio_obj = message.audio
    elif message.document and message.document.mime_type and "audio" in message.document.mime_type:
        audio_obj = message.document
    elif message.voice:
        audio_obj = message.voice

    if not video_obj:
        await message.reply_text(
            "❌ Reply harus berisi <b>video</b>.\n\n"
            "Cara: Reply video dengan /merge + kirim file audio.",
            parse_mode="HTML"
        )
        return

    if not audio_obj:
        await message.reply_text(
            "❌ Sertakan file <b>audio</b> bersama perintah /merge.\n\n"
            "Cara: Reply video dengan /merge + kirim file audio.",
            parse_mode="HTML"
        )
        return

    # Cek ukuran
    for obj, label in [(video_obj, "Video"), (audio_obj, "Audio")]:
        if obj.file_size and obj.file_size > MAX_FILE_INPUT:
            size_mb = obj.file_size // (1024 * 1024)
            await message.reply_text(f"❌ {label} terlalu besar ({size_mb}MB). Maksimal 100MB.")
            return

    boleh, pesan_error = check_limit(update.effective_user.id)
    if not boleh:
        await message.reply_text(pesan_error, parse_mode="HTML")
        return

    msg         = await message.reply_text("⏳ Mengunduh video dan audio...")
    video_path  = None
    audio_path  = None
    output_path = None

    try:
        tmp_dir = tempfile.mkdtemp()

        # Download video
        video_path = os.path.join(tmp_dir, "video.mp4")
        vfile      = await context.bot.get_file(video_obj.file_id)
        await vfile.download_to_drive(video_path)

        # Download audio
        audio_ext  = ".mp3"
        if hasattr(audio_obj, "mime_type") and audio_obj.mime_type:
            if "ogg" in audio_obj.mime_type:
                audio_ext = ".ogg"
            elif "m4a" in audio_obj.mime_type:
                audio_ext = ".m4a"

        audio_path = os.path.join(tmp_dir, f"audio{audio_ext}")
        afile      = await context.bot.get_file(audio_obj.file_id)
        await afile.download_to_drive(audio_path)

        await msg.edit_text("⚙️ Menggabungkan video dan audio...")

        output_path = await asyncio.to_thread(merge_video_audio, video_path, audio_path)
        output_size = os.path.getsize(output_path)

        await msg.edit_text("📤 Mengirim hasil merge...")

        caption = (
            f"🔀 <b>Hasil Merge</b>\n"
            f"📏 Ukuran: {output_size // (1024*1024)} MB"
        )

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
        await msg.edit_text(f"❌ Gagal merge.\n\n<code>{e}</code>", parse_mode="HTML")

    finally:
        for p in [video_path, audio_path, output_path]:
            if p and os.path.exists(p):
                os.remove(p)


def merge_handler(app):
    app.add_handler(CommandHandler("merge", merge))