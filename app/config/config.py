import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("TOKEN")

BOT_NAME = "ShinBot"
VERSION = "1.0.0"

OWNER_NAME = "Shin"
OWNER_CONTACT = "@ShinIGam1i"

ADMIN_LIST = [123456789, 987654321]

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN tidak ditemukan")