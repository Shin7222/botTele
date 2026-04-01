import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'bot.db');

let db;

export function initKuisDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS kuis_soal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pertanyaan TEXT NOT NULL,
      pilihan_a TEXT NOT NULL,
      pilihan_b TEXT NOT NULL,
      pilihan_c TEXT NOT NULL,
      pilihan_d TEXT NOT NULL,
      jawaban TEXT NOT NULL,
      kategori TEXT DEFAULT 'umum',
      dibuat_oleh INTEGER,
      dibuat_at TEXT DEFAULT (DATETIME('now'))
    );

    CREATE TABLE IF NOT EXISTS kuis_sesi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      soal_id INTEGER NOT NULL,
      status TEXT DEFAULT 'aktif',
      pemenang_id INTEGER,
      pemenang_nama TEXT,
      mulai_at TEXT DEFAULT (DATETIME('now')),
      selesai_at TEXT
    );

    CREATE TABLE IF NOT EXISTS kuis_skor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      username TEXT,
      nama TEXT,
      skor INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      benar INTEGER DEFAULT 0,
      salah INTEGER DEFAULT 0
    );
  `);
}

export function tambahSoal(pertanyaan, a, b, c, d, jawaban, kategori = 'umum', ownerId = null) {
  const stmt = db.prepare(`
    INSERT INTO kuis_soal (pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban, kategori, dibuat_oleh)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(pertanyaan, a, b, c, d, jawaban.toUpperCase(), kategori, ownerId).lastInsertRowid;
}

export function hapusSoal(soalId) {
  return db.prepare('DELETE FROM kuis_soal WHERE id = ?').run(soalId).changes > 0;
}

export function getSoal(soalId) {
  return db.prepare('SELECT * FROM kuis_soal WHERE id = ?').get(soalId) || null;
}

export function getRandomSoal(kategori = null) {
  if (kategori) return db.prepare('SELECT * FROM kuis_soal WHERE kategori = ? ORDER BY RANDOM() LIMIT 1').get(kategori);
  return db.prepare('SELECT * FROM kuis_soal ORDER BY RANDOM() LIMIT 1').get() || null;
}

export function buatSesi(chatId, soalId) {
  return db.prepare('INSERT INTO kuis_sesi (chat_id, soal_id) VALUES (?, ?)').run(chatId, soalId).lastInsertRowid;
}

export function getSesiAktif(chatId) {
  return db.prepare(`SELECT * FROM kuis_sesi WHERE chat_id = ? AND status = 'aktif' ORDER BY mulai_at DESC LIMIT 1`).get(chatId) || null;
}

export function selesaikanSesi(sesiId, pemenangId = null, pemenangNama = null) {
  db.prepare(`UPDATE kuis_sesi SET status='selesai', pemenang_id=?, pemenang_nama=?, selesai_at=DATETIME('now') WHERE id=?`).run(pemenangId, pemenangNama, sesiId);
}

export function updateSkor(userId, username, nama, benar) {
  const row = db.prepare('SELECT id, skor, total, benar, salah FROM kuis_skor WHERE user_id = ?').get(userId);
  if (row) {
    db.prepare('UPDATE kuis_skor SET username=?, nama=?, skor=?, total=?, benar=?, salah=? WHERE user_id=?')
      .run(username, nama, row.skor + (benar ? 10 : 0), row.total + 1, row.benar + (benar ? 1 : 0), row.salah + (benar ? 0 : 1), userId);
  } else {
    db.prepare('INSERT INTO kuis_skor (user_id, username, nama, skor, total, benar, salah) VALUES (?, ?, ?, ?, 1, ?, ?)')
      .run(userId, username, nama, benar ? 10 : 0, benar ? 1 : 0, benar ? 0 : 1);
  }
}

export function getLeaderboard(limit = 10) {
  return db.prepare('SELECT * FROM kuis_skor ORDER BY skor DESC LIMIT ?').all(limit);
}
