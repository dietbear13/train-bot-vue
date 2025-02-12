// src/routes/bot/sendKbzhu.ts

import { Router, Request, Response } from 'express';
import { bot } from '../../config/bot';
import { escapeMarkdownV2 } from '../../utils/helpers';

const router = Router();

/**
 * Функция для отправки результатов КБЖУ пользователю
 */
const sendKbzhuResultToUser = (
    chatId: number,
    kbzhuResult: { calories: number; proteins: number; fats: number; carbs: number }
) => {
    let message = 'Примерный суточный расчёт КБЖУ:\n\n';
    message += `Калории: ${kbzhuResult.calories} ккал\n`;
    message += `Белки: ${kbzhuResult.proteins} г\n`;
    message += `Жиры: ${kbzhuResult.fats} г\n`;
    message += `Углеводы: ${kbzhuResult.carbs} г\n`;

    const escapedMessage = escapeMarkdownV2(message);

    bot.sendMessage(chatId, escapedMessage, {
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
    })
        .then(() => {
            console.log(`KbzhuResult sent to user ${chatId}`);
        })
        .catch((error: any) => {
            console.error('Error sending KbzhuResult to user:', error.response?.body || error.message);
        });
};

/**
 * Маршрут: отправка результатов КБЖУ
 */
router.post('/send-kbzhu', async (req: Request, res: Response) => {
    const { userId, kbzhuResult } = req.body;
    if (!userId || !kbzhuResult) {
        return res.status(400).json({ message: 'Необходимо указать userId и kbzhuResult' });
    }

    try {
        sendKbzhuResultToUser(userId, kbzhuResult);
        res.json({ message: 'КБЖУ отправлены в сообщением в чат' });
    } catch (error: any) {
        console.error('Ошибка при отправке сообщения в Telegram:', error.message);
        res.status(500).json({ message: 'Ошибка при отправке сообщения в Telegram', error: error.message });
    }
});

export default router;
