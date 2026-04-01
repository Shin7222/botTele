import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TOKEN;
export const BOT_NAME = "ShinBot";
export const VERSION = "1.0.0";
export const OWNER_NAME = "Shin";
export const OWNER_CONTACT = "@ShinIGam1i";
export const ADMIN_LIST = [6909146069];

if (!BOT_TOKEN) throw new Error("BOT_TOKEN tidak ditemukan di .env");
