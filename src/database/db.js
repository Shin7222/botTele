import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../bot.db');

let db;

export async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY,
      username TEXT,
      is_premium INTEGER DEFAULT 0,
      expiry_date TEXT,
      download_count INTEGER DEFAULT 0,
      last_download_date TEXT
    )
  `);
  save();
  console.log('✅ Database initialized');
}

function save() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export function checkLimit(userId) {
  const today = new Date().toISOString().split('T')[0];
  const stmt = db.prepare('SELECT is_premium, download_count, last_download_date FROM users WHERE user_id = ?');
  stmt.bind([userId]);
  const user = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();

  if (!user) {
    db.run('INSERT INTO users (user_id, download_count, last_download_date) VALUES (?, 0, ?)', [userId, today]);
    save();
    return { allowed: true, count: 0 };
  }

  const { is_premium, download_count, last_download_date } = user;

  if (is_premium === 1) return { allowed: true, count: download_count };

  if (last_download_date !== today) {
    db.run('UPDATE users SET download_count = 0, last_download_date = ? WHERE user_id = ?', [today, userId]);
    save();
    return { allowed: true, count: 0 };
  }

  const LIMIT = 10;
  if (download_count >= LIMIT) {
    return {
      allowed: false,
      count: download_count,
      message: `❌ Limit harian kamu sudah habis (${download_count}/${LIMIT}).\n\nUpgrade ke premium untuk unlimited! 👑`
    };
  }

  return { allowed: true, count: download_count };
}

export function incrementDownload(userId) {
  db.run('UPDATE users SET download_count = download_count + 1 WHERE user_id = ?', [userId]);
  save();
}
