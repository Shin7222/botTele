export function registerIdCheck(bot) {
  bot.command('idchek', async (ctx) => {
    await ctx.reply(`Your Telegram user ID is: ${ctx.from.id}`);
  });
}
