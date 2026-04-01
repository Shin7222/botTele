import os
import re
import requests

BASE_DIR      = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOWNLOAD_PATH = os.path.join(BASE_DIR, "downloads")

os.makedirs(DOWNLOAD_PATH, exist_ok=True)


def format_size(size: int) -> str:
    if size >= 1024 * 1024 * 1024:
        return f"{size / (1024**3):.1f} GB"
    elif size >= 1024 * 1024:
        return f"{size / (1024**2):.1f} MB"
    return f"{size / 1024:.1f} KB"


def download_terabox(url: str) -> dict:
    """
    Return dict:
    {
        "filename"    : str,
        "size"        : int,
        "size_str"    : str,
        "download_url": str,
        "file_path"   : str | None  (None jika file > 49MB)
    }
    """
    session = requests.Session()
    headers = {
        "User-Agent"     : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept"         : "application/json, text/plain, */*",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8",
        "Referer"        : "https://www.terabox.com/",
    }

    response  = session.get(url, headers=headers, allow_redirects=True, timeout=15)
    final_url = response.url

    # Ekstrak surl
    surl_match = re.search(r"surl=([^&]+)", final_url)
    if not surl_match:
        surl_match = re.search(r"surl=([^&\"']+)", response.text)

    if not surl_match:
        raise Exception("Tidak bisa mengekstrak surl dari link tersebut.")

    surl = surl_match.group(1)

    # Hit API Terabox
    api_url  = f"https://www.terabox.com/api/shorturlinfo?app_id=250528&shorturl={surl}&root=1"
    api_resp = session.get(api_url, headers=headers, timeout=15)
    api_data = api_resp.json()

    if api_data.get("errno") not in [0, None]:
        raise Exception(f"API Error: {api_data.get('errmsg', 'Unknown error')}")

    file_list = api_data.get("list", [])
    if not file_list:
        raise Exception("Tidak ada file yang ditemukan.")

    file_info = file_list[0]
    filename  = file_info.get("server_filename", "terabox_file")
    file_size = int(file_info.get("size", 0))
    dlink     = file_info.get("dlink", "")

    if not dlink:
        raise Exception("Download link tidak tersedia.")

    # File kecil → langsung download
    if file_size <= 49 * 1024 * 1024:
        file_path  = os.path.join(DOWNLOAD_PATH, filename)
        dl_headers = {**headers, "Referer": final_url}
        dl_resp    = session.get(dlink, headers=dl_headers, stream=True, timeout=60)

        with open(file_path, "wb") as f:
            for chunk in dl_resp.iter_content(chunk_size=32768):
                if chunk:
                    f.write(chunk)

        return {
            "filename"    : filename,
            "size"        : file_size,
            "size_str"    : format_size(file_size),
            "download_url": dlink,
            "file_path"   : file_path,
        }

    # File besar → return link saja
    return {
        "filename"    : filename,
        "size"        : file_size,
        "size_str"    : format_size(file_size),
        "download_url": dlink,
        "file_path"   : None,
    }
