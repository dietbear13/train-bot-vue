// routes/blog/blogLikes.ts

import { Router, Request, Response } from 'express';
import User from '../models/User';

const router = Router();

/**
 * GET /api/blog-likes
 * Возвращает массив постов, которые пользователь лайкнул
 * Пример запроса: /api/blog-likes?telegramId=12345
 */
router.get('/blog-likes', async (req: Request, res: Response) => {
    try {
        const { telegramId } = req.query;

        if (!telegramId) {
            return res.status(400).json({ error: 'Не передан telegramId в query-параметрах.' });
        }

        const user = await User.findOne({ telegramId: Number(telegramId) });
        if (!user) {
            return res.status(404).json({
                error: `Пользователь с telegramId=${telegramId} не найден`,
            });
        }

        // Предположим, что в user.blogLikes хранятся объекты { postId, liked, date }
        // Возвращаем только те, где liked === true
        const likedPosts = user.blogLikes
            ?.filter(item => item.liked)
            .map(item => ({ postId: item.postId })) || [];

        return res.json(likedPosts);
    } catch (error) {
        console.error('Ошибка в GET /blog-likes:', error);
        return res.status(500).json({
            error: 'Внутренняя ошибка сервера при получении лайков',
        });
    }
});

/**
 * POST /api/blog-likes
 * Тело запроса: { telegramId, postId, like }
 */
router.post('/blog-likes', async (req: Request, res: Response) => {
    try {
        const { telegramId, postId, like } = req.body;

        if (!telegramId || !postId || typeof like !== 'boolean') {
            return res.status(400).json({
                error: 'Необходимо передать telegramId, postId и like (boolean) в теле запроса',
            });
        }

        // Ищем пользователя
        const user = await User.findOne({ telegramId: Number(telegramId) });
        if (!user) {
            return res.status(404).json({
                error: `Пользователь с telegramId=${telegramId} не найден`,
            });
        }

        // Проверяем, есть ли уже запись про этот postId
        const existingLike = user.blogLikes?.find(likeObj => likeObj.postId === postId);

        if (!existingLike) {
            // Если нет записи, а пользователь ставит like = true, добавляем
            // если like = false, можно просто ничего не делать, или тоже сохранять запись
            user.blogLikes?.push({
                postId,
                liked: like,
                date: Date.now(),
            });
        } else {
            // Если запись уже есть, обновляем поле liked
            existingLike.liked = like;
            existingLike.date = Date.now(); // Обновляем время
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: `Лайк для postId=${postId} у пользователя telegramId=${telegramId} успешно обновлён`,
        });
    } catch (error) {
        console.error('Ошибка в POST /blog-likes:', error);
        return res.status(500).json({
            error: 'Внутренняя ошибка сервера при обновлении лайка',
        });
    }
});

export default router;
