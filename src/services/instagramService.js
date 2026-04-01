import fetch from 'node-fetch';

export async function downloadInstagram(url) {
  // Pakai saveinsta / snapinsta API publik
  try {
    const res = await fetch('https://snapinsta.app/api/ajaxSearch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://snapinsta.app/',
      },
      body: `q=${encodeURIComponent(url)}&t=media&lang=id`,
      timeout: 20000,
    });
    const data = await res.json();
    if (data.status === 'ok' && data.data) {
      const html = data.data;
      // Ambil semua link video/image dari HTML response
      const videoMatches = [...html.matchAll(/href="(https:\/\/[^"]*\.mp4[^"]*)"/g)];
      const imgMatches   = [...html.matchAll(/src="(https:\/\/[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/g)];

      if (videoMatches.length > 0) return { url: videoMatches[0][1], type: 'video' };
      if (imgMatches.length > 0)   return { url: imgMatches[0][1],   type: 'image' };
    }
  } catch {}

  // Fallback: igram.world API
  try {
    const res = await fetch(`https://igram.world/api/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
      body: JSON.stringify({ url }),
      timeout: 20000,
    });
    const data = await res.json();
    if (data.medias?.length > 0) {
      const media = data.medias[0];
      return { url: media.url, type: media.type === 'image' ? 'image' : 'video' };
    }
  } catch {}

  throw new Error('Gagal download Instagram. Pastikan link publik dan coba lagi.');
}
