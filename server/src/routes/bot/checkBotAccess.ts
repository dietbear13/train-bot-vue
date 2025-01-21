// src/routes/bot/checkBotAccess.ts

import { Router, Request, Response } from 'express';
import { bot } from './botInstance';

const router = Router();

/**
 * Маршрут: проверка доступа бота к каналу
 */
router.post('/bot/check-bot-access', async (req: Request, res: Response) => {
    const { channelId } = req.body;
    if (!channelId) {
        return res.status(400).json({ message: 'Необходимо указать channelId' });
    }

    try {
        const botInfo = await bot.getMe();
        const chatMember = await bot.getChatMember(channelId, botInfo.id);
        const hasAccess = ['administrator', 'creator'].includes(chatMember.status);

        res.json({ hasAccess });
    } catch (error: any) {
        console.error('Ошибка при проверке доступа бота к каналу:', error.message);
        res.status(500).json({ message: 'Ошибка при проверке доступа бота к каналу', error: error.message });
    }
});

export default router;
