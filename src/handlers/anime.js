import { InlineKeyboard, InputFile } from "grammy";
import fetch from "node-fetch";
import {
  getAnimeQuote,
  getAnimeImage,
  ANIME_CATEGORIES,
} from "../services/animeService.js";

const CATEGORY_ROWS = [
  ["waifu", "neko", "shinobu", "megumin"],
  ["hug", "pat", "kiss", "cuddle"],
  ["cry", "blush", "smile", "wave"],
  ["bully", "bonk", "punch", "poke"],
  ["dance", "lick", "smug", "cringe"],
];

function buildCategoryKeyboard() {
  const kb = new InlineKeyboard();
  for (const row of CATEGORY_ROWS) {
    for (const cat of row) kb.text(cat, `animepic|${cat}`);
    kb.row();
  }
  return kb;
}

export function registerAnime(bot) {
  bot.command("animequote", async (ctx) => {
    const msg = await ctx.reply("🎴 Mengambil quote anime...");
    try {
      const { quote, character, anime } = await getAnimeQuote();
      await ctx.api.editMessageText(
        ctx.chat.id,
        msg.message_id,
        `🎴 <b>Anime Quote</b>\n\n❝ <i>${quote}</i> ❞\n\n👤 <b>${character}</b>\n📺 <i>${anime}</i>`,
        { parse_mode: "HTML" },
      );
    } catch (e) {
      await ctx.api.editMessageText(
        ctx.chat.id,
        msg.message_id,
        `❌ Gagal ambil quote.\n<code>${e.message}</code>`,
        { parse_mode: "HTML" },
      );
    }
  });

  bot.command("randomanime", async (ctx) => {
    await ctx.reply(
      "🖼️ <b>Random Anime Picture</b>\n\nPilih kategori gambar:",
      {
        parse_mode: "HTML",
        reply_markup: buildCategoryKeyboard(),
      },
    );
  });

  bot.callbackQuery(/^animepic\|/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const category = ctx.callbackQuery.data.split("|")[1];
    const msg = await ctx.reply(`🖼️ Mengambil gambar <b>${category}</b>...`, {
      parse_mode: "HTML",
    });
    try {
      const { url } = await getAnimeImage(category);
      const res = await fetch(url);
      const buffer = Buffer.from(await res.arrayBuffer());
      await ctx.replyWithPhoto(new InputFile(buffer, `${category}.jpg`), {
        caption: `🖼️ <b>Anime: ${category}</b>\n\nKetik /randomanime untuk gambar lain.`,
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard()
          .text("🔄 Gambar Lain", `animepic|${category}`)
          .text("📂 Ganti Kategori", "animepic_menu"),
      });
      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    } catch (e) {
      await ctx.api.editMessageText(
        ctx.chat.id,
        msg.message_id,
        `❌ Gagal ambil gambar.\n<code>${e.message}</code>`,
        { parse_mode: "HTML" },
      );
    }
  });

  bot.callbackQuery("animepic_menu", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("🖼️ <b>Pilih kategori gambar:</b>", {
      parse_mode: "HTML",
      reply_markup: buildCategoryKeyboard(),
    });
  });
}
