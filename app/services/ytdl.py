import yt_dlp
import os

def download_media(url, mode='video'):
    if not os.path.exists('downloads'):
        os.makedirs('downloads')

    ydl_opts = {
        'restrictfilenames': True, 
        'outtmpl': 'downloads/%(title)s.%(ext)s',
        'quiet': True,
        'noplaylist': True,
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
        ydl_opts.update({
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        })

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        file_path = ydl.prepare_filename(info)
        
        if mode == 'audio':
            # Pastikan ekstensi akhir adalah .mp3
            file_path = os.path.splitext(file_path)[0] + ".mp3"
        
        return file_path