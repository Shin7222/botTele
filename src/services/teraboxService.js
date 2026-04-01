import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.join(__dirname, '../../downloads');
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

export function formatSize(size) {
  if (size >= 1024**3) return `${(size/1024**3).toFixed(1)} GB`;
  if (size >= 1024**2) return `${(size/1024**2).toFixed(1)} MB`;
  return `${(size/1024).toFixed(1)} KB`;
}

export async function downloadTerabox(url) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'id-ID,id;q=0.9',
    'Referer': 'https://www.terabox.com/',
  };

  const res = await fetch(url, { headers, redirect: 'follow' });
  const finalUrl = res.url;

  let surl = finalUrl.match(/surl=([^&]+)/)?.[1];
  if (!surl) {
    const text = await res.text();
    surl = text.match(/surl=([^&"']+)/)?.[1];
  }
  if (!surl) throw new Error('Tidak bisa mengekstrak surl dari link tersebut.');

  const apiUrl = `https://www.terabox.com/api/shorturlinfo?app_id=250528&shorturl=${surl}&root=1`;
  const apiRes = await fetch(apiUrl, { headers });
  const apiData = await apiRes.json();

  if (![0, null, undefined].includes(apiData.errno)) throw new Error(`API Error: ${apiData.errmsg || 'Unknown'}`);

  const fileList = apiData.list || [];
  if (!fileList.length) throw new Error('Tidak ada file yang ditemukan.');

  const fileInfo = fileList[0];
  const filename = fileInfo.server_filename || 'terabox_file';
  const fileSize = parseInt(fileInfo.size || 0);
  const dlink = fileInfo.dlink;

  if (!dlink) throw new Error('Download link tidak tersedia.');

  if (fileSize <= 49 * 1024 * 1024) {
    const filePath = path.join(DOWNLOAD_DIR, filename);
    const dlRes = await fetch(dlink, { headers: { ...headers, Referer: finalUrl } });
    const buffer = await dlRes.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return { filename, size: fileSize, sizeStr: formatSize(fileSize), downloadUrl: dlink, filePath };
  }

  return { filename, size: fileSize, sizeStr: formatSize(fileSize), downloadUrl: dlink, filePath: null };
}
