import { Router, Request, Response } from 'express';
import DietsListModel, { IDietsList } from '../models/DietsList';

const router = Router();

/**
 * GET /dietsList
 * Получение всех записей из коллекции DietsList
 */
router.get('/dietsList', async (req: Request, res: Response) => {
    try {
        const diets = await DietsListModel.find().lean();
        return res.json(diets);
    } catch (error) {
        console.error('Ошибка при получении списка рационов:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

/**
 * GET /dietsList/:id
 * Получение конкретной записи по её ID
 */
router.get('/dietsList/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const diet = await DietsListModel.findById(id).lean();
        if (!diet) {
            return res.status(404).json({ message: 'Рацион не найден' });
        }
        return res.json(diet);
    } catch (error) {
        console.error('Ошибка при получении рациона:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

/**
 * POST /dietsList
 * Создание новой записи в коллекции DietsList (админский маршрут)
 */
router.post('/dietsList', async (req: Request, res: Response) => {
    try {
        const newDietData: Partial<IDietsList> = req.body;
        const newDiet = await DietsListModel.create(newDietData);
        return res.status(201).json(newDiet);
    } catch (error) {
        console.error('Ошибка при создании нового рациона:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

/**
 * PUT /dietsList/:id
 * Редактирование конкретной записи (админский маршрут)
 */
router.put('/dietsList/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData: Partial<IDietsList> = req.body;

        // Обновляем документ, возвращаем обновлённую версию
        const updated = await DietsListModel.findByIdAndUpdate(id, updateData, {
            new: true,
        }).lean();

        if (!updated) {
            return res.status(404).json({ message: 'Рацион не найден или не был обновлён' });
        }

        return res.json(updated);
    } catch (error) {
        console.error('Ошибка при обновлении рациона:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

/**
 * DELETE /dietsList/:id
 * Удаление конкретной записи (админский маршрут)
 */
router.delete('/dietsList/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await DietsListModel.findByIdAndDelete(id).lean();
        if (!deleted) {
            return res.status(404).json({ message: 'Рацион не найден' });
        }
        return res.json({ message: 'Рацион успешно удалён', deleted });
    } catch (error) {
        console.error('Ошибка при удалении рациона:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;
