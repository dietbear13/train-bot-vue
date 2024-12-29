// routes/splits.ts
import { Router, Request, Response } from 'express';
import SplitModel from '../models/Split';

const router = Router();

/**
 * Маршрут для получения сплитов
 */
router.get('/splits', async (req: Request, res: Response) => {
    try {
        const splits = await SplitModel.find();
        res.json(splits);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
