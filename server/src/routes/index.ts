// src/routes/index.ts

import { Router } from 'express';
import botRoutes from './bot';
import usersRoutes from './users';
import exercisesRoutes from './exercises';
import patternsRoutes from './patterns';
import splitsRoutes from './splits';
import analyticsRoutes from './analytics/analyticsMain';
import blogRoutes from './blogMain';
import blogLikesRoutes from './blogLikes';
import referralRoutes from './referral';
import donationsRoutes from './donations/stars';
import adminUsersRoutes from './adminUsersEdit';
import dietsRoutes from './dietsList';
import adminSurveysRoutes from './adminSurveys';
import {config} from "../config/env";

const router = Router();

// Подключаем все маршруты
router.use('/bot', botRoutes);
router.use('/users', usersRoutes);
router.use('/exercises', exercisesRoutes);
router.use('/patterns', patternsRoutes);
router.use('/splits', splitsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/blog', blogRoutes);
router.use('/blog-likes', blogLikesRoutes);
router.use('/referral', referralRoutes);
router.use('/donations', donationsRoutes);
router.use('/admin-users', adminUsersRoutes);
router.use('/diets', dietsRoutes);
router.use('/admin-surveys', adminSurveysRoutes);

console.log(`🔀 Маршруты запущены`);

export default router;
