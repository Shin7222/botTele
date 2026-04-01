function registerIdchek(bot) {
  bot.onText(/\/idchek/, (msg) => {
    bot.sendMessage(msg.chat.id, `Your Telegram user ID is: ${msg.from.id}`);
  });
}

module.exports = { registerIdchek };
