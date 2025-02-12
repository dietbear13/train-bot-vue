import { Request, Response } from 'express';
import {
    findUserByTelegramId,
    getAllUsers,
    checkAndCreateUser,
    checkUserSubscription,
    updateUserRole
} from '../services/userService';

/**
 * Получить список всех пользователей
 */
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await getAllUsers();
        res.json({ users });
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error);
        res.status(500).json({ message: 'Ошибка при получении пользователей' });
    }
};

/**
 * Получить пользователя по Telegram ID
 */
export const getUserByTelegramId = async (req: Request, res: Response) => {
    const { telegramId } = req.params;
    try {
        const user = await findUserByTelegramId(Number(telegramId));
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении пользователя' });
    }
};

/**
 * Проверка и добавление пользователя, а также проверка подписки
 */
export const checkUser = async (req: Request, res: Response) => {
    const { telegramId } = req.body;

    if (!telegramId) {
        return res.status(400).json({ message: 'Необходимо указать telegramId' });
    }

    try {
        const user = await checkAndCreateUser(Number(telegramId));
        const updatedRole = await checkUserSubscription(user);
        res.json({ role: updatedRole });
    } catch (error) {
        console.error('Ошибка при проверке пользователя:', error);
        res.status(500).json({ message: 'Ошибка при работе с пользователем' });
    }
};

/**
 * Обновить роль пользователя (например, вручную админ может изменить freeUser -> paidUser)
 */
export const updateUser = async (req: Request, res: Response) => {
    const { telegramId, role, datePaid, datePaidUntil } = req.body;

    if (!telegramId || !role) {
        return res.status(400).json({ message: 'Необходимо указать telegramId и роль' });
    }

    try {
        const user = await updateUserRole(Number(telegramId), role, datePaid, datePaidUntil);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        res.json({ message: 'Роль пользователя обновлена', user });
    } catch (error) {
        console.error('Ошибка при обновлении пользователя:', error);
        res.status(500).json({ message: 'Ошибка при обновлении пользователя' });
    }
};
