import { Request, Response, Router } from 'express';
import ScheduledSurvey from '../models/ScheduledSurvey';
import bot from '../bot';
import User from '../models/User';

const router = Router();

// GET /api/surveys
router.get('/surveys', async (req, res) => {
    const surveys = await ScheduledSurvey.find().sort({ scheduledAt: 1 });
    res.json(surveys);
});

/**
 * Тестовая отправка без записи в базу
 * Body: {
 *   telegramId?: number | number[],
 *   messages: [ { text, inlineButtons, ... }, ... ]
 * }
 */
router.post('/surveys/testSend', async (req, res) => {
    const { telegramId, messages } = req.body;
    if (!messages || !Array.isArray(messages) || !messages.length) {
        return res.status(400).json({ error: 'messages are required and must be non-empty array' });
    }
    try {
        const targets = Array.isArray(telegramId) ? telegramId : [telegramId];
        for (const id of targets) {
            await sendMessagesToOne(id, messages);
        }
        return res.json({ success: true, count: targets.length });
    } catch (err) {
        console.error('Ошибка при testSend:', err);
        return res.status(500).json({ error: 'Failed to send test message' });
    }
});

async function sendMessagesToOne(telegramId: number, messages: any[]) {
    for (const msg of messages) {
        let inline_keyboard = [];
        if (msg.inlineButtons && msg.inlineButtons.length > 0) {
            inline_keyboard = msg.inlineButtons.map((b: any) => [{
                text: b.text,
                callback_data: b.callbackData || 'NO_CALLBACK'
            }]);
        }
        await bot.sendMessage(telegramId, msg.text, {
            reply_markup: { inline_keyboard },
        });
    }
}

// POST /api/surveys – сохранение рассылки
router.post('/surveys', async (req, res) => {
    if (!req.body.scheduledAt) {
        return res.status(400).json({ error: 'scheduledAt is required' });
    }
    if (!req.body.messages || !req.body.messages.length) {
        return res.status(400).json({ error: 'messages are required' });
    }
    const created = await ScheduledSurvey.create(req.body);
    res.json(created);
});

router.patch('/surveys/:id', async (req, res) => {
    const { id } = req.params;
    const updated = await ScheduledSurvey.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updated);
});

router.delete('/surveys/:id', async (req, res) => {
    const { id } = req.params;
    await ScheduledSurvey.findByIdAndDelete(id);
    res.json({ success: true });
});

/**
 * GET /users/matches
 * Возвращает всех пользователей с нужными полями:
 *  - telegramId, role
 *  - из последней записи kbzhuHistory: age, gender, bodyType, goal
 *  - булевы флаги наличия trainingHistory, referrals, starDonationHistory
 */
router.get('/users/matches', async (req: Request, res: Response) => {
    try {
        const users = await User.find()
            .select({
                telegramId: 1,
                role: 1,
                kbzhuHistory: 1,
                trainingHistory: 1,
                referrals: 1,
                starDonationHistory: 1,
            })
            .lean();

        const result = users.map(user => {
            let age = null,
                gender = null,
                bodyType = null,
                goal = null;
            if (user.kbzhuHistory && user.kbzhuHistory.length > 0) {
                const latestRecord = user.kbzhuHistory.reduce((prev, curr) =>
                    prev.timestamp > curr.timestamp ? prev : curr
                );
                age = latestRecord.formData.age;
                gender = latestRecord.formData.gender;
                bodyType = latestRecord.formData.bodyType;
                goal = latestRecord.formData.goal;
            }
            return {
                telegramId: user.telegramId,
                role: user.role,
                age,
                gender,
                bodyType,
                goal,
                hasTrainingHistory: !!(user.trainingHistory && user.trainingHistory.length),
                hasReferrals: !!(user.referrals && user.referrals.length),
                hasStarDonations: !!(user.starDonationHistory && user.starDonationHistory.length),
            };
        });

        return res.json(result);
    } catch (err) {
        console.error('Ошибка в /users/matches:', err);
        return res.status(400).json({ error: 'Invalid filters or DB error' });
    }
});

export default router;

//q_{userId}_{btnId}
