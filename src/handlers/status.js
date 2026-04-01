import { execSync } from 'child_process';
import process from 'process';

const START_TIME = Date.now();

function readableTime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(' ');
}

function readableSize(bytes) {
  for (const unit of ['B', 'KB', 'MB', 'GB']) {
    if (bytes < 1024) return `${bytes.toFixed(2)} ${unit}`;
    bytes /= 1024;
  }
  return `${bytes.toFixed(2)} TB`;
}

export function registerStatus(bot) {
  bot.command('status', async (ctx) => {
    const uptime = readableTime(Date.now() - START_TIME);
    const memUsage = process.memoryUsage();
    const ram = readableSize(memUsage.rss);
    const cpuUsage = process.cpuUsage();

    const text = `<b>📊 Bot System Status</b>
----------------------------
<b>⏱ Uptime:</b> <code>${uptime}</code>
<b>🧠 Memory:</b> <code>${ram}</code>
<b>🟢 Node.js:</b> <code>${process.version}</code>
----------------------------`;

    await ctx.reply(text, { parse_mode: 'HTML' });
  });
}
