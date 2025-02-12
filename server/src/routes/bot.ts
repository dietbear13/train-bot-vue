// src/routes/bot.ts

import { Router } from 'express';

// Импортируем все модули маршрутов
import checkBotAccessRouter from './bot/checkBotAccess';
import getChannelsRouter from './bot/getChannels';
import sendWorkoutRouter from './bot/sendWorkout';
import sendKbzhuRouter from './bot/sendKbzhu';
import sendDetailedPlanRouter from './bot/sendDetailedPlan';

const router = Router();

// Используем маршруты с префиксом '/bot'
router.use('/', checkBotAccessRouter);
router.use('/', getChannelsRouter);
router.use('/', sendWorkoutRouter);
router.use('/', sendKbzhuRouter);
router.use('/', sendDetailedPlanRouter);

export default router;
