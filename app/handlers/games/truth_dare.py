import random
from telegram import Update
from telegram.ext import ContextTypes, CommandHandler

# ==========================
# DATA (bisa kamu pindah ke DB nanti)
# ==========================
TRUTH_LIST = [
    "Apa rahasia terbesar kamu?",
    "Pernah suka sama teman sendiri?",
    "Apa hal paling memalukan yang pernah kamu lakukan?",
    "Siapa orang terakhir yang kamu stalk?",
    "Pernah bohong ke orang tua? tentang apa?",
]

DARE_LIST = [
    "Kirim voice note nyanyi 10 detik!",
    "Ketik 'aku kangen mantan' di chat ini 😈",
    "Ganti foto profil selama 10 menit!",
    "Tag 1 teman dan bilang kamu kangen dia 😂",
    "Kirim emoji 🐸 10x berturut-turut",
]

# ==========================
# COMMAND HANDLER
# ==========================
async def truth(update: Update, context: ContextTypes.DEFAULT_TYPE):
    question = random.choice(TRUTH_LIST)

    await update.message.reply_text(
        f"❓ <b>TRUTH</b>\n\n{question}",
        parse_mode="HTML"
    )


async def dare(update: Update, context: ContextTypes.DEFAULT_TYPE):
    challenge = random.choice(DARE_LIST)

    await update.message.reply_text(
        f"🔥 <b>DARE</b>\n\n{challenge}",
        parse_mode="HTML"
    )


async def tod(update: Update, context: ContextTypes.DEFAULT_TYPE):
    mode = random.choice(["truth", "dare"])

    if mode == "truth":
        question = random.choice(TRUTH_LIST)
        text = f"❓ <b>TRUTH</b>\n\n{question}"
    else:
        challenge = random.choice(DARE_LIST)
        text = f"🔥 <b>DARE</b>\n\n{challenge}"

    await update.message.reply_text(text, parse_mode="HTML")


# ==========================
# REGISTER HANDLER
# ==========================
def truth_dare_handler(app):
    app.add_handler(CommandHandler("truth", truth))
    app.add_handler(CommandHandler("dare", dare))
    app.add_handler(CommandHandler("tod", tod))  # random