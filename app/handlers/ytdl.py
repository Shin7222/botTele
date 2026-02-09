import asyncio
import os
from telegram import Update
from telegram.ext import ContextTypes, CommandHandler
from app.services.ytdl import download_media

async def process_download(update: Update, context: ContextTypes.DEFAULT_TYPE, mode: str):
    user_id = update.effective_user.id

    if not context.args:
        await update.message.reply_text(f"Format salah! Contoh: /yt{mode} [URL]")
        return
    
    url = context.args[0]
    emoji = "🎧" if mode == "audio" else "🎬"
    msg = await update.message.reply_text(f"Sedang memproses... audio ⏳")

    try:
        file_path = await asyncio.to_thread(download_media, url, mode=mode)
        
        if os.path.exists(file_path):
            with open(file_path, 'rb') as f:
                if mode == 'audio':
                    await update.message.reply_audio(audio=f, caption="Audio berhasil diunduh! ✅")
                else:
                    await update.message.reply_video(video=f, caption="Video berhasil diunduh! ✅")

            os.remove(file_path)
            await msg.delete()
        else:
            await msg.edit_text("File tidak ditemukan setelah download. ❌")

    except Exception as e:
        await msg.edit_text(f"Waduh, ada error: {e}")

# Handler spesifik untuk Video
async def yt_video_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await process_download(update, context, mode='video')

# Handler spesifik untuk Audio
async def yt_audio_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await process_download(update, context, mode='audio')

def register_ytdl_handlers(app):
    app.add_handler(CommandHandler("ytvideo", yt_video_handler))
    app.add_handler(CommandHandler("ytaudio", yt_audio_handler))
