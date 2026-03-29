import os
import re
import requests

BASE_DIR      = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOWNLOAD_PATH = os.path.join(BASE_DIR, "downloads")

os.makedirs(DOWNLOAD_PATH, exist_ok=True)


def download_gdrive(url: str) -> str:
    patterns = [
        r"/file/d/([a-zA-Z0-9_-]+)",
        r"id=([a-zA-Z0-9_-]+)",
        r"/d/([a-zA-Z0-9_-]+)",
    ]

    file_id = None
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            file_id = match.group(1)
            break

    if not file_id:
        raise Exception("ID file tidak ditemukan dari link tersebut.")

    direct_url = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"
    return _gdrive_download(direct_url, file_id)


def _gdrive_download(url: str, file_id: str) -> str:
    session  = requests.Session()
    headers  = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    response = session.get(url, headers=headers, stream=True, allow_redirects=True)

    # Handle virus scan konfirmasi untuk file besar
    if "confirm" in response.url or "virus" in response.text.lower():
        confirm = re.search(r'confirm=([0-9A-Za-z_]+)', response.url)
        if confirm:
            url      = f"https://drive.google.com/uc?export=download&id={file_id}&confirm={confirm.group(1)}"
            response = session.get(url, headers=headers, stream=True)

    # Ambil nama file dari header
    filename    = f"gdrive_{file_id}"
    disposition = response.headers.get("Content-Disposition", "")
    if "filename" in disposition:
        match = re.search(r'filename[^;=\n]*=(["\']?)([^"\'\n;]+)\1', disposition)
        if match:
            filename = match.group(2).strip()

    file_path = os.path.join(DOWNLOAD_PATH, filename)

    with open(file_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=32768):
            if chunk:
                f.write(chunk)

    if os.path.getsize(file_path) == 0:
        os.remove(file_path)
        raise Exception("File kosong, kemungkinan link private atau expired.")

    return file_path
