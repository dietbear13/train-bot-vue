// src/routes/bot/botInstance.ts

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN as string;
export const bot = new TelegramBot(botToken, { polling: false });

// Важно: URL вашего мини-приложения (из .env)
export const appUrl = process.env.APP_URL;

if (!appUrl) {
    throw new Error('APP_URL не задан в файле .env');
}
