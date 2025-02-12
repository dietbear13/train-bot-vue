import { Router } from 'express';
import {
    getUsers,
    getUserByTelegramId,
    checkUser,
    updateUser
} from '../controllers/userController';

const router = Router();

router.get('/users', getUsers);
router.get('/users/:telegramId', getUserByTelegramId);
router.post('/check-user', checkUser);
router.post('/update-user-role', updateUser);

export default router;
