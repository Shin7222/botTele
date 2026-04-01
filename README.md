# ShinBot JS — Telegram Bot (Pure Node.js)

✅ **Zero Python dependency** — semua pakai JavaScript/Node.js murni.

## Requirements

- Node.js v18+
- `ffmpeg` (untuk tools: compress, merge, sticker, watermark)
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - Windows: download dari https://ffmpeg.org

> **Tidak perlu Python, tidak perlu yt-dlp!**

## Setup

```bash
# 1. Install dependencies
npm install --ignore-scripts

# 2. Buat file .env
cp .env.example .env
# Edit .env → isi TOKEN dengan bot token kamu

# 3. Jalankan
npm start

# Mode development (auto-restart saat file berubah)
npm run dev
```

## Struktur

```
src/
├── config/
│   ├── config.js        # BOT_TOKEN, BOT_NAME, dll
│   └── time.js          # Greeting pagi/siang/sore/malam
├── database/
│   └── db.js            # SQLite via sql.js (pure JS)
├── handlers/
│   ├── downloader/
│   │   ├── tiktok.js    → tikwm.com API
│   │   ├── instagram.js → snapinsta API
│   │   ├── facebook.js  → fdown.net API
│   │   ├── twitter.js   → twitsave API
│   │   ├── capcut.js    → tikwm API
│   │   ├── gdrive.js    → Google Drive direct
│   │   ├── terabox.js   → Terabox API
│   │   └── ytdl.js      → @distube/ytdl-core
│   ├── tools/
│   │   ├── compress.js  → ffmpeg
│   │   ├── merge.js     → ffmpeg
│   │   ├── screenshot.js→ s-shot.ru / thum.io
│   │   ├── sticker.js   → ffmpeg
│   │   └── watermark.js → ffmpeg
│   ├── games/
│   │   └── truthDare.js
│   ├── start.js
│   ├── help.js
│   ├── menu.js
│   ├── idcheck.js
│   └── status.js
├── services/
│   ├── tiktokService.js
│   ├── instagramService.js
│   ├── facebookService.js
│   ├── twitterService.js
│   ├── capcutService.js
│   ├── youtubeService.js
│   ├── gdriveService.js
│   ├── teraboxService.js
│   └── downloadHelper.js
└── main.js
```

## Library utama

| Fungsi | Library |
|--------|---------|
| Telegram Bot | grammy |
| Database SQLite | sql.js (pure JS) |
| YouTube download | @distube/ytdl-core |
| HTTP request | node-fetch |
| Video processing | ffmpeg (system binary) |
| TikTok/IG/FB/TW | Public API scraping |

## Command list

| Command | Fungsi |
|---------|--------|
| /tt | TikTok downloader |
| /ig | Instagram downloader |
| /fb | Facebook downloader |
| /tw | Twitter/X downloader |
| /capcut | CapCut downloader |
| /gdrive | Google Drive downloader |
| /terabox | Terabox downloader |
| /ytaudio | YouTube audio (mp3) |
| /ytvideo | YouTube video (mp4) |
| /compress | Compress video |
| /merge | Gabung video + audio |
| /ss | Screenshot website |
| /sticker | Buat sticker |
| /watermark | Tambah watermark |
| /truth | Truth or Dare |
| /dare | Truth or Dare |
| /tod | Random truth/dare |
| /menu | Menu lengkap |
| /status | Status bot |
| /idchek | Cek Telegram ID |
