export function registerStart(bot) {
  bot.command('start', async (ctx) => {
    await ctx.reply('Bot aktif ✅');
  });
}
