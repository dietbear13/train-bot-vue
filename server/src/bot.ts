// src/bot.ts
import TelegramBot, { InlineKeyboardMarkup } from 'node-telegram-bot-api';

// Токен и URL берем из process.env, которые подгружены в server.ts
const botToken = process.env.TELEGRAM_BOT_API_KEY;
const appUrl = process.env.APP_URL;

if (!botToken) {
    throw new Error('TELEGRAM_BOT_API_KEY не задан в .env');
}
if (!appUrl) {
    throw new Error('APP_URL не задан в .env');
}

const bot = new TelegramBot(botToken, {
    polling: true,
});

console.log('Telegram bot initialized');

/**
 * Функция для создания кнопки Telegram Web App
 * @param text Текст кнопки
 * @param path Путь внутри приложения (например, '/training' или '/nutrition')
 * @returns Кнопка с параметром web_app
 */
const openTelegramLink = (text: string, path: string): any => {
    return {
        text,
        web_app: {
            url: `${appUrl}${path}`,
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
        text,
        url,
    };
};

// /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const welcomeMessage = 'Привет!\n\n' +
        'Я помогу освоиться в тренажёрном зале и узнать много нового\n\n' +
        '1️⃣ Бесплатные программы тренировок\n' +
        '2️⃣ КБЖУ калькулятор и рационы питания\n' +
        '3️⃣ Советы как превратить набор упражнений в план действий';

    // Создание клавиатуры с кнопками
    const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
            [
                openTelegramLink('🏋️‍♂️ Тренировки', '/'),
                openTelegramLink('🍏 Питание', '/nutrition'),
            ],
            [
                openUrlButton('🔗 ТГ-канал «кОчалка»', 'https://t.me/training_health'),
            ],
            [
                openTelegramLink('⭐ Поддержать проект', '/landingsOutside/donatStars'),
            ],
        ],
    };

    bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: keyboard,
    });
});

// Пример callback_data = "SURVEY|<surveyId>|<messageId>|<callbackData>"
bot.on('callback_query', async (query) => {
    if (!query.data) return;
    const parts = query.data.split('|');
    if (parts[0] === 'SURVEY') {
        const surveyId = parts[1];
        const messageId = parts[2];
        const userChoice = parts[3];

        // Сохранить ответ ...
        await saveSurveyAnswer(surveyId, messageId, query.from.id, userChoice);

        bot.answerCallbackQuery(query.id, {
            text: 'Ответ принят!',
            show_alert: false,
        });

        // Проверяем, нужно ли отправить следующее сообщение
        await processNextMessage(surveyId, messageId);
    }
});

async function saveSurveyAnswer(
    surveyId: string,
    messageId: string,
    telegramId: number,
    userChoice: string,
) {
    // сохранение в БД (ScheduledSurvey или отдельная коллекция)
}

async function processNextMessage(surveyId: string, messageId: string) {
    // найти survey, определить текущий index,
    // если waitForResponse, отправить следующее и т.д.
}

// Ловим ошибки
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// Экспортируем, чтобы в server.ts можно было импортировать bot
export default bot;
