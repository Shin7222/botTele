import fetch from 'node-fetch';

export async function downloadCapcut(url) {
  // CapCut punya endpoint API publik
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000,
    });
    const data = await res.json();
    if (data.code === 0 && data.data?.play) {
      return { url: data.data.hdplay || data.data.play, type: 'video' };
    }
  } catch {}

  // Fallback: scrape langsung
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      },
      timeout: 15000,
    });
    const html = await res.text();
    const match = html.match(/"videoUrl"\s*:\s*"([^"]+)"/);
    if (match) return { url: match[1].replace(/\\/g, ''), type: 'video' };
  } catch {}

  throw new Error('Gagal download CapCut. Coba lagi nanti.');
}
