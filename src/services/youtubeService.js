import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { execFile } from 'child_process';
import { promisify } from 'util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.join(__dirname, '../../downloads');
const execFileAsync = promisify(execFile);

fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

export async function downloadYoutube(url, mode = 'video') {
  const id = uuidv4();

  if (mode === 'audio') {
    const outPath = path.join(DOWNLOAD_DIR, `yt_${id}.mp3`);
    await new Promise((resolve, reject) => {
      const stream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' });
      const file = fs.createWriteStream(outPath);
      stream.pipe(file);
      stream.on('error', reject);
      file.on('finish', resolve);
      file.on('error', reject);
    });
    return outPath;
  } else {
    const outPath = path.join(DOWNLOAD_DIR, `yt_${id}.mp4`);
    await new Promise((resolve, reject) => {
      const stream = ytdl(url, {
        quality: 'highestvideo',
        filter: (f) => f.container === 'mp4' && f.hasAudio,
      });
      const file = fs.createWriteStream(outPath);
      stream.pipe(file);
      stream.on('error', reject);
      file.on('finish', resolve);
      file.on('error', reject);
    });
    return outPath;
  }
}
