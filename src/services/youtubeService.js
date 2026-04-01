import playdl from "play-dl";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.join(__dirname, "../../downloads");
const COOKIES_PATH = path.join(__dirname, "../../cookies.txt");

fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

// Set cookies jika ada
async function setupCookies() {
  if (fs.existsSync(COOKIES_PATH)) {
    try {
      await playdl.setToken({
        youtube: { cookie: fs.readFileSync(COOKIES_PATH, "utf-8") },
      });
    } catch {}
  }
}
await setupCookies();

export async function getYoutubeInfo(url) {
  const info = await playdl.video_info(url);
  return {
    title: info.video_details.title || "YouTube",
    duration: info.video_details.durationInSec,
    thumbnail: info.video_details.thumbnails?.[0]?.url,
  };
}

export async function downloadYoutube(url, mode = "video") {
  const id = uuidv4();

  if (mode === "audio") {
    const outPath = path.join(DOWNLOAD_DIR, `yt_${id}.mp3`);
    const stream = await playdl.stream(url, { quality: 0 });
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
    const stream = await playdl.stream(url, { quality: 2 });
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
