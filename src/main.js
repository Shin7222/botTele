import { Bot } from 'grammy';
import { BOT_TOKEN } from './config/config.js';
import { initDb } from './database/db.js';

import { registerStart }     from './handlers/start.js';
import { registerHelp }      from './handlers/help.js';
import { registerMenu }      from './handlers/menu.js';
import { registerIdCheck }   from './handlers/idcheck.js';
import { registerStatus }    from './handlers/status.js';

import { registerTiktok }    from './handlers/downloader/tiktok.js';
import { registerInstagram } from './handlers/downloader/instagram.js';
import { registerFacebook }  from './handlers/downloader/facebook.js';
import { registerTwitter }   from './handlers/downloader/twitter.js';
import { registerCapcut }    from './handlers/downloader/capcut.js';
import { registerGdrive }    from './handlers/downloader/gdrive.js';
import { registerTerabox }   from './handlers/downloader/terabox.js';
import { registerYtdl }      from './handlers/downloader/ytdl.js';

import { registerCompress }   from './handlers/tools/compress.js';
import { registerMerge }      from './handlers/tools/merge.js';
import { registerScreenshot } from './handlers/tools/screenshot.js';
import { registerSticker }    from './handlers/tools/sticker.js';
import { registerWatermark }  from './handlers/tools/watermark.js';

import { registerTruthDare } from './handlers/games/truthDare.js';

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
