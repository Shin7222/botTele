import fetch from "node-fetch";

// ========================
// QUOTE — animechan.io
// ========================
export async function getAnimeQuote() {
  const res = await fetch("https://animechan.io/api/v1/quotes/random", {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 10000,
  });
  if (!res.ok) throw new Error("Gagal ambil quote dari animechan.");
  const data = await res.json();
  return {
    quote: data.data?.content,
    character: data.data?.character?.name,
    anime: data.data?.anime?.name,
  };
}

// ========================
// GAMBAR — waifu.pics
// ========================
export const ANIME_CATEGORIES = {
  // SFW
  waifu: "waifu",
  neko: "neko",
  shinobu: "shinobu",
  megumin: "megumin",
  bully: "bully",
  cuddle: "cuddle",
  cry: "cry",
  hug: "hug",
  kiss: "kiss",
  lick: "lick",
  pat: "pat",
  smug: "smug",
  bonk: "bonk",
  blush: "blush",
  smile: "smile",
  wave: "wave",
  punch: "punch",
  poke: "poke",
  dance: "dance",
  cringe: "cringe",
};

export async function getAnimeImage(category = "waifu") {
  const cat = ANIME_CATEGORIES[category] || "waifu";
  const res = await fetch(`https://api.waifu.pics/sfw/${cat}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 10000,
  });
  if (!res.ok) throw new Error(`Gagal ambil gambar kategori "${cat}".`);
  const data = await res.json();
  return { url: data.url, category: cat };
}
