import fetch from 'node-fetch';

// Pakai API publik - tidak butuh Python/yt-dlp
const APIS = [
  (url) => `https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
  (url) => `https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`,
];

export async function getTiktokInfo(url) {
  // Coba tikwm.com dulu
  try {
    const res = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000,
    });
    const data = await res.json();
    if (data.code === 0 && data.data) {
      return {
        title: data.data.title || 'TikTok Video',
        videoUrl: data.data.hdplay || data.data.play,
        audioUrl: data.data.music,
        cover: data.data.cover,
        noWatermark: true,
      };
    }
  } catch {}

  // Fallback: SSSTik API
  try {
    const res = await fetch('https://ssstik.io/abc?url=dl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://ssstik.io/',
      },
      body: `id=${encodeURIComponent(url)}&locale=id&tt=Y2h1bkFT`,
      timeout: 15000,
    });
    const html = await res.text();
    const match = html.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/);
    if (match) return { videoUrl: match[1], title: 'TikTok Video', noWatermark: true };
  } catch {}

  throw new Error('Gagal mendapatkan link TikTok. Coba lagi nanti.');
}

export async function downloadTiktok(url) {
  const info = await getTiktokInfo(url);
  if (!info.videoUrl) throw new Error('Link video tidak ditemukan.');
  return { url: info.videoUrl, title: info.title, type: 'video' };
}
