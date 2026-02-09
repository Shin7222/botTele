import sqlite3
from datetime import datetime

def init_db():
    conn = sqlite3.connect('bot.db')
    c = conn.cursor

    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (user_id INTEGER PRIMARY KEY, 
                  username TEXT, 
                  is_premium INTEGER DEFAULT 0, 
                  expiry_date TEXT,
                  download_count INTEGER DEFAULT 0,
                  last_download_date TEXT)''')
    conn.commit()
    conn.close()

def check_limit(user_id):
    conn = sqlite3.connect('bot.db')
    c = conn.cursor

    c.execute("SELECT is_premium, download_count, last_download_date FROM users WHERE user_id = ?", (user_id,))
    res = c.fetchone()

    today = datetime.now().strftime('')

    if not res:
        c.execute("INSERT INTO users (user_id, download_count, last_download_date) VALUES (?, 0, ?)", (user_id, today))
        conn.commit()
        conn.close
        return True
    
    is_premium, count, last_date = res

    if is_premium == 1:
        conn.close()
        return True
    
    if last_date != today:
        c.execute("UPDATE users SET download_count = 0, last_download_date = ? WHERE user_id = ?", (today, user_id))
        conn.commit()
        conn.close()
        return True, 0
    
    limit_harian = 10
    conn.cloe()

    if count >= limit_harian:
        return False, count
    
def increment_download(user_id):
    conn = sqlite3.connect('bot.db')
    c = conn.cursor()
    c.execute("UPDATE users SET download_count = download_count + 1 WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()