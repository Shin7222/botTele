import { InlineKeyboard } from "grammy";
import { ADMIN_LIST } from "../../config/config.js";
import { dbRun, getDb } from "../../database/db.js";

// --- Helpers ---
function isOwner(userId) {
  return ADMIN_LIST.includes(userId);
}

function getAllUsers() {
  const db = getDb();
  const result = db.exec("SELECT user_id FROM users");
  if (!result.length) return [];
  return result[0].values.map((row) => row[0]);
}

function parseDuration(str) {
  const match = str.match(/^(\d+)(m|h|d)$/i);
  if (!match) return null;
  const val = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "m") return val * 60 * 1000;
  if (unit === "h") return val * 60 * 60 * 1000;
  if (unit === "d") return val * 24 * 60 * 60 * 1000;
  return null;
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d} hari`);
  if (h) parts.push(`${h} jam`);
  if (m) parts.push(`${m} menit`);
  return parts.join(" ") || "< 1 menit";
}

// State in-memory
let activeEvent = null;

export function registerEvent(bot) {
  // 1. Command Membuat Event/Kuis
  bot.command("event", async (ctx) => {
    if (!isOwner(ctx.from.id)) return ctx.reply("❌ Khusus Owner.");

    const input = ctx.match?.trim();
    if (!input) {
      return ctx.reply(
        `<b>Format Event/Kuis:</b>\n` +
          `<code>/event "Judul" 2h</code>\n\n` +
          `<b>Command Kontrol:</b>\n` +
          `• /eventstop - Berhentikan\n` +
          `• /eventstatus - Cek sisa waktu\n` +
          `• /pemenang - Ambil pemenang acak`,
        { parse_mode: "HTML" },
      );
    }

    const titleMatch = input.match(/^"([^"]+)"\s+(\S+)/);
    if (!titleMatch)
      return ctx.reply("❌ Format salah! Gunakan tanda kutip untuk judul.");

    const title = titleMatch[1];
    const duration = parseDuration(titleMatch[2]);
    if (!duration) return ctx.reply("❌ Durasi tidak valid (cth: 1h, 30m).");

    const eventId = `ev_${Date.now()}`;
    const expireAt = Date.now() + duration;

    activeEvent = { id: eventId, title, expireAt, duration };

    const kb = new InlineKeyboard()
      .text("✅ Konfirmasi & Blast", "event_confirm")
      .text("❌ Batal", "event_cancel");

    await ctx.reply(
      `📢 <b>Preview Kuis</b>\n\n` +
        `🎯 Judul: ${title}\n` +
        `⏱ Durasi: ${formatDuration(duration)}\n\n` +
        `Kirim ke semua user?`,
      { parse_mode: "HTML", reply_markup: kb },
    );
  });

  // 2. Callback Confirm (Blast)
  bot.callbackQuery("event_confirm", async (ctx) => {
    if (!isOwner(ctx.from.id)) return;
    if (!activeEvent) return ctx.editMessageText("❌ Event tidak ditemukan.");

    const users = getAllUsers();
    const botUsername = bot.botInfo.username;

    // Tombol pendaftaran mengarah ke bot sendiri dengan parameter start
    const kb = new InlineKeyboard().url(
      "📝 Daftar Sekarang",
      `https://t.me/${botUsername}?start=${activeEvent.id}`,
    );

    const text =
      `🎊 <b>EVENT BARU: ${activeEvent.title}</b> 🎊\n\n` +
      `Silakan klik tombol di bawah untuk mendaftar!\n` +
      `⏱ Sisa waktu: ${formatDuration(activeEvent.expireAt - Date.now())}`;

    await ctx.editMessageText("📤 Sedang mengirim broadcast...");

    for (const userId of users) {
      try {
        await bot.api.sendMessage(userId, text, {
          parse_mode: "HTML",
          reply_markup: kb,
        });
      } catch (e) {}
      await new Promise((r) => setTimeout(r, 500)); // Jeda agar tidak kena spam limit
    }

    await ctx.reply("✅ Broadcast selesai!");
  });

  // 3. Handler saat User klik "Daftar Sekarang" (Proses Start)
  bot.command("daftar", async (ctx) => {
    const payload = ctx.match;
    if (payload && payload.startsWith("ev_")) {
      if (!activeEvent || payload !== activeEvent.id) {
        return ctx.reply("❌ Maaf, kuis ini sudah berakhir.");
      }

      const db = getDb();
      try {
        // Pastikan tabel event_participants sudah kamu buat di db.js
        dbRun(
          "INSERT INTO event_participants (event_id, user_id, username) VALUES (?, ?, ?)",
          [activeEvent.id, ctx.from.id, ctx.from.username || "no_username"],
        );
        await ctx.reply(
          `✅ <b>Berhasil Daftar!</b>\n\nKamu telah terdaftar di event: <b>${activeEvent.title}</b>`,
          { parse_mode: "HTML" },
        );
      } catch (e) {
        await ctx.reply("⚠️ Kamu sudah terdaftar sebelumnya.");
      }
    }
  });

  // 4. Command Ambil Pemenang
  bot.command("pemenang", async (ctx) => {
    if (!isOwner(ctx.from.id)) return;
    if (!activeEvent) return ctx.reply("❌ Tidak ada event aktif.");

    const db = getDb();
    const result = db.exec(
      "SELECT username, user_id FROM event_participants WHERE event_id = ?",
      [activeEvent.id],
    );

    if (!result.length || result[0].values.length === 0) {
      return ctx.reply("❌ Belum ada peserta yang mendaftar.");
    }

    const participants = result[0].values;
    const winner =
      participants[Math.floor(Math.random() * participants.length)];

    await ctx.reply(
      `🎉 <b>PEMENANG KUIS!</b> 🎉\n\n` +
        `Selamat kepada:\n` +
        `👤 Username: @${winner[0]}\n` +
        `🆔 ID: <code>${winner[1]}</code>\n\n` +
        `Silakan hubungi owner untuk klaim hadiah!`,
      { parse_mode: "HTML" },
    );
  });

  // 5. Stop & Status
  bot.command("eventstop", async (ctx) => {
    if (!isOwner(ctx.from.id)) return;
    activeEvent = null;
    ctx.reply("✅ Event dihentikan.");
  });

  bot.callbackQuery("event_cancel", (ctx) =>
    ctx.editMessageText("❌ Dibatalkan."),
  );
}
