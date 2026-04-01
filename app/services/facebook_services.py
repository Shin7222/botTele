import yt_dlp
import os

BASE_DIR      = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOWNLOAD_PATH = os.path.join(BASE_DIR, "downloads")
COOKIES_PATH  = os.path.join(BASE_DIR, "cookies.txt")

os.makedirs(DOWNLOAD_PATH, exist_ok=True)


def _get_filepath(ydl, info) -> str:
    if "entries" in info:
        info = info["entries"][0]
    if "requested_downloads" in info:
        return info["requested_downloads"][0]["filepath"]
    return ydl.prepare_filename(info)


def download_facebook(url: str) -> str:
    ydl_opts = {
        "format"    : "best[ext=mp4]/best",
        "outtmpl"   : f"{DOWNLOAD_PATH}/fb_%(id)s.%(ext)s",
        "quiet"     : True,
        "noplaylist": True,
        "cookiefile": COOKIES_PATH if os.path.exists(COOKIES_PATH) else None,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        return _get_filepath(ydl, info)
