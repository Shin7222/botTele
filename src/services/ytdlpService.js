import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.join(__dirname, '../../downloads');
const COOKIES_PATH = path.join(__dirname, '../../cookies.txt');

fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

function hasCookies() { return fs.existsSync(COOKIES_PATH); }

function runYtdlp(args) {
  return new Promise((resolve, reject) => {
    execFile('yt-dlp', args, { maxBuffer: 100 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout.trim());
    });
  });
}

function findNewest(prefix) {
  const files = fs.readdirSync(DOWNLOAD_DIR)
    .filter(f => f.startsWith(prefix))
    .map(f => ({ f, t: fs.statSync(path.join(DOWNLOAD_DIR, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  if (!files.length) throw new Error('File tidak ditemukan setelah download');
  return path.join(DOWNLOAD_DIR, files[0].f);
}

export async function downloadTiktok(url) {
  const id = uuidv4();
  const outPath = path.join(DOWNLOAD_DIR, `tt_${id}.mp4`);
  const args = ['-o', outPath, '--format', 'mp4', '--no-playlist', '--quiet'];
  if (hasCookies()) args.push('--cookies', COOKIES_PATH);
  args.push(url);
  await runYtdlp(args);
  return outPath;
}

export async function downloadInstagram(url) {
  const id = uuidv4();
  const args = ['--no-playlist', '--quiet', '-o', path.join(DOWNLOAD_DIR, `ig_${id}.%(ext)s`)];
  if (hasCookies()) args.push('--cookies', COOKIES_PATH);
  args.push(url);
  await runYtdlp(args);
  return findNewest(`ig_${id}`);
}

export async function downloadFacebook(url) {
  const id = uuidv4();
  const args = ['--format', 'best[ext=mp4]/best', '--no-playlist', '--quiet', '-o', path.join(DOWNLOAD_DIR, `fb_${id}.%(ext)s`)];
  if (hasCookies()) args.push('--cookies', COOKIES_PATH);
  args.push(url);
  await runYtdlp(args);
  return findNewest(`fb_${id}`);
}

export async function downloadTwitter(url) {
  const id = uuidv4();
  const args = ['--format', 'bestvideo+bestaudio/best', '--merge-output-format', 'mp4', '--no-playlist', '--quiet', '-o', path.join(DOWNLOAD_DIR, `tw_${id}.%(ext)s`)];
  if (hasCookies()) args.push('--cookies', COOKIES_PATH);
  args.push(url);
  await runYtdlp(args);
  return findNewest(`tw_${id}`);
}

export async function downloadCapcut(url) {
  const id = uuidv4();
  const args = ['--format', 'bestvideo+bestaudio/best', '--merge-output-format', 'mp4', '--no-playlist', '--quiet', '-o', path.join(DOWNLOAD_DIR, `cc_${id}.%(ext)s`)];
  if (hasCookies()) args.push('--cookies', COOKIES_PATH);
  args.push(url);
  await runYtdlp(args);
  return findNewest(`cc_${id}`);
}

export async function downloadYt(url, mode = 'video') {
  const id = uuidv4();
  const args = ['--no-playlist', '--quiet', '-o', path.join(DOWNLOAD_DIR, `yt_${id}.%(ext)s`)];
  if (mode === 'audio') {
    args.push('--format', 'bestaudio/best', '--extract-audio', '--audio-format', 'mp3');
  } else {
    args.push('--format', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', '--merge-output-format', 'mp4');
  }
  args.push(url);
  await runYtdlp(args);
  return findNewest(`yt_${id}`);
}
