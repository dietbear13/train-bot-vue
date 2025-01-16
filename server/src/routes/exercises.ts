// routes/exercises.ts
import { Router, Request, Response } from 'express';
import Exercise from '../models/Exercise';

const router = Router();

/**
 * Маршрут для получения всех упражнений
 */
router.get('/exercises', async (req: Request, res: Response) => {
    try {
        const exercises = await Exercise.find();
        res.json(exercises);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Маршрут для получения упражнения по ID
 */
router.get('/exercises/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const exercise = await Exercise.findById(id);
        if (!exercise) {
            return res.status(404).json({ message: 'Упражнение не найдено' });
        }
        res.json(exercise);
    } catch (error: any) {
        console.error('Ошибка при получении упражнения:', error.message);
        res.status(500).json({ message: 'Ошибка при получении упражнения' });
    }
});



/**
 * Маршрут для создания нового упражнения
 */
router.post('/exercises', async (req: Request, res: Response) => {
    try {
        const newExercise = new Exercise(req.body);
        await newExercise.save();
        res.json(newExercise);
    } catch (error: any) {
        console.error('Ошибка при добавлении упражнения:', error.message);
        res.status(500).json({ message: 'Ошибка при добавлении упражнения' });
    }
});

/**
 * Маршрут для обновления упражнения
 */
router.put('/exercises/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const updatedExercise = await Exercise.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedExercise) return res.status(404).json({ message: 'Упражнение не найдено' });
        res.json(updatedExercise);
    } catch (error: any) {
        console.error('Ошибка при обновлении упражнения:', error.message);
        res.status(500).json({ message: 'Ошибка при обновлении упражнения' });
    }
});

/**
 * Маршрут для удаления упражнения
 */
router.delete('/exercises/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const deletedExercise = await Exercise.findByIdAndDelete(id);
        if (!deletedExercise) return res.status(404).json({ message: 'Упражнение не найдено' });
        res.json({ message: 'Упражнение удалено' });
    } catch (error: any) {
        console.error('Ошибка при удалении упражнения:', error.message);
        res.status(500).json({ message: 'Ошибка при удалении упражнения' });
    }
});

export default router;
