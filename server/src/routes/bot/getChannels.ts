// src/routes/bot/getChannels.ts

import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Маршрут: получение списка каналов, к которым бот имеет доступ
 */
router.get('/get-channels', async (req: Request, res: Response) => {
    try {
        // Пример: здесь вы можете вернуть список каналов из БД или констант
        const channels = [
            { id: '@training_health', title: 'Тренировки & Здоровье' },
            // Добавьте другие каналы по необходимости
        ];
        res.json({ channels });
    } catch (error: any) {
        console.error('Ошибка при получении списка каналов:', error.message);
        res.status(500).json({ message: 'Ошибка при получении списка каналов', error: error.message });
    }
});

export default router;
