// routes/users.ts

import { Router, Request, Response } from 'express';
import User from '../models/User';

// Импортируем наш bot из bot.ts
import { bot } from './bot';

const router = Router();

/**
 * Маршрут для получения списка всех пользователей (только для администраторов)
 */
router.get('/users', async (req: Request, res: Response) => {
    try {
        const users = await User.find({}, '-__v -password'); // Исключаем ненужные поля
        res.json({ users });
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error);
        res.status(500).json({ message: 'Ошибка при получении пользователей' });
    }
});

/**
 * Маршрут для проверки и добавления (при необходимости) пользователя.
 * Кроме того, проверяет фактическую подписку (для не-админа).
 */
router.post('/check-user', async (req: Request, res: Response) => {

    const { telegramId } = req.body;

    if (!telegramId) {
        return res.status(400).json({ message: 'Необходимо указать telegramId' });
    }

    try {
        let user = await User.findOne({ telegramId });

        // 1) Создаём, если не существует
        if (!user) {
            // Допустим, жёстко один админ:
            const isAdmin = telegramId === 327844310;

            user = new User({
                telegramId,
                role: isAdmin ? 'admin' : 'freeUser',
                dateAdded: Math.floor(Date.now() / 1000), // UNIX timestamp
            });
            await user.save();
            console.log(`Добавлен новый пользователь: ${telegramId}`);
        } else {
            console.log(`Пользователь найден: ${telegramId}`);
        }

        // 2) Если пользователь админ, ничего не меняем и сразу возвращаем
        if (user.role === 'admin') {
            return res.json({ role: user.role });
        }

        // 3) Не админ? — проверяем реальную подписку в канале
        let isSubscribed = false;
        const channelUsername = '@training_health'; // ваш канал

        try {
            // Запрашиваем статус пользователя в канале
            const chatMember = await bot.getChatMember(channelUsername, telegramId);
            // Если status = 'member' / 'administrator' / 'creator', значит подписан
            if (
                chatMember.status !== 'left' &&
                chatMember.status !== 'kicked'
            ) {
                isSubscribed = true;
            }
        } catch (err: any) {
            console.error('Ошибка при обращении к Telegram API:', err.message);
            // Если не можем получить статус, возвращаем текущую роль без изменения
            return res.json({ role: user.role, error: 'Ошибка Telegram API' });
        }

        // 4) Сопоставляем факт подписки с текущей role
        if (isSubscribed) {
            // Если подписан, но в базе всё ещё freeUser => переводим в paidUser
            if (user.role !== 'paidUser') {
                user.role = 'paidUser';
                await user.save();
                console.log(`Обновлена роль на paidUser у пользователя: ${telegramId}`);
            }
        } else {
            // Не подписан. Если в базе стоит paidUser => сбрасываем на freeUser
            if (user.role === 'paidUser') {
                user.role = 'freeUser';
                await user.save();
                console.log(`Пользователь ${telegramId} отписался, роль изменена на freeUser.`);
            }
        }

        // 5) Возвращаем актуальную роль
        return res.json({ role: user.role });
    } catch (error: any) {
        console.error('Ошибка', error);
        console.error('Ошибка при работе с пользователем:', error.message);
        res.status(500).json({ message: 'Ошибка при работе с пользователем' });
    }
});

/**
 * Маршрут для обновления роли пользователя (например, вручную админ может перевести freeUser -> paidUser).
 */
router.post('/update-user-role', async (req: Request, res: Response) => {
    const { telegramId, role, datePaid, datePaidUntil } = req.body;

    if (!telegramId || !role) {
        return res.status(400).json({ message: 'Необходимо указать telegramId и роль' });
    }

    try {
        const user = await User.findOne({ telegramId });

        if (user) {
            user.role = role;
            if (datePaid) user.datePaid = datePaid;
            if (datePaidUntil) user.datePaidUntil = datePaidUntil;

            await user.save();
            res.json({ message: 'Роль пользователя обновлена' });
        } else {
            res.status(404).json({ message: 'Пользователь не найден' });
        }
    } catch (error: any) {
        console.error('Ошибка при обновлении пользователя:', error.message);
        res.status(500).json({ message: 'Ошибка при обновлении пользователя' });
    }
});

export default router;
