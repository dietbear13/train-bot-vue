// routes/patterns.ts
import { Router, Request, Response } from 'express';
import Pattern from '../models/Pattern';

const router = Router();

/**
 * Маршрут для получения всех паттернов
 */
router.get('/patterns', async (req: Request, res: Response) => {
    try {
        const patterns = await Pattern.find();
        res.json(patterns);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
