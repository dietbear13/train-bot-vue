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

        console.warn('/analytics/save-kbzhu', userId, formData, kbzhuResult, timestamp)
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

/**
 * Маршрут для сохранения истории тренировок
 * @route POST /api/analytics/save-workout
 * @body {
 *   userId: number,       // telegramId пользователя
 *   gender: string,       // пол пользователя
 *   splitType: string,    // тип сплита
 *   splitId: string,      // конкретный ID сплита
 *   timestamp?: number    // (опционально) Временная метка
 * }
 */
router.post('/analytics/save-workout', async (req: Request, res: Response) => {
    try {
        const { userId, gender, goal, splitType, splitId, timestamp } = req.body;
        console.log("/analytics/save-workout req",userId, gender, goal, splitType, splitId, timestamp)
        // Проверка входных данных
        if (!userId || !goal || !gender || !splitType || !splitId) {
            return res.status(400).json({
                error: 'Отсутствуют необходимые поля (userId, gender, splitType, splitId) в теле запроса',
            });
        }

        // Поиск пользователя по telegramId
        const user = await User.findOne({ telegramId: userId });
        if (!user) {
            return res.status(404).json({
                error: `Пользователь с telegramId=${userId} не найден`,
            });
        }

        // Формируем новую запись о тренировке
        const newWorkoutEntry = {
            formData: {
                gender,
                goal,
                splitType,
                splitId,
            },
            timestamp: timestamp || Date.now(),
        };

        // Если в модели нет поля trainingHistory, нужно убедиться, что вы добавили его
        // в схему User (по аналогии с kbzhuHistory). Пример:
        // user.trainingHistory = user.trainingHistory || [];
        user.trainingHistory = user.trainingHistory || [];
        user.trainingHistory.push(newWorkoutEntry);

        await user.save();

        return res.status(201).json({
            success: true,
            message: 'Тренировка успешно сохранена в историю пользователя',
            data: newWorkoutEntry,
        });
    } catch (err) {
        console.error('Ошибка в /analytics/save-workout:', err);
        return res.status(500).json({
            error: 'Внутренняя ошибка сервера при сохранении истории тренировок',
        });
    }
});

/**
 * Маршрут для сохранения "отправленной" тренировки
 * @route POST /api/analytics/save-sended-workout
 * @body {
 *   userId: number,         // telegramId пользователя
 *   gender: string,         // пол пользователя
 *   goal: string,           // цель (Похудение, Общие, ...)
 *   splitType: string,      // тип сплита
 *   splitId: string,        // конкретный ID сплита
 *   timestamp?: number,     // Временная метка (optional)
 *   plan?: any,             // Полный план (массив дней, упражнений и т.д.)
 *   injuryFilters?: {       // Новые поля с травмами, необязательные
 *     spine?: boolean
 *     knee?: boolean
 *     shoulder?: boolean
 *   }
 * }
 */
router.post('/analytics/save-sended-workout', async (req: Request, res: Response) => {
    try {
        const {
            userId,
            gender,
            goal,
            splitType,
            splitId,
            timestamp,
            plan,
            injuryFilters // <-- Новое поле
        } = req.body;

        if (!userId || !gender || !splitType || !splitId || !plan) {
            return res.status(400).json({
                error: 'Отсутствуют необходимые поля (userId, gender, splitType, splitId, plan) в теле запроса',
            });
        }

        const user = await User.findOne({ telegramId: userId });
        if (!user) {
            return res.status(404).json({
                error: `Пользователь с telegramId=${userId} не найден`,
            });
        }

        // Формируем новое событие в trainingHistory
        const newWorkoutEntry = {
            formData: {
                gender,
                goal,
                splitType,
                splitId,
                injuryFilters: injuryFilters || {} // <-- Сохраняем фильтры
            },
            timestamp: timestamp || Date.now(),
            isSended: true, // отмечаем, что тренировка "отправлена"
            plan: plan || null
        };

        user.trainingHistory = user.trainingHistory || [];
        user.trainingHistory.push(newWorkoutEntry);

        await user.save();

        return res.status(201).json({
            success: true,
            message: 'Отправленная тренировка успешно сохранена в историю пользователя',
            data: newWorkoutEntry,
        });
    } catch (err) {
        console.error('Ошибка в /analytics/save-sended-workout:', err);
        return res.status(500).json({
            error: 'Внутренняя ошибка сервера при сохранении отправленной тренировки',
        });
    }
});



export default router;
