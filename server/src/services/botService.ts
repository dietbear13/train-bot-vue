import { bot } from '../config/bot';

/**
 * Функция для создания кнопки Telegram Web App
 */
const openTelegramLink = (text: string, path: string) => ({
    text,
    web_app: { url: `${process.env.APP_URL}${path}` },
});

/**
 * Функция для создания URL-кнопки
 */
const openUrlButton = (text: string, url: string) => ({ text, url });

/**
 * Настройка команд бота
 */
export const setupBotCommands = () => {
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const welcomeMessage = `У меня всё для тренажёрного зала\n\n🏋️‍♂️ Бесплатные программы тренировок\n🍏 Примеры рационов питания и калькулятор КБЖУ\n📈 Советы тренера и план действий\n\nКанал кОчалка часть этого бота, поэтому нужно подписаться. Версия бота не окончательная и может частично не работать❗`;

        const keyboard = {
            inline_keyboard: [
                [openTelegramLink('🏋️‍♂️ Тренировки', '/'), openTelegramLink('🍏 Питание', '/nutrition')],
                [openUrlButton('🔗 ТГ-канал «кОчалка»', 'https://t.me/training_health')],
                [openTelegramLink('⭐ Поддержать проект', '/landingsOutside/donatStars')],
            ],
        };

        bot.sendMessage(chatId, welcomeMessage, { reply_markup: keyboard });
    });
};
