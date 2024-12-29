// routes/users.ts
import { Router, Request, Response } from 'express';
import User from '../models/User';

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
 * Маршрут для проверки и добавления пользователя
 */
router.post('/check-user', async (req: Request, res: Response) => {
    const { telegramId } = req.body;

    if (!telegramId) {
        return res.status(400).json({ message: 'Необходимо указать telegramId' });
    }

    try {
        let user = await User.findOne({ telegramId });

        if (!user) {
            // Проверяем, является ли пользователь администратором
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

        res.json({ role: user.role });
    } catch (error: any) {
        console.error('Ошибка при работе с пользователем:', error.message);
        res.status(500).json({ message: 'Ошибка при работе с пользователем' });
    }
});

/**
 * Маршрут для обновления роли пользователя
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
