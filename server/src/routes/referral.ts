// src/routes/referral.ts
import { Router } from 'express';
import User, { IUser } from '../models/User';

const router = Router();

/**
 * POST /api/referral
 *
 * Ожидает в теле запроса:
 * {
 *   "inviterId": number,  // Telegram ID пользователя, который пригласил
 *   "inviteeId": number   // Telegram ID пользователя, которого пригласили
 * }
 */
router.post('/referral', async (req, res) => {
    try {
        const { inviterId, inviteeId } = req.body;

        // Валидация входных данных
        if (typeof inviterId !== 'number' || typeof inviteeId !== 'number') {
            return res.status(400).json({ message: 'inviterId и inviteeId должны быть числами.' });
        }

        if (inviterId === inviteeId) {
            return res.status(400).json({ message: 'inviterId и inviteeId не могут быть одинаковыми.' });
        }

        // Находим (или создаём) пользователя, который приглашает (inviter)
        let inviter: IUser | null = await User.findOne({ telegramId: inviterId });
        if (!inviter) {
            inviter = new User({
                telegramId: inviterId,
                role: 'freeUser', // или другой дефолтный роль
                dateAdded: Date.now(),
                referrals: [],
            });
        }

        // Проверяем, был ли уже приглашённый пользователь приглашён этим inviter
        const alreadyReferred = inviter.referrals.some(ref => ref.inviteeId === inviteeId);
        if (alreadyReferred) {
            return res.status(400).json({ message: 'Этот пользователь уже был приглашён этим inviter.' });
        }

        // Добавляем нового реферала
        inviter.referrals.push({
            inviteeId,
            date: Date.now(),
        });

        // Сохраняем inviter
        await inviter.save();

        // Находим (или создаём) пользователя, которого пригласили (invitee)
        let invitee: IUser | null = await User.findOne({ telegramId: inviteeId });
        if (!invitee) {
            invitee = new User({
                telegramId: inviteeId,
                role: 'freeUser', // или другой дефолтный роль
                dateAdded: Date.now(),
                referrals: [],
            });
            await invitee.save();
        }

        return res.status(200).json({
            message: 'Реферальная информация успешно сохранена',
            inviterId: inviter.telegramId,
            inviteeId: invitee.telegramId,
        });
    } catch (error) {
        console.error('Ошибка при обработке реферала:', error);
        return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

/**
 * GET /api/referral/:telegramId
 *
 * Пример эндпоинта для получения всех рефералов конкретного пользователя (по его telegramId).
 * Возвращает массив referral-объектов из поля `referrals`.
 */
router.get('/referral/:telegramId', async (req, res) => {
    try {
        const { telegramId } = req.params;
        const parsedTelegramId = Number(telegramId);

        if (isNaN(parsedTelegramId)) {
            return res.status(400).json({ message: 'telegramId должен быть числом.' });
        }

        const user: IUser | null = await User.findOne({ telegramId: parsedTelegramId });
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден.' });
        }

        return res.status(200).json({ referrals: user.referrals });
    } catch (error) {
        console.error('Ошибка при получении списка рефералов:', error);
        return res.status(500).json({ message: 'Внутренняя ошибка сервера.' });
    }
});

export default router;
