import fs from 'fs';
import path from 'path';
import { InputFile } from 'grammy';

export const MAX_SIZE = 49 * 1024 * 1024;
export const VIDEO_EXT = ['.mp4', '.mkv', '.mov', '.avi', '.webm', '.flv'];
export const AUDIO_EXT = ['.mp3', '.m4a', '.ogg', '.wav', '.flac'];
export const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export async function sendFile(ctx, filePath, caption) {
  const fileSize = fs.statSync(filePath).size;
  const ext = path.extname(filePath).toLowerCase();
  const file = new InputFile(filePath);

  if (fileSize > MAX_SIZE) {
    await ctx.replyWithDocument(file, { caption: caption + '\n⚠️ File besar, dikirim sebagai dokumen.', parse_mode: 'HTML' });
  } else if (VIDEO_EXT.includes(ext)) {
    await ctx.replyWithVideo(file, { caption, parse_mode: 'HTML' });
  } else if (AUDIO_EXT.includes(ext)) {
    await ctx.replyWithAudio(file, { caption, parse_mode: 'HTML' });
  } else if (IMAGE_EXT.includes(ext)) {
    await ctx.replyWithPhoto(file, { caption, parse_mode: 'HTML' });
  } else {
    await ctx.replyWithDocument(file, { caption, parse_mode: 'HTML' });
  }
}
