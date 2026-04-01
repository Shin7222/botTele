import os
import asyncio
import tempfile
import re
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, CommandHandler
from app.database.db import check_limit

READ_TIMEOUT    = 120
WRITE_TIMEOUT   = 120
CONNECT_TIMEOUT = 30

# API screenshot gratis
SCREENSHOT_APIS = [
    {
        "name": "screenshotone",
        "url" : "https://api.screenshotone.com/take?url={url}&full_page=false&viewport_width=1280&viewport_height=800&format=jpg&image_quality=80&access_key=free",
    },
    {
        "name": "htmlcsstoimage",
        "url" : "https://hcti.io/v1/image",
    },
    {
        "name": "s-shot",
        "url" : "https://s-shot.ru/900x600/JPEG/900/Z1/?{url}",
    },
]


def is_valid_url(url: str) -> bool:
    pattern = re.compile(
        r'^https?://'
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'
        r'localhost|'
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'
        r'(?::\d+)?'
        r'(?:/?|[/?]\S+)$', re.IGNORECASE
    )
    return bool(pattern.match(url))


def take_screenshot(url: str) -> str:
    tmp_dir   = tempfile.mkdtemp()
    headers   = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

    # Coba s-shot.ru (tidak butuh API key)
    try:
        api_url  = f"https://s-shot.ru/900x600/JPEG/900/Z1/?{url}"
        response = requests.get(api_url, headers=headers, timeout=30, stream=True)

        if response.status_code == 200 and "image" in response.headers.get("Content-Type", ""):
            file_path = os.path.join(tmp_dir, "screenshot.jpg")
            with open(file_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            if os.path.getsize(file_path) > 1000:  # minimal 1KB
                return file_path
    except Exception:
        pass

    # Fallback: miniature.io
    try:
        encoded  = requests.utils.quote(url, safe="")
        api_url  = f"https://api.miniature.io/?width=1280&height=800&screen=1280x800&url={encoded}"
        response = requests.get(api_url, headers=headers, timeout=30, stream=True)

        if response.status_code == 200:
            file_path = os.path.join(tmp_dir, "screenshot.jpg")
            with open(file_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            if os.path.getsize(file_path) > 1000:
                return file_path
    except Exception:
        pass

    # Fallback: image.thum.io (gratis, tidak butuh API key)
    try:
        encoded  = requests.utils.quote(url, safe="")
        api_url  = f"https://image.thum.io/get/width/1280/crop/800/{encoded}"
        response = requests.get(api_url, headers=headers, timeout=30, stream=True)

        if response.status_code == 200:
            file_path = os.path.join(tmp_dir, "screenshot.jpg")
            with open(file_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            if os.path.getsize(file_path) > 1000:
                return file_path
    except Exception:
        pass

    raise Exception("Semua layanan screenshot gagal. Coba lagi nanti.")


async def screenshot(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text(
            "📸 <b>Website Screenshot</b>\n\n"
            "<b>Cara pakai:</b>\n"
            "<code>/screenshot &lt;url&gt;</code>\n\n"
            "<b>Contoh:</b>\n"
            "<code>/screenshot https://google.com</code>\n"
            "<code>/screenshot https://tokopedia.com</code>\n\n"
            "✅ Screenshot resolusi 1280x800\n"
            "✅ Format JPG\n"
            "⚠️ Beberapa website mungkin tidak bisa di-screenshot",
            parse_mode="HTML"
        )
        return

    url = context.args[0]

    # Tambahkan https jika tidak ada
    if not url.startswith("http"):
        url = "https://" + url

    if not is_valid_url(url):
        await update.message.reply_text(
            "❌ URL tidak valid.\n\n"
            "Pastikan URL benar, contoh:\n"
            "<code>https://google.com</code>",
            parse_mode="HTML"
        )
        return

    # Blokir URL berbahaya
    blocked = ["localhost", "127.0.0.1", "192.168.", "10.0.", "0.0.0.0"]
    if any(b in url for b in blocked):
        await update.message.reply_text("❌ URL tidak diizinkan.")
        return

    boleh, pesan_error = check_limit(update.effective_user.id)
    if not boleh:
        await update.message.reply_text(pesan_error, parse_mode="HTML")
        return

    msg       = await update.message.reply_text(f"📸 Mengambil screenshot dari:\n<code>{url}</code>", parse_mode="HTML")
    file_path = None

    try:
        file_path = await asyncio.to_thread(take_screenshot, url)

        file_size = os.path.getsize(file_path)

        # Ambil domain untuk caption
        domain = url.split("/")[2] if "/" in url else url

        await msg.edit_text("📤 Mengirim screenshot...")

        with open(file_path, "rb") as f:
            await update.message.reply_photo(
                photo=f,
                caption=(
                    f"📸 <b>Screenshot</b>\n"
                    f"🌐 URL: <code>{url[:100]}</code>\n"
                    f"📏 Ukuran: {file_size // 1024} KB"
                ),
                parse_mode="HTML",
                read_timeout=READ_TIMEOUT,
                write_timeout=WRITE_TIMEOUT,
                connect_timeout=CONNECT_TIMEOUT,
            )

        await msg.delete()

    except Exception as e:
        await msg.edit_text(
            f"❌ Gagal screenshot.\n\n"
            f"<code>{e}</code>\n\n"
            f"Kemungkinan website memblokir akses bot.",
            parse_mode="HTML"
        )

    finally:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)

def ss_handler(app):
    app.add_handler(CommandHandler("ss", screenshot))