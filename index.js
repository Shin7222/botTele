import { Bot } from 'grammy';
import { BOT_TOKEN } from './src/config/config.js';
import { initDb } from './src/database/db.js';

import { registerStart }     from './src/handlers/start.js';
import { registerHelp }      from './src/handlers/help.js';
import { registerMenu }      from './src/handlers/menu.js';
import { registerIdCheck }   from './src/handlers/idcheck.js';
import { registerStatus }    from './src/handlers/status.js';

import { registerTiktok }    from './src/handlers/downloader/tiktok.js';
import { registerInstagram } from './src/handlers/downloader/instagram.js';
import { registerFacebook }  from './src/handlers/downloader/facebook.js';
import { registerTwitter }   from './src/handlers/downloader/twitter.js';
import { registerCapcut }    from './src/handlers/downloader/capcut.js';
import { registerGdrive }    from './src/handlers/downloader/gdrive.js';
import { registerTerabox }   from './src/handlers/downloader/terabox.js';
import { registerYtdl }      from './src/handlers/downloader/ytdl.js';

import { registerCompress }   from './src/handlers/tools/compress.js';
import { registerMerge }      from './src/handlers/tools/merge.js';
import { registerScreenshot } from './src/handlers/tools/screenshot.js';
import { registerSticker }    from './src/handlers/tools/sticker.js';
import { registerWatermark }  from './src/handlers/tools/watermark.js';

import { registerTruthDare } from './src/handlers/games/truthDare.js';

async function main() {
  // Init DB (async karena sql.js)
  await initDb();

  const bot = new Bot(BOT_TOKEN);

  // Handlers
  registerStart(bot);
  registerHelp(bot);
  registerMenu(bot);
  registerIdCheck(bot);
  registerStatus(bot);

  // Downloaders
  registerTiktok(bot);
  registerInstagram(bot);
  registerFacebook(bot);
  registerTwitter(bot);
  registerCapcut(bot);
  registerGdrive(bot);
  registerTerabox(bot);
  registerYtdl(bot);

  // Tools
  registerCompress(bot);
  registerMerge(bot);
  registerScreenshot(bot);
  registerSticker(bot);
  registerWatermark(bot);

  // Games
  registerTruthDare(bot);

  bot.catch((err) => console.error('❌ Bot error:', err.message));

  await bot.start({ onStart: () => console.log('🤖 ShinBot JS is running... (Pure JS, no Python!)') });
}

main().catch(console.error);
