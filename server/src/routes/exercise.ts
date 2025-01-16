// routes/exercise.ts (новый отдельный маршрут)
import { Router, Request, Response } from 'express';
import ExerciseModel from '../models/Exercise'; // ваша mongoose-модель или любая другая
// ... если нужно, подключите другие зависимости

const router = Router();

/**
 * GET /exercise
 * Поиск упражнения по названию (query: name)
 */
router.get('/exercise', async (req: Request, res: Response) => {
    try {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({ message: 'Не передано название упражнения' });
        }

        // Ищем упражнение в БД
        const exercise = await ExerciseModel.findOne({ name: name }).lean();

        if (!exercise) {
            return res.status(404).json({ message: 'Упражнение не найдено' });
        }

        return res.json(exercise);
    } catch (error) {
        console.error('Ошибка при поиске упражнения:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;
