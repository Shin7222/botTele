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

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function registerTruthDare(bot) {
  bot.onText(/\/truth/, (msg) => {
    bot.sendMessage(msg.chat.id, `❓ <b>TRUTH</b>\n\n${randomChoice(TRUTH_LIST)}`, { parse_mode: 'HTML' });
  });

  bot.onText(/\/dare/, (msg) => {
    bot.sendMessage(msg.chat.id, `🔥 <b>DARE</b>\n\n${randomChoice(DARE_LIST)}`, { parse_mode: 'HTML' });
  });

  bot.onText(/\/tod/, (msg) => {
    const mode = Math.random() < 0.5 ? 'truth' : 'dare';
    const text = mode === 'truth'
      ? `❓ <b>TRUTH</b>\n\n${randomChoice(TRUTH_LIST)}`
      : `🔥 <b>DARE</b>\n\n${randomChoice(DARE_LIST)}`;
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
  });
}

module.exports = { registerTruthDare };
