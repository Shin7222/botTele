export function registerHelp(bot) {
  bot.command('help', async (ctx) => {
    await ctx.reply('/start - mulai\n/help - bantuan\n/menu - menu lengkap');
  });
}
