import TelegramBot from 'node-telegram-bot-api';
import { config } from './env';

export const bot = new TelegramBot(config.botToken, { polling: true });

const disableWebhook = async () => {
    try {
        await bot.deleteWebHook(); // Отключаем вебхуки перед запуском polling
        console.log('✅  Webhook отключен, бот работает в режиме polling.');
    } catch (error) {
        console.error('❌ Ошибка отключения webhook:', error);
    }
};

export const initBot = async () => {
    await disableWebhook();
    console.log('🤖 Telegram бот инициализирован');
};
