from datetime import datetime

def get_greeting():
    hour = datetime.now().hour

    if 5 <= hour < 11:
        return "Selamat Pagi 🌅"
    elif 11 <= hour < 15:
        return "Selamat Siang ☀️"
    elif 15 <= hour < 18:
        return "Selamat Sore 🌇"
    else:
        return "Selamat Malam 🌙"