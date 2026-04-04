# 🤖 BotTele JS

Bot Telegram berbasis **Node.js murni** — tanpa Python, tanpa yt-dlp.

---

## ⚙️ Requirements

- Node.js v18+
- `ffmpeg` → untuk fitur Tools (compress, merge, sticker, watermark)
  - Windows: download di https://ffmpeg.org → tambah ke PATH
  - Ubuntu: `sudo apt install ffmpeg`

---

## 🚀 Setup

```bash
# 1. Install dependencies
npm install --ignore-scripts

# 2. Buat file .env
cp .env.example .env
# Edit .env → isi BOT_TOKEN

# 3. Jalankan
node index.js

# Mode dev (auto-restart)
node --watch index.js
```

---

## 📄 Isi .env

```env
BOT_TOKEN=123456789:ABCDefgh...
```

---

## 📋 Daftar Fitur

### 🎬 Downloader

| Command | Fungsi | Status |
|---------|--------|--------|
| `/tt` | Download video TikTok tanpa watermark | ✅ Aktif |
| `/ig` | Download video/foto Instagram | ✅ Aktif |
| `/fb` | Download video Facebook | ✅ Aktif |
| `/tw` | Download video Twitter/X | ✅ Aktif |
| `/capcut` | Download template CapCut | ✅ Aktif |
| `/gdrive` | Download file Google Drive (publik) | ✅ Aktif |
| `/terabox` | Download file Terabox | ✅ Aktif |
| `/ytaudio` | Download audio YouTube (mp3) | ❌ Butuh cookies.txt |
| `/ytvideo` | Download video YouTube (mp4) | ❌ Butuh cookies.txt |

> **Catatan YouTube:** Sejak 2024, YouTube memblokir semua request tanpa login.
> Taruh file `cookies.txt` dari browser di root project untuk mengaktifkan fitur ini.
> Cara ambil cookies: install extension **"Get cookies.txt LOCALLY"** di Chrome/Edge → login YouTube → export.

---

### 🧠 Tools

| Command | Fungsi | Status |
|---------|--------|--------|
| `/compress` | Kompres ukuran video (3 level kualitas) | ✅ Aktif |
| `/merge` | Gabungkan video + audio menjadi satu file | ✅ Aktif |
| `/ss` | Screenshot tampilan website | ✅ Aktif |
| `/sticker` | Buat sticker Telegram dari foto/GIF | ✅ Aktif |
| `/watermark` | Tambah teks watermark ke foto/video | ✅ Aktif |

> **Catatan Tools:** Semua fitur tools membutuhkan `ffmpeg` terinstall di sistem.

---

### 🎮 Games

| Command | Fungsi | Status |
|---------|--------|--------|
| `/truth` | Dapat pertanyaan Truth acak | ✅ Aktif |
| `/dare` | Dapat tantangan Dare acak | ✅ Aktif |
| `/tod` | Random antara Truth atau Dare | ✅ Aktif |

---

### ℹ️ Umum

| Command | Fungsi | Status |
|---------|--------|--------|
| `/start` | Mulai bot | ✅ Aktif |
| `/menu` | Tampilkan menu lengkap + info bot | ✅ Aktif |
| `/help` | Bantuan singkat | ✅ Aktif |
| `/idchek` | Cek Telegram User ID kamu | ✅ Aktif |
| `/status` | Lihat uptime & penggunaan memori bot | ✅ Aktif |

---

## 🏗️ Struktur Project

```
botTele-js/
├── index.js                  ← Entry point utama
├── package.json
├── .env                      ← Token bot (buat sendiri)
├── cookies.txt               ← Opsional, untuk YouTube
├── downloads/                ← Folder temporary file download
├── bot.db                    ← Database SQLite (auto-dibuat)
└── src/
    ├── config/
    │   ├── config.js         ← BOT_TOKEN, BOT_NAME, ADMIN_LIST
    │   └── time.js           ← Greeting pagi/siang/sore/malam
    ├── database/
    │   └── db.js             ← SQLite via sql.js, cek limit harian
    ├── handlers/
    │   ├── downloader/       ← tt, ig, fb, tw, capcut, gdrive, terabox, ytdl
    │   ├── tools/            ← compress, merge, screenshot, sticker, watermark
    │   ├── games/            ← truth, dare, tod
    │   ├── start.js
    │   ├── help.js
    │   ├── menu.js
    │   ├── idcheck.js
    │   └── status.js
    └── services/
        ├── tiktokService.js
        ├── instagramService.js
        ├── facebookService.js
        ├── twitterService.js
        ├── capcutService.js
        ├── youtubeService.js
        ├── gdriveService.js
        ├── teraboxService.js
        └── downloadHelper.js
```

---

## 📦 Library Utama

| Library | Fungsi |
|---------|--------|
| `grammy` | Framework Telegram Bot |
| `sql.js` | Database SQLite (pure JS, tanpa native compile) |
| `play-dl` | Stream/download YouTube |
| `node-fetch` | HTTP request untuk scraping |
| `dotenv` | Baca file `.env` |
| `uuid` | Generate nama file unik |

---

## 📊 Limit Download

User biasa mendapat **10 download per hari** (reset tiap tengah malam).
Limit disimpan di `bot.db` secara otomatis.

---

## 🛠️ Troubleshooting

| Error | Solusi |
|-------|--------|
| `BOT_TOKEN tidak ditemukan` | Pastikan file `.env` ada di root project dan isi `BOT_TOKEN=...` |
| `ffmpeg not found` | Install ffmpeg dan pastikan sudah ada di PATH |
| YouTube: `Sign in to confirm` | Taruh `cookies.txt` dari browser di root project |
| TikTok/IG/FB gagal | API pihak ketiga kadang down, coba lagi beberapa menit |
