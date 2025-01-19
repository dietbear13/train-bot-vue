// routes/donations/index.ts

import express from 'express';
import starsRoutes from './stars';

const router = express.Router();

// Подключаем маршруты для звезд
router.use('/stars', starsRoutes);

export default router;
