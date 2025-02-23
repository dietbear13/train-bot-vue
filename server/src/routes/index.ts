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


// Проверяем правильность экспорта
const routes = [
    { path: '/', module: botRoutes },
    { path: '/', module: usersRoutes },
    { path: '/', module: exercisesRoutes },
    { path: '/', module: patternsRoutes },
    { path: '/', module: splitsRoutes },
    { path: '/', module: analyticsRoutes },
    { path: '/', module: blogRoutes },
    { path: '/', module: blogLikesRoutes },
    { path: '/', module: referralRoutes },
    { path: '/', module: donationsRoutes },
    { path: '/', module: adminUsersRoutes },
    { path: '/', module: dietsRoutes },
    { path: '/', module: adminSurveysRoutes },
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
