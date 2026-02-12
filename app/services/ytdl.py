import yt_dlp
import os

def download_media(url, mode='video', progress_callback=None):
    if not os.path.exists('downloads'):
        os.makedirs('downloads')

    # Fungsi internal untuk menangkap progres dari yt-dlp
    def hook(d):
        if d['status'] == 'downloading' and progress_callback:
            downloaded = d.get('downloaded_bytes', 0)
            total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
            if total > 0:
                percentage = (downloaded / total) * 100
                progress_callback(percentage)

    ydl_opts = {
        'restrictfilenames': True, 
        'outtmpl': 'downloads/%(title)s.%(ext)s',
        'quiet': True,
        'noplaylist': True,
        'progress_hooks': [hook], # Menghubungkan hook ke fungsi download
    }

    if mode == 'audio':
        ydl_opts.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        })
    else:
        # Menambahkan format yang lebih kompatibel untuk Telegram
        ydl_opts.update({
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        })

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        file_path = ydl.prepare_filename(info)
        
        if mode == 'audio':
            # Pastikan path mengarah ke file .mp3 setelah dikonversi FFmpeg
            file_path = os.path.splitext(file_path)[0] + ".mp3"
        
        return file_path