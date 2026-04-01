import os
import asyncio
from telegram import Update
from telegram.ext import ContextTypes
from app.services.capcut_services import download_capcut
from app.database.db import check_limit

MAX_SIZE        = 49 * 1024 * 1024
READ_TIMEOUT    = 300
WRITE_TIMEOUT   = 300
CONNECT_TIMEOUT = 60


async def capcut(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text(
            "✂️ <b>CapCut Downloader</b>\n\n"
            "Gunakan: /capcut &lt;link&gt;\n\n"
            "Contoh:\n"
            "<code>/capcut https://www.capcut.com/t/xxxxx/</code>\n\n"
            "✅ Download video CapCut tanpa watermark",
            parse_mode="HTML"
        )
        return

    url = context.args[0]

    if not any(domain in url for domain in ["capcut.com", "capcut.net"]):
        await update.message.reply_text("❌ Link tidak valid. Gunakan link dari capcut.com")
        return

    boleh, pesan_error = check_limit(update.effective_user.id)
    if not boleh:
        await update.message.reply_text(pesan_error, parse_mode="HTML")
        return

    msg       = await update.message.reply_text("📥 Downloading CapCut...")
    file_path = None

    try:
        file_path = await asyncio.to_thread(download_capcut, url)

        if not os.path.exists(file_path):
            raise FileNotFoundError("File tidak ditemukan setelah download.")

        file_size = os.path.getsize(file_path)

        await msg.edit_text("📤 Mengirim file...")

        with open(file_path, "rb") as f:
            if file_size > MAX_SIZE:
                await update.message.reply_document(
                    document=f,
                    caption="✂️ CapCut\n⚠️ File besar, dikirim sebagai dokumen.",
                    read_timeout=READ_TIMEOUT,
                    write_timeout=WRITE_TIMEOUT,
                    connect_timeout=CONNECT_TIMEOUT,
                )
            else:
                await update.message.reply_video(
                    video=f,
                    caption="✂️ CapCut",
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
