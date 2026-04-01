import sqlite3
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH  = os.path.join(BASE_DIR, "data", "bot.db")


def init_kuis_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Tabel soal kuis
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS kuis_soal (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            pertanyaan  TEXT NOT NULL,
            pilihan_a   TEXT NOT NULL,
            pilihan_b   TEXT NOT NULL,
            pilihan_c   TEXT NOT NULL,
            pilihan_d   TEXT NOT NULL,
            jawaban     TEXT NOT NULL,
            kategori    TEXT DEFAULT 'umum',
            dibuat_oleh INTEGER,
            dibuat_at   TEXT DEFAULT (DATETIME('now'))
        )
    """)

    # Tabel sesi kuis aktif
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS kuis_sesi (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id      INTEGER NOT NULL,
            soal_id      INTEGER NOT NULL,
            status       TEXT DEFAULT 'aktif',
            pemenang_id  INTEGER,
            pemenang_nama TEXT,
            mulai_at     TEXT DEFAULT (DATETIME('now')),
            selesai_at   TEXT
        )
    """)

    # Tabel skor pemain
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS kuis_skor (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id   INTEGER NOT NULL,
            username  TEXT,
            nama      TEXT,
            skor      INTEGER DEFAULT 0,
            total     INTEGER DEFAULT 0,
            benar     INTEGER DEFAULT 0,
            salah     INTEGER DEFAULT 0
        )
    """)

    conn.commit()
    conn.close()


# ==========================
# SOAL
# ==========================
def tambah_soal(pertanyaan: str, a: str, b: str, c: str, d: str,
                jawaban: str, kategori: str = "umum", owner_id: int = None) -> int:
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO kuis_soal (pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban, kategori, dibuat_oleh)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (pertanyaan, a, b, c, d, jawaban.upper(), kategori, owner_id))
    soal_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return soal_id


def hapus_soal(soal_id: int) -> bool:
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM kuis_soal WHERE id = ?", (soal_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


def get_soal(soal_id: int) -> dict | None:
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM kuis_soal WHERE id = ?", (soal_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id"         : row[0],
        "pertanyaan" : row[1],
        "pilihan_a"  : row[2],
        "pilihan_b"  : row[3],
        "pilihan_c"  : row[4],
        "pilihan_d"  : row[5],
        "jawaban"    : row[6],
        "kategori"   : row[7],
        "dibuat_oleh": row[8],
        "dibuat_at"  : row[9],
    }


def get_random_soal(kategori: str = None) -> dict | None:
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if kategori:
        cursor.execute("SELECT * FROM kuis_soal WHERE kategori = ? ORDER BY RANDOM() LIMIT 1", (kategori,))
    else:
        cursor.execute("SELECT * FROM kuis_soal ORDER BY RANDOM() LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id"         : row[0],
        "pertanyaan" : row[1],
        "pilihan_a"  : row[2],
        "pilihan_b"  : row[3],
        "pilihan_c"  : row[4],
        "pilihan_d"  : row[5],
        "jawaban"    : row[6],
        "kategori"   : row[7],
        "dibuat_oleh": row[8],
        "dibuat_at"  : row[9],
    }


def get_all_soal(kategori: str = None) -> list:
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if kategori:
        cursor.execute("SELECT id, pertanyaan, kategori FROM kuis_soal WHERE kategori = ?", (kategori,))
    else:
        cursor.execute("SELECT id, pertanyaan, kategori FROM kuis_soal")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "pertanyaan": r[1], "kategori": r[2]} for r in rows]


def count_soal() -> int:
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM kuis_soal")
    total = cursor.fetchone()[0]
    conn.close()
    return total


# ==========================
# SESI
# ==========================
def buat_sesi(chat_id: int, soal_id: int) -> int:
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO kuis_sesi (chat_id, soal_id)
        VALUES (?, ?)
    """, (chat_id, soal_id))
    sesi_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return sesi_id


def get_sesi_aktif(chat_id: int) -> dict | None:
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM kuis_sesi
        WHERE chat_id = ? AND status = 'aktif'
        ORDER BY mulai_at DESC LIMIT 1
    """, (chat_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id"          : row[0],
        "chat_id"     : row[1],
        "soal_id"     : row[2],
        "status"      : row[3],
        "pemenang_id" : row[4],
        "pemenang_nama": row[5],
        "mulai_at"    : row[6],
        "selesai_at"  : row[7],
    }


def selesaikan_sesi(sesi_id: int, pemenang_id: int = None, pemenang_nama: str = None):
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE kuis_sesi
        SET status = 'selesai', pemenang_id = ?, pemenang_nama = ?, selesai_at = DATETIME('now')
        WHERE id = ?
    """, (pemenang_id, pemenang_nama, sesi_id))
    conn.commit()
    conn.close()


def batalkan_sesi(chat_id: int):
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE kuis_sesi SET status = 'batal'
        WHERE chat_id = ? AND status = 'aktif'
    """, (chat_id,))
    conn.commit()
    conn.close()


# ==========================
# SKOR
# ==========================
def update_skor(user_id: int, username: str, nama: str, benar: bool):
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT id, skor, total, benar, salah FROM kuis_skor WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()

    if row:
        skor  = row[1] + (10 if benar else 0)
        total = row[2] + 1
        b     = row[3] + (1 if benar else 0)
        s     = row[4] + (0 if benar else 1)
        cursor.execute("""
            UPDATE kuis_skor SET username = ?, nama = ?, skor = ?, total = ?, benar = ?, salah = ?
            WHERE user_id = ?
        """, (username, nama, skor, total, b, s, user_id))
    else:
        cursor.execute("""
            INSERT INTO kuis_skor (user_id, username, nama, skor, total, benar, salah)
            VALUES (?, ?, ?, ?, 1, ?, ?)
        """, (user_id, username, nama, 10 if benar else 0, 1 if benar else 0, 0 if benar else 1))

    conn.commit()
    conn.close()


def get_leaderboard(limit: int = 10) -> list:
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT user_id, username, nama, skor, total, benar, salah
        FROM kuis_skor
        ORDER BY skor DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "user_id" : r[0],
            "username": r[1],
            "nama"    : r[2],
            "skor"    : r[3],
            "total"   : r[4],
            "benar"   : r[5],
            "salah"   : r[6],
        }
        for r in rows
    ]


def get_skor_user(user_id: int) -> dict | None:
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM kuis_skor WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "user_id" : row[1],
        "username": row[2],
        "nama"    : row[3],
        "skor"    : row[4],
        "total"   : row[5],
        "benar"   : row[6],
        "salah"   : row[7],
    }
