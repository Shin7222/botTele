import asyncio
import os
import time
from telegram import Update
from telegram.ext import ContextTypes, CommandHandler
from app.services.ytdl import download_media

def make_progress_bar(percentage):
    completed = int(percentage / 10)
    return "█" * completed + "░" * (10 - completed)

async def process_download(update: Update, context: ContextTypes.DEFAULT_TYPE, mode: str):
    if not context.args:
        await update.message.reply_text(f"Format salah! Contoh: /yt{mode} [URL]")
        return
    
    url = context.args[0]
    msg = await update.message.reply_text(f"Menyiapkan unduhan... ⏳")

    # Variabel untuk membatasi frekuensi update pesan (Throttle)
    last_update_time = 0

    # Fungsi yang akan dipanggil oleh yt-dlp
    def progress_callback(percentage):
        nonlocal last_update_time
        current_time = time.time()
        
        # Update hanya jika sudah lewat 2 detik dari update terakhir
        if current_time - last_update_time > 2.0 or percentage == 100:
            bar = make_progress_bar(percentage)
            text = f"📥 <b>Downloading {mode.upper()}</b>\n" \
                   f"<code>[{bar}]</code> {percentage:.1f}%\n" \
                   f"<i>Mohon tunggu sebentar...</i>"
            
            # Karena ini dipanggil dari thread ytdl, kita gunakan loop event bot
            asyncio.run_coroutine_threadsafe(
                msg.edit_text(text, parse_mode="HTML"),
                context.application.loop
            )
            last_update_time = current_time

    try:
        # Kirim progress_callback ke service
        file_path = await asyncio.to_thread(download_media, url, mode, progress_callback)
        
        await msg.edit_text("📤 <b>Sedang mengirim file...</b>", parse_mode="HTML")
        
        if os.path.exists(file_path):
            with open(file_path, 'rb') as f:
                if mode == 'audio':
                    await update.message.reply_audio(audio=f, caption="✅ Audio Berhasil!")
                else:
                    await update.message.reply_video(video=f, caption="✅ Video Berhasil!")

            os.remove(file_path)
            await msg.delete()
    except Exception as e:
        await msg.edit_text(f"❌ Terjadi kesalahan: {e}")


def register_ytdl_handlers(app):
    app.add_handler(CommandHandler("ytaudio", lambda u, c: process_download(u, c, 'audio')))
    app.add_handler(CommandHandler("ytvideo", lambda u, c: process_download(u, c, 'video')))