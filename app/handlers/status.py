import time
import psutil
from telegram import Update
from telegram.ext import ContextTypes, CommandHandler

# Fungsi untuk mengubah detik menjadi format Jam:Menit:Detik
def get_readable_time(seconds: int) -> str:
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    d, h = divmod(h, 24)
    
    parts = []
    if d > 0: parts.append(f"{d}d")
    if h > 0: parts.append(f"{h}h")
    if m > 0: parts.append(f"{m}m")
    parts.append(f"{s}s")
    return " ".join(parts)

# Fungsi untuk mengubah bytes ke unit yang paling sesuai (KB, MB, GB)
def get_readable_size(bytes: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes < 1024:
            return f"{bytes:.2f} {unit}"
        bytes /= 1024

async def status_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Hitung uptime (asumsi bot mulai saat script jalan)
    # Jika ingin uptime bot yang presisi, simpan waktu start di variabel global saat main()
    current_time = time.time()
    uptime_seconds = int(current_time - psutil.boot_time()) # Ini uptime Sistem, 
    # Gunakan variabel 'start_time' global jika ingin uptime Proses Bot saja.

    # Statistik Memori & CPU
    process = psutil.Process()
    mem_info = process.memory_info().rss  # Mengambil penggunaan RAM proses ini saja
    cpu_usage = psutil.cpu_percent(interval=0.5)

    text = (
        "<b>📊 Bot System Status</b>\n"
        "----------------------------\n"
        f"<b>⏱ Uptime:</b> <code>{get_readable_time(uptime_seconds)}</code>\n"
        f"<b>🧠 Memory:</b> <code>{get_readable_size(mem_info)}</code>\n"
        f"<b>⚡ CPU:</b> <code>{cpu_usage}%</code>\n"
        "----------------------------"
    )
    await update.message.reply_text(text, parse_mode="HTML")

def register_status_handler(app):
    app.add_handler(CommandHandler("status", status_handler))