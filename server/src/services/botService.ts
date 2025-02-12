import { bot } from '../config/bot';

/**
 * Отправка сообщения пользователю через Telegram Bot
 */
export const sendMessageToUser = async (chatId: number, message: string) => {
    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        console.log(`✅ Сообщение отправлено пользователю ${chatId}`);
    } catch (error) {
        console.error(`❌ Ошибка при отправке сообщения:`, error);
    }
};

/**
 * Отправка кнопки с inline-клавиатурой
 */
export const sendInlineKeyboard = async (chatId: number, message: string, buttons: any) => {
    try {
        await bot.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: buttons },
        });
    } catch (error) {
        console.error(`❌ Ошибка при отправке клавиатуры:`, error);
    }
};
