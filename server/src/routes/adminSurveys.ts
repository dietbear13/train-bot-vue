// routes/adminSurveys.ts (пример на Express)
import { Router } from 'express';
import ScheduledSurvey from '../models/ScheduledSurvey';

const router = Router();

// Получить все рассылки
router.get('/', async (req, res) => {
    const surveys = await ScheduledSurvey.find().sort({ scheduledAt: 1 });
    res.json(surveys);
});

// Создать новую
router.post('/', async (req, res) => {
    // req.body = { telegramId, scheduledAt, messages[...] }
    const created = await ScheduledSurvey.create(req.body);
    res.json(created);
});

// Редактировать
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const updated = await ScheduledSurvey.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updated);
});

// Удалить
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    await ScheduledSurvey.findByIdAndDelete(id);
    res.json({ success: true });
});

export default router;
