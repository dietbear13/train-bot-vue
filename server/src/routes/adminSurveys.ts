// routes/adminSurveys.ts
import { Router } from 'express';
import ScheduledSurvey from '../models/ScheduledSurvey';
import bot from '../bot';
import User from '../models/User'; // Понадобится, если делаем фильтрацию

const router = Router();

// GET /api/surveys
router.get('/surveys', async (req, res) => {
    const surveys = await ScheduledSurvey.find().sort({ scheduledAt: 1 });
    res.json(surveys);
});

/**
 * Тестовая отправка без записи в базу
 * Body: {
 *   telegramId?: number,
 *   filters?: string (JSON),
 *   messages: [ { text, inlineButtons, ... }, ... ]
 * }
 */
router.post('/surveys/testSend', async (req, res) => {
    const { telegramId, filters, messages } = req.body;
    if (!messages || !Array.isArray(messages) || !messages.length) {
        return res.status(400).json({ error: 'messages are required and must be non-empty array' });
    }

    try {
        // 1) Если есть telegramId — шлём одному
        if (telegramId) {
            await sendMessagesToOne(telegramId, messages);
            return res.json({ success: true });
        }

        // 2) Если нет telegramId, но есть filters
        if (filters) {
            // Предположим, filters — это JSON вида {"gender":"male","premium":true}
            // Распарсим
            let parsed: any;
            try {
                parsed = JSON.parse(filters);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid JSON in filters' });
            }
            // Ищем пользователей в базе
            const users = await User.find(parsed);
            // Рассылаем каждому
            for (const u of users) {
                await sendMessagesToOne(u.telegramId, messages);
            }
            return res.json({ success: true, count: users.length });
        }

        // Иначе — ошибка, не заданы ни telegramId, ни filters
        return res.status(400).json({ error: 'telegramId or filters is required' });
    } catch (err) {
        console.error('Ошибка при testSend:', err);
        return res.status(500).json({ error: 'Failed to send test message' });
    }
});

/** Вспомогательная функция: отправить массив сообщений одному пользователю */
async function sendMessagesToOne(telegramId: number, messages: any[]) {
    for (const msg of messages) {
        // Формируем inline-кнопки
        let inline_keyboard = [];
        if (msg.inlineButtons && msg.inlineButtons.length > 0) {
            inline_keyboard = msg.inlineButtons.map((b: any) => [{
                text: b.text,
                callback_data: b.callbackData || 'NO_CALLBACK'
            }]);
        }
        await bot.sendMessage(telegramId, msg.text, {
            reply_markup: {
                inline_keyboard
            }
        });
    }
}

// POST /api/surveys
router.post('/surveys', async (req, res) => {
    // Валидация для примера:
    if (!req.body.scheduledAt) {
        return res.status(400).json({ error: 'scheduledAt is required' });
    }
    if (!req.body.messages || !req.body.messages.length) {
        return res.status(400).json({ error: 'messages are required' });
    }

    // Создание
    const created = await ScheduledSurvey.create(req.body);
    res.json(created);
});

// PATCH /api/surveys/:id
router.patch('/surveys/:id', async (req, res) => {
    const { id } = req.params;
    const updated = await ScheduledSurvey.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updated);
});

// DELETE /api/surveys/:id
router.delete('/surveys/:id', async (req, res) => {
    const { id } = req.params;
    await ScheduledSurvey.findByIdAndDelete(id);
    res.json({ success: true });
});



export default router;
