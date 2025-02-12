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

const router = Router();

// Проверяем, что маршруты не undefined
console.log('🔍 Проверка импортов маршрутов:', {
    botRoutes,
    usersRoutes,
    exercisesRoutes,
    patternsRoutes,
    splitsRoutes,
    analyticsRoutes,
    blogRoutes,
    blogLikesRoutes,
    referralRoutes,
    donationsRoutes,
    adminUsersRoutes,
    dietsRoutes,
    adminSurveysRoutes
});

// Проверяем правильность экспорта
const routes = [
    { path: '/bot', module: botRoutes },
    { path: '/users', module: usersRoutes },
    { path: '/exercises', module: exercisesRoutes },
    { path: '/patterns', module: patternsRoutes },
    { path: '/splits', module: splitsRoutes },
    { path: '/analytics', module: analyticsRoutes },
    { path: '/blog', module: blogRoutes },
    { path: '/blog-likes', module: blogLikesRoutes },
    { path: '/referral', module: referralRoutes },
    { path: '/donations', module: donationsRoutes },
    { path: '/admin-users', module: adminUsersRoutes },
    { path: '/diets', module: dietsRoutes },
    { path: '/admin-surveys', module: adminSurveysRoutes }
];

// Проверяем наличие маршрутов перед добавлением
routes.forEach(({ path, module }) => {
    if (!module || typeof module.use !== 'function') {
        console.error(`❌ Ошибка: маршрут ${path} не загружен корректно.`);
    } else {
        router.use(path, module);
    }
});

export default router;
