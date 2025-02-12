import dotenv from 'dotenv';

dotenv.config();

export const config = {
    appUrl: process.env.APP_URL || 'https://fitnesstgbot.ru',
    port: process.env.PORT || 4000,
    botToken: process.env.TELEGRAM_BOT_API_KEY || '',
    mongoUri: process.env.MONGO_URI || 'mongodb://mongodb:27017/fitness-app',
};


if (!config.botToken) {
    throw new Error('❌ TELEGRAM_BOT_API_KEY не задан в .env');
}
