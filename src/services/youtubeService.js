import playdl from "play-dl";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.join(__dirname, "../../downloads");
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

export async function downloadYoutube(url, mode = "video") {
  const id = uuidv4();

  // Validasi URL YouTube
  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  if (!ytRegex.test(url)) throw new Error("URL bukan YouTube yang valid.");

  if (mode === "audio") {
    const outPath = path.join(DOWNLOAD_DIR, `yt_${id}.mp3`);

    const stream = await playdl.stream(url, { quality: 0 }); // quality 0 = audio only best

    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(outPath);
      stream.stream.pipe(file);
      stream.stream.on("error", reject);
      file.on("finish", resolve);
      file.on("error", reject);
    });

    return outPath;
  } else {
    const outPath = path.join(DOWNLOAD_DIR, `yt_${id}.mp4`);

    // play-dl tidak support video+audio merge langsung
    // Download audio stream dulu (mp4/video terbatas di play-dl)
    const stream = await playdl.stream(url, { quality: 2 }); // quality 2 = 360p

    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(outPath);
      stream.stream.pipe(file);
      stream.stream.on("error", reject);
      file.on("finish", resolve);
      file.on("error", reject);
    });

    return outPath;
  }
}

export async function getYoutubeInfo(url) {
  const info = await playdl.video_info(url);
  return {
    title: info.video_details.title,
    duration: info.video_details.durationInSec,
    thumbnail: info.video_details.thumbnails?.[0]?.url,
  };
}
