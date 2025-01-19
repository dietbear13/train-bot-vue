// routes/donations/stars.ts

import express, { Request, Response } from 'express';
import StarDonation from '../../models/StarDonation';
import bot from '../../bot'; // Импортируем бота для отправки сообщений

const router = express.Router();

/**
 * Маршрут для обработки сбора звезд
 * POST /api/donations/stars
 * Body: { userId: number, stars: number }
 */
router.post('/stars', async (req: Request, res: Response) => {
    const { userId, stars } = req.body;

    if (!userId || !stars) {
        return res.status(400).json({ message: 'Необходимые данные отсутствуют.' });
    }

    try {
        const starDonation = new StarDonation({
            userId,
            stars,
        });

        await starDonation.save();

        // Отправка сообщения пользователю в Telegram
        await bot.sendMessage(userId, `Спасибо за сбор ${stars} звезды! Мы ценим вашу поддержку.`);

        res.status(200).json({ message: 'Звезды успешно собраны.' });
    } catch (error) {
        console.error('Ошибка при сохранении звезд:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера.' });
    }
});

export default router;
