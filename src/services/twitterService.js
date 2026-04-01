import fetch from 'node-fetch';

export async function downloadTwitter(url) {
  // Pakai twitsave API
  try {
    const res = await fetch(`https://twitsave.com/info?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 20000,
    });
    const html = await res.text();
    const matches = [...html.matchAll(/href="(https:\/\/video\.twimg\.com\/[^"]+)"/g)];
    if (matches.length > 0) return { url: matches[0][1], type: 'video' };

    const imgMatch = html.match(/href="(https:\/\/pbs\.twimg\.com\/[^"]+\.(jpg|png|webp)[^"]*)"/);
    if (imgMatch) return { url: imgMatch[1], type: 'image' };
  } catch {}

  // Fallback: ssstwitter
  try {
    const res = await fetch('https://ssstwitter.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://ssstwitter.com/',
      },
      body: `id=${encodeURIComponent(url)}&locale=id&tt=Y2h1bkFT`,
      timeout: 20000,
    });
    const html = await res.text();
    const match = html.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/);
    if (match) return { url: match[1], type: 'video' };
  } catch {}

  throw new Error('Gagal download Twitter/X. Coba lagi nanti.');
}
