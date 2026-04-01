import fetch from 'node-fetch';

export async function downloadFacebook(url) {
  // Pakai fdown.net API
  try {
    const res = await fetch('https://fdown.net/download.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://fdown.net/',
      },
      body: `URLz=${encodeURIComponent(url)}`,
      timeout: 20000,
    });
    const html = await res.text();
    const hdMatch = html.match(/id="hdlink"[^>]*href="([^"]+)"/);
    const sdMatch = html.match(/id="sdlink"[^>]*href="([^"]+)"/);
    const videoUrl = hdMatch?.[1] || sdMatch?.[1];
    if (videoUrl) return { url: videoUrl.replace(/&amp;/g, '&'), type: 'video' };
  } catch {}

  // Fallback: getfvid.com
  try {
    const res = await fetch('https://getfvid.com/downloader', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://getfvid.com/',
      },
      body: `url=${encodeURIComponent(url)}`,
      timeout: 20000,
    });
    const html = await res.text();
    const match = html.match(/href="(https:\/\/[^"]*\.mp4[^"]*)"/);
    if (match) return { url: match[1], type: 'video' };
  } catch {}

  throw new Error('Gagal download Facebook. Pastikan video tidak private.');
}
