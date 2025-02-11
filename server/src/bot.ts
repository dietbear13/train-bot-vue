// src/bot.ts
import TelegramBot, {
    InlineKeyboardMarkup,
    InlineKeyboardButton,
} from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import ScheduledSurvey from './models/ScheduledSurvey';
import User from './models/User'; // модель пользователя с обновлённым surveyCallbacks

const botToken = process.env.TELEGRAM_BOT_API_KEY;
const appUrl = process.env.APP_URL;

if (!botToken) {
    throw new Error('TELEGRAM_BOT_API_KEY не задан в .env');
}
if (!appUrl) {
    throw new Error('APP_URL не задан в .env');
}

const bot = new TelegramBot(botToken, { polling: true });
console.log('Telegram bot initialized');

/**
 * Функция для создания кнопки Telegram Web App
 * @param text Текст кнопки
 * @param path Путь внутри приложения
 */
const openTelegramLink = (
    text: string,
    path: string
): InlineKeyboardButton => {
    return {
        text,
        web_app: { url: `${appUrl}${path}` },
    };
};

/**
 * Функция для создания URL-кнопки
 * @param text Текст кнопки
 * @param url URL для перехода
 */
const openUrlButton = (text: string, url: string): InlineKeyboardButton => {
    return {
        text,
        url,
    };
};

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage =
        'Привет!\n\n' +
        'Я помогу освоиться в тренажёрном зале и узнать много нового\n\n' +
        '1️⃣ Бесплатные программы тренировок\n' +
        '2️⃣ КБЖУ калькулятор и рационы питания\n' +
        '3️⃣ Советы как превратить набор упражнений в план действий';

    const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
            [
                openTelegramLink('🏋️‍♂️ Тренировки', '/'),
                openTelegramLink('🍏 Питание', '/nutrition'),
            ],
            [openUrlButton('🔗 ТГ-канал «кОчалка»', 'https://t.me/training_health')],
            [openTelegramLink('⭐ Поддержать проект', '/landingsOutside/donatStars')],
        ],
    };

    bot.sendMessage(chatId, welcomeMessage, { reply_markup: keyboard });
});

// Обработка callback_query
bot.on('callback_query', async (query) => {
    try {
        if (!query.data) return;

        // Ожидаемый формат: "SURVEY|surveyId|messageId|userChoice"
        const parts = query.data.split('|');
        console.log('++ parts', parts);
        if (parts.length < 4) {
            console.error('Неверный формат callback_data:', query.data);
            return bot.answerCallbackQuery(query.id, {
                text: 'Неверный формат запроса.',
                show_alert: true,
            });
        }

        const [type, surveyId, messageId, userChoice] = parts;

        if (type === 'SURVEY') {
            // Обработка тестовых callback, если userChoice начинается с "q:answer:test:"
            if (userChoice.startsWith('q_')) {
                console.log(
                    `Получен тестовый callback: surveyId=${surveyId}, messageId=${messageId}, userChoice=${userChoice}`
                );

                // Найти пользователя по Telegram ID и добавить запись в историю колбэков
                const user = await User.findOne({ telegramId: query.from.id });
                if (user) {
                    user.surveyCallbacks = user.surveyCallbacks || [];
                    user.surveyCallbacks.push({
                        surveyId,
                        messageId,
                        callbackAt: userChoice, // используем callbackAt вместо callbackData
                        answeredAt: new Date(),
                    });
                    await user.save();
                } else {
                    console.warn(`Пользователь с telegramId ${query.from.id} не найден.`);
                }

                // Удаляем сообщение с кнопками (message_id оставляем как число)
                if (query.message && query.message.chat && query.message.message_id) {
                    await bot.deleteMessage(query.message.chat.id, query.message.message_id);
                }

                await bot.answerCallbackQuery(query.id, {
                    text: 'Ваш тестовый ответ принят!',
                    show_alert: false,
                });
                return;
            } else {
                // Обычная логика для колбэков рассылок

                // Сохраняем ответ пользователя в базе
                await saveSurveyAnswer(surveyId, messageId, query.from.id, userChoice);

                // Удаляем сообщение с кнопками, чтобы убрать старую inline-клавиатуру
                if (query.message && query.message.chat && query.message.message_id) {
                    await bot.deleteMessage(query.message.chat.id, query.message.message_id);
                }

                await bot.answerCallbackQuery(query.id, {
                    text: 'Ответ принят!',
                    show_alert: false,
                });

                // Отправляем следующее сообщение (если предусмотрено логикой рассылки)
                await processNextMessage(surveyId, messageId, query.from.id);
            }
        } else {
            console.warn('Неизвестный тип callback:', type);
            await bot.answerCallbackQuery(query.id, {
                text: 'Неизвестная команда.',
                show_alert: true,
            });
        }
    } catch (error) {
        console.error('Ошибка в обработчике callback_query:', error);
        if (query.id) {
            await bot.answerCallbackQuery(query.id, {
                text: 'Произошла ошибка. Попробуйте позже.',
                show_alert: true,
            });
        }
    }
});

