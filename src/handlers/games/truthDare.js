const TRUTH_LIST = [
  'Apa rahasia terbesar kamu?',
  'Pernah suka sama teman sendiri?',
  'Apa hal paling memalukan yang pernah kamu lakukan?',
  'Siapa orang terakhir yang kamu stalk?',
  'Pernah bohong ke orang tua? tentang apa?',
];

const DARE_LIST = [
  'Kirim voice note nyanyi 10 detik!',
  "Ketik 'aku kangen mantan' di chat ini 😈",
  'Ganti foto profil selama 10 menit!',
  'Tag 1 teman dan bilang kamu kangen dia 😂',
  'Kirim emoji 🐸 10x berturut-turut',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function registerTruthDare(bot) {
  bot.command('truth', async (ctx) => {
    await ctx.reply(`❓ <b>TRUTH</b>\n\n${pick(TRUTH_LIST)}`, { parse_mode: 'HTML' });
  });
  bot.command('dare', async (ctx) => {
    await ctx.reply(`🔥 <b>DARE</b>\n\n${pick(DARE_LIST)}`, { parse_mode: 'HTML' });
  });
  bot.command('tod', async (ctx) => {
    const isTruth = Math.random() < 0.5;
    const text = isTruth
      ? `❓ <b>TRUTH</b>\n\n${pick(TRUTH_LIST)}`
      : `🔥 <b>DARE</b>\n\n${pick(DARE_LIST)}`;
    await ctx.reply(text, { parse_mode: 'HTML' });
  });
}
