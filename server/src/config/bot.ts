// src/config/bot.ts


import TelegramBot from 'node-telegram-bot-api';
import { config } from './env';

export const bot = new TelegramBot(config.botToken, { polling: true });

export const initBot = () => {
    console.log('🤖 Telegram бот инициализирован');
};