/**
 * Сохраняет ответ пользователя на вопрос рассылки.
 */
async function saveSurveyAnswer(
    surveyId: string,
    messageId: string,
    telegramUserId: number,
    userChoice: string
) {
    try {
        const survey = await ScheduledSurvey.findById(surveyId);
        if (!survey) {
            console.error('Рассылка не найдена:', surveyId);
            return;
        }
        if (!survey.answers) {
            survey.answers = [];
        }
        // Преобразуем messageId в ObjectId, если схема это требует
        survey.answers.push({
            messageId: new mongoose.Types.ObjectId(messageId),
            telegramUserId,
            userChoice,
            answeredAt: new Date(),
        });
        await survey.save();
    } catch (err) {
        console.error('Ошибка при сохранении ответа рассылки:', err);
    }
}

/**
 * Отправляет следующее сообщение рассылки пользователю, если оно предусмотрено.
 */
async function processNextMessage(
    surveyId: string,
    currentMessageId: string,
    telegramUserId: number
) {
    try {
        const survey = await ScheduledSurvey.findById(surveyId);
        if (!survey) {
            console.error(
                'Рассылка не найдена при обработке следующего сообщения:',
                surveyId
            );
            return;
        }
        // Если поле currentIndex не определено – считаем, что ни одно сообщение ещё не отправлено
        let currentIndex = survey.currentIndex ?? -1;
        // Найти индекс текущего сообщения по его _id (приводим _id к строке)
        const idx = survey.messages.findIndex(
            (msg: any) => msg._id.toString() === currentMessageId
        );
        if (idx === -1) {
            console.error('Сообщение не найде но в рассылке:', currentMessageId);
            return;
        }

        if (survey.messages[idx].waitForResponse) {
            survey.currentIndex = idx + 1;
            await survey.save();

            if (survey.currentIndex < survey.messages.length) {
                const nextMessage = survey.messages[survey.currentIndex];
                // Формируем клавиатуру для следующего сообщения
                const keyboard = {
                    inline_keyboard: nextMessage.inlineButtons.map((btn: any) => [
                        {
                            text: btn.text,
                            // Формируем callback_data в формате "SURVEY|surveyId|nextMessageId|btn.callbackData"
                            callback_data: `SURVEY|${surveyId}|${nextMessage._id}|${btn.callbackData}`,
                        },
                    ]),
                };
                console.log('+++ keyboard', keyboard)
                // Отправляем следующее сообщение пользователю, который дал ответ
                await bot.sendMessage(telegramUserId, nextMessage.text, {
                    reply_markup: keyboard,
                });
            } else {
                survey.completed = true;
                await survey.save();
            }
        }
    } catch (err) {
        console.error('Ошибка в processNextMessage:', err);
    }
}

// Ловим ошибки polling
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

export default bot;
