import TelegramBot from 'node-telegram-bot-api';
import { config } from './env';

export const bot = new TelegramBot(config.botToken, { polling: false });

export const initBot = () => {
    console.log('🤖 Telegram бот инициализирован');
};
