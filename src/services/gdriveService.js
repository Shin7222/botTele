import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.join(__dirname, '../../downloads');
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

export async function downloadGdrive(url) {
  const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/];
  let fileId = null;
  for (const p of patterns) {
    const m = url.match(p);
    if (m) { fileId = m[1]; break; }
  }
  if (!fileId) throw new Error('ID file tidak ditemukan dari link tersebut.');

  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

  let res = await fetch(directUrl, { headers, redirect: 'follow' });

  let filename = `gdrive_${fileId}`;
  const disp = res.headers.get('content-disposition') || '';
  const m = disp.match(/filename[^;=\n]*=(['"]?)([^'";\n]+)\1/);
  if (m) filename = m[2].trim();

  const filePath = path.join(DOWNLOAD_DIR, filename);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(buffer));

  if (fs.statSync(filePath).size === 0) {
    fs.unlinkSync(filePath);
    throw new Error('File kosong, kemungkinan link private atau expired.');
  }
  return filePath;
}
