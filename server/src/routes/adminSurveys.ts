// routes/index.ts (или surveys.ts)
import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import ScheduledSurvey from '../models/ScheduledSurvey';
import bot from '../bot';
import User from '../models/User';

const router = Router();

// GET /api/surveys – получение всех рассылок
router.get('/surveys', async (req: Request, res: Response) => {
    try {
        const surveys = await ScheduledSurvey.find().sort({ scheduledAt: 1 });
        res.json(surveys);
    } catch (err) {
        console.error('Ошибка получения рассылок:', err);
        res.status(500).json({ error: 'Ошибка получения рассылок' });
    }
});

/**
 * Тестовая отправка без записи в базу.
 * Body: {
 *   telegramId?: number | number[],
 *   messages: [ { text, inlineButtons, ... }, ... ],
 *   userFilters?: object
 * }
 *
 * На сервере для каждого сообщения и его inline-кнопки генерируется callback_data в формате:
 * "SURVEY|<tempSurveyId>|<messageId>|q:t:<shortButtonText>"
 */
router.post('/surveys/testSend', async (req: Request, res: Response) => {
    const { telegramId, messages, userFilters } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
            error: 'messages are required and must be a non-empty array'
        });
    }

    if (!telegramId && (!userFilters || Object.keys(userFilters).length === 0)) {
        return res.status(400).json({
            error: 'Either telegramId or valid userFilters must be provided'
        });
    }

    // Генерируем временный идентификатор рассылки (т.к. тестовая отправка не сохраняется в базу)
    const tempSurveyId = new mongoose.Types.ObjectId().toString();

    // Вспомогательная функция для нормализации текста кнопки
    function makeCallbackDataFromText(txt: string): string {
        let result = txt.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        if (result.length > 64) result = result.substring(0, 64);
        return result;
    }

    // Обрабатываем массив сообщений: если у сообщения отсутствует _id, генерируем его;
    // затем для каждой кнопки генерируем callback_data на сервере.
    messages.forEach((msg: any) => {
        if (!msg._id) {
            msg._id = new mongoose.Types.ObjectId().toString();
        }
        if (Array.isArray(msg.inlineButtons)) {
            msg.inlineButtons.forEach((btn: any) => {
                btn.callbackData = `SURVEY|${tempSurveyId}|${msg._id}|q_t_${makeCallbackDataFromText(btn.text)}`;
            });
        }
        console.log('Processed message:', msg);
    });

    try {
        // Если telegramId передан как одно значение – оборачиваем его в массив
        const targets = Array.isArray(telegramId) ? telegramId : [telegramId];
        console.log('/surveys/testSend → targets', targets);
        let sentCount = 0;
        for (const id of targets) {
            await sendMessagesToOne(id, messages);
            sentCount++;
        }
        console.log('res.json', res.json({ success: true, count: targets.length }))
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
            // Используем готовое значение callbackData, сгенерированное на сервере
            inline_keyboard = msg.inlineButtons.map((b: any) => [{
                text: b.text,
                callback_data: b.callbackData
            }]);
        }
        console.log('inline_keyboard', inline_keyboard)
        await bot.sendMessage(telegramId, msg.text, {
            reply_markup: { inline_keyboard },
        });
    }
}

// POST /api/surveys – сохранение новой рассылки
router.post('/surveys', async (req: Request, res: Response) => {
    try {
        const { scheduledAt, messages } = req.body;
        if (!scheduledAt) {
            return res.status(400).json({ error: 'scheduledAt is required' });
        }
        if (!messages || !messages.length) {
            return res.status(400).json({ error: 'messages are required' });
        }
        // Преобразуем строку с датой в объект Date (при условии, что дата передаётся в формате ISO)
        req.body.scheduledAt = new Date(scheduledAt);
        const created = await ScheduledSurvey.create(req.body);
        res.json(created);
    } catch (err) {
        console.error('Ошибка при сохранении рассылки:', err);
        res.status(500).json({ error: 'Failed to save survey' });
    }
});

// PATCH /api/surveys/:id – обновление рассылки
router.patch('/surveys/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (req.body.scheduledAt) {
            req.body.scheduledAt = new Date(req.body.scheduledAt);
        }
        const updated = await ScheduledSurvey.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        console.error('Ошибка при обновлении рассылки:', err);
        res.status(500).json({ error: 'Failed to update survey' });
    }
});

// DELETE /api/surveys/:id – удаление рассылки
router.delete('/surveys/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await ScheduledSurvey.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (err) {
        console.error('Ошибка при удалении рассылки:', err);
        res.status(500).json({ error: 'Failed to delete survey' });
    }
});

/**
 * GET /users/matches – получение пользователей с нужными полями
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
