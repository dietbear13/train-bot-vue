// src/routes/referral.ts
import { Router } from 'express';
import User from '../models/User';

const router = Router();

// POST /api/referral
router.post('/referral', async (req, res) => {
    try {
        const { inviterId, inviteeId } = req.body;

        if (!inviterId || !inviteeId) {
            return res.status(400).json({ message: 'inviterId и inviteeId обязательны' });
        }

        // Найти пригласившего по telegramId
        const inviter = await User.findOne({ telegramId: inviterId });
        if (!inviter) {
            return res.status(404).json({ message: 'Пользователь-пригласитель не найден' });
        }

        // Проверить, существует ли приглашённый пользователь
        const invitee = await User.findOne({ telegramId: inviteeId });
        if (!invitee) {
            return res.status(404).json({ message: 'Приглашённый пользователь не найден' });
        }

        // Добавить приглашённого в список рефералов пригласившего
        inviter.referrals = inviter.referrals || [];
        inviter.referrals.push({
            inviteeId: inviteeId,
            date: Math.floor(Date.now() / 1000), // Текущая дата в UNIX timestamp
        });

        await inviter.save();

        return res.status(200).json({ message: 'Реферал успешно добавлен' });
    } catch (error) {
        console.error('Ошибка при обработке реферала:', error);
        return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

export default router;
