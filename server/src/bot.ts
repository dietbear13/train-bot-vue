// src/bot.ts

import dotenv from 'dotenv';
import TelegramBot, { InlineKeyboardMarkup } from 'node-telegram-bot-api';

// Загрузка переменных окружения из .env файла
dotenv.config();

const botToken = process.env.TELEGRAM_BOT_API_KEY;
const appUrl = process.env.APP_URL;

if (!botToken) {
    throw new Error('TELEGRAM_BOT_API_KEY не задан в файле .env');
}

if (!appUrl) {
    throw new Error('APP_URL не задан в файле .env');
}

// Инициализация бота с использованием polling без некорректных опций request
const bot = new TelegramBot(botToken, {
    polling: true,
});

console.log('Бот запущен');

/**
 * Функция для создания кнопки Telegram Web App
 * @param text Текст кнопки
 * @param path Путь внутри приложения (например, '/training' или '/nutrition')
 * @returns Кнопка с параметром web_app
 */
const openTelegramLink = (text: string, path: string): any => {
    return {
        text: text,
        web_app: {
            url: `${appUrl}${path}`, // Полный URL вашего Web App с добавленным путем
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
                openTelegramLink('🏋️‍♂️ Тренировки', '/'), // Страница тренировок
                openTelegramLink('🍏 Питание', '/nutrition'), // Страница питания
            ],
            [
                openUrlButton('🔗 ТГ-канал «кОчалка»', 'https://t.me/training_health'), // Переход в канал
            ],
            [
                openTelegramLink('⭐ Поддержать проект', '/landingsOutside/donatStars'), // Корректный путь для донатов
            ],
        ],
    };

    // Отправка сообщения с клавиатурой
    bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: keyboard,
    });
});

bot.on('callback_query', async (query) => {
    if (!query.data) return;

    // Пример: data = "SURVEY|<surveyId>|<messageId>|<callbackData>"
    // Парсим
    const parts = query.data.split('|');
    if (parts[0] === 'SURVEY') {
        const surveyId = parts[1];
        const messageId = parts[2];
        const userChoice = parts[3];

        // Сохраняем ответ в базе
        await saveSurveyAnswer(surveyId, messageId, query.from.id, userChoice);

        // Отправим "спасибо за ответ" или обновим сообщение
        bot.answerCallbackQuery(query.id, {
            text: 'Ответ принят!',
            show_alert: false
        });

        // Проверяем, нужно ли отправить следующее сообщение
        await processNextMessage(surveyId, messageId);
    }
});

async function saveSurveyAnswer(surveyId: string, messageId: string, telegramId: number, userChoice: string) {
    // Можно завести отдельную коллекцию answers
    // или хранить ответы внутри ScheduledSurvey
    // Например:
    // 1) Находим survey
    // 2) Находим message
    // 3) Пушим внутрь message "answers" массив
    // 4) Сохраняем
}

async function processNextMessage(surveyId: string, messageId: string) {
    // Логика: если у текущего message = waitForResponse: true,
    // то только после получения ответа шлём следующее
    // 1) Найти survey
    // 2) Узнать index текущего message
    // 3) Если waitForResponse, то sendMessage(..., index+1)
}


// Обработка ошибок polling
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

export default bot;
