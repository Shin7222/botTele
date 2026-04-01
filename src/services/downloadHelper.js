// Helper: download URL langsung ke file (untuk platform yang return direct URL)
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.join(__dirname, '../../downloads');
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

export async function downloadUrlToFile(url, prefix = 'dl', ext = null) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': new URL(url).origin,
  };

  const res = await fetch(url, { headers, timeout: 120000 });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // Tentukan ekstensi dari content-type jika tidak ada
  if (!ext) {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('mp4') || ct.includes('video')) ext = '.mp4';
    else if (ct.includes('mp3') || ct.includes('audio/mpeg')) ext = '.mp3';
    else if (ct.includes('jpg') || ct.includes('jpeg')) ext = '.jpg';
    else if (ct.includes('png')) ext = '.png';
    else if (ct.includes('webp')) ext = '.webp';
    else ext = '.mp4';
  }

  const filePath = path.join(DOWNLOAD_DIR, `${prefix}_${uuidv4()}${ext}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(buffer));

  if (fs.statSync(filePath).size === 0) {
    fs.unlinkSync(filePath);
    throw new Error('File kosong setelah download.');
  }

  return filePath;
}
