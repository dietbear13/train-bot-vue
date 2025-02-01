import { Router, Request, Response } from 'express';
import User from '../models/User'; // ваш mongoose-модель User

const router = Router();

/**
 * Удалить пользователя полностью
 * @route DELETE /api/users/:userId
 */
router.delete('/users/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Используем deleteOne() вместо remove()
        await User.deleteOne({ _id: userId });

        return res.status(200).json({ success: true, message: 'Пользователь удалён' });
    } catch (err) {
        console.error('Ошибка при удалении пользователя:', err);
        return res.status(500).json({ error: 'Ошибка сервера при удалении пользователя' });
    }
});

/**
 * Удалить запись КБЖУ по её _id
 * @route DELETE /api/users/:userId/kbzhu/:kbzhuId
 */
router.delete('/users/:userId/kbzhu/:kbzhuId', async (req: Request, res: Response) => {
    try {
        const { userId, kbzhuId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Фильтруем массив kbzhuHistory, удаляя нужную запись
        const originalLength = user.kbzhuHistory?.length || 0;
        user.kbzhuHistory = user.kbzhuHistory?.filter((item: any) => item._id?.toString() !== kbzhuId);

        // Проверяем, был ли удалён элемент
        if ((user.kbzhuHistory?.length || 0) === originalLength) {
            return res.status(404).json({ error: 'Запись КБЖУ не найдена' });
        }

        await user.save();
        return res.status(200).json({ success: true, message: 'Запись КБЖУ удалена' });
    } catch (err) {
        console.error('Ошибка при удалении записи КБЖУ:', err);
        return res.status(500).json({ error: 'Ошибка сервера при удалении КБЖУ' });
    }
});

/**
 * Удалить запись из trainingHistory по её _id
 * @route DELETE /api/users/:userId/training/:trainId
 */
router.delete('/users/:userId/training/:trainId', async (req: Request, res: Response) => {
    try {
        const { userId, trainId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Фильтруем массив trainingHistory, удаляя нужную запись
        const originalLength = user.trainingHistory?.length || 0;
        user.trainingHistory = user.trainingHistory?.filter((item: any) => item._id?.toString() !== trainId);

        // Проверяем, был ли удалён элемент
        if ((user.trainingHistory?.length || 0) === originalLength) {
            return res.status(404).json({ error: 'Запись тренировки не найдена' });
        }

        await user.save();
        return res.status(200).json({ success: true, message: 'Запись тренировки удалена' });
    } catch (err) {
        console.error('Ошибка при удалении записи тренировки:', err);
        return res.status(500).json({ error: 'Ошибка сервера при удалении записи тренировки' });
    }
});

export default router;
