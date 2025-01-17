// routes/analytics/analyticsMain.ts

import { Router, Request, Response } from 'express';
import User from '../../models/User';

const router = Router();

/**
 * Маршрут для сохранения результатов КБЖУ в модели User
 * @route POST /api/analytics/save-kbzhu
 * @body {
 *   userId: number, // telegramId пользователя
 *   formData: { ... }, // Параметры генерации КБЖУ
 *   kbzhuResult: { ... }, // Результаты генерации КБЖУ
 *   timestamp?: number // (опционально) Временная метка
 * }
 */
router.post('/analytics/save-kbzhu', async (req: Request, res: Response) => {
    try {
        const { userId, formData, kbzhuResult, timestamp } = req.body;

        // Проверка входных данных
        if (!userId || !formData || !kbzhuResult) {
            return res.status(400).json({
                error: 'Отсутствует userId, formData или kbzhuResult в теле запроса',
            });
        }

        // Поиск пользователя по telegramId
        const user = await User.findOne({ telegramId: userId });
        if (!user) {
            return res.status(404).json({
                error: `Пользователь с telegramId=${userId} не найден`,
            });
        }

        // Добавляем новую запись в kbzhuHistory
        const newKbzhuEntry = {
            formData,
            kbzhuResult,
            timestamp: timestamp || Date.now(),
        };

        user.kbzhuHistory = user.kbzhuHistory || [];
        user.kbzhuHistory.push(newKbzhuEntry);

        await user.save();

        return res.status(201).json({
            success: true,
            message: 'Аналитические данные КБЖУ успешно сохранены в историю пользователя',
            data: newKbzhuEntry,
        });
    } catch (err) {
        console.error('Ошибка в /analytics/save-kbzhu:', err);
        return res.status(500).json({
            error: 'Внутренняя ошибка сервера при сохранении аналитики КБЖУ',
        });
    }
});

export default router;
