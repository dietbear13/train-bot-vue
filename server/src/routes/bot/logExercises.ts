// src/routes/bot/logExercises.ts
// удалить маршрут
import { Router, Request, Response } from 'express';
import { bot } from './botInstance';
import User from '../../models/User';
import { escapeMarkdownV2 } from '../../utils/helpers';

const router = Router();

/**
 * Маршрут (только для админов) для логирования характеристик упражнений.
 */
router.post('/admin/log-exercises', async (req: Request, res: Response) => {
    const { userId, exercise } = req.body;
    if (!userId || !exercise) {
        return res.status(400).json({ message: 'Необходимо указать userId и exercise' });
    }

    try {
        const user = await User.findOne({ telegramId: userId });
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        let message = `🔧 Лог упражнения\n\n`;
        message += `Упражнение: ${escapeMarkdownV2(exercise.name)}\n`;

        if (exercise.dataUsed && Object.keys(exercise.dataUsed).length > 0) {
            message += `*Доп. данные:* ${escapeMarkdownV2(JSON.stringify(exercise.dataUsed))}\n`;
        }

        // ID вашего администратора
        const adminChatId = 327844310;
        await bot.sendMessage(adminChatId, message, {
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: true,
        });

        console.log(`Упражнение "${exercise.name}" от пользователя ${userId} отправлено админу.`);
        res.json({ message: 'Характеристика упражнения успешно отправлена администратору.' });
    } catch (error: any) {
        console.error('Ошибка при отправке характеристики упражнения админу:', error.message);
        res.status(500).json({ message: 'Ошибка при отправке характеристики упражнения админу.' });
    }
});

export default router;
