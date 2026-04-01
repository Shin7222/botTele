import fs from "fs";
import { InputFile } from "grammy";
import {
  downloadYoutube,
  getYoutubeInfo,
} from "../../services/youtubeService.js";

export function registerYtdl(bot) {
  async function handleYt(ctx, mode) {
    const url = ctx.match?.trim().split(" ")[0];
    if (!url)
      return ctx.reply(
        `❌ Format salah!\n\nContoh:\n<code>/yt${mode} https://youtu.be/xxxxx</code>`,
        { parse_mode: "HTML" },
      );

    const msg = await ctx.reply(`⏳ Mengambil info video...`);
    let filePath = null;

    try {
      // Ambil info dulu
      let title = "YouTube";
      try {
        const info = await getYoutubeInfo(url);
        title = info.title || "YouTube";
        await ctx.api.editMessageText(
          ctx.chat.id,
          msg.message_id,
          `📥 <b>Downloading ${mode === "audio" ? "Audio 🎵" : "Video 🎬"}</b>\n\n🎬 ${title}\n\n⏳ Mohon tunggu...`,
          { parse_mode: "HTML" },
        );
      } catch {}

      filePath = await downloadYoutube(url, mode);

      await ctx.api.editMessageText(
        ctx.chat.id,
        msg.message_id,
        "📤 Mengirim file...",
      );

      const file = new InputFile(filePath);
      const caption = `${mode === "audio" ? "🎵" : "🎬"} <b>${title}</b>`;

      if (mode === "audio") {
        await ctx.replyWithAudio(file, { caption, parse_mode: "HTML" });
      } else {
        await ctx.replyWithVideo(file, { caption, parse_mode: "HTML" });
      }

      await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    } catch (e) {
      await ctx.api.editMessageText(
        ctx.chat.id,
        msg.message_id,
        `❌ Gagal download.\n\n<code>${e.message}</code>\n\n💡 Pastikan link YouTube valid dan video tidak dibatasi.`,
        { parse_mode: "HTML" },
      );
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }

  bot.command("ytaudio", (ctx) => handleYt(ctx, "audio"));
  bot.command("ytvideo", (ctx) => handleYt(ctx, "video"));
}
