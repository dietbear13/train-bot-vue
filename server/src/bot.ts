import dotenv from 'dotenv';
import TelegramBot, {InlineKeyboardMarkup} from 'node-telegram-bot-api';

// Загрузка переменных окружения из .env файла
dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.APP_URL; // URL вашего Telegram Mini App

if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN не задан в файле .env');
}

if (!appUrl) {
    throw new Error('APP_URL не задан в файле .env');
}

// Инициализация бота с использованием polling
const bot = new TelegramBot(botToken, {
    polling: true,
    request: {
        url: botToken,
        agentOptions:{
            keepAlive: true,
            family: 4
        }
    }
});

console.log('Бот запущен')
/**
 * Функция для создания кнопки Telegram Mini App
 * @param text Текст кнопки
 * @param path Путь внутри приложения (например, '/training' или '/nutrition')
 * @returns Кнопка с параметром web_app
 */
const openTelegramLink = (text: string, path: string): any => {
    return {
        text: text,
        web_app: {
            url: `${appUrl}${path}`, // Полный URL вашего Mini App с добавленным путем
        },
    };
};

/**
 * Функция для создания URL-кнопки
 * @param text Текст кнопки
 * @param url URL для перехода
 * @returns Кнопка с параметром url
 */
const openUrlButton = (text: string, url: string): any => {
    return {
        text: text,
        url: url,
    };
};

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const welcomeMessage = 'Привет!\n\nИспользуй кнопки ниже для быстрого попадания в нужный раздел.';

    // Создание клавиатуры с кнопками
    const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
            [
                openTelegramLink('🏋️‍♂️ Тренировки', ''), // Страница тренировок
                openTelegramLink('🍏 Питание', '/nutrition'), // Страница питания
            ],
            [
                openUrlButton('🔗 тг-канал «кОчалка»', 'https://t.me/training_health'), // Переход в канал
            ],
        ],
    };

    // Отправка сообщения с клавиатурой
    bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: keyboard,
    });
});

// Обработка ошибок polling
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

export default bot;
