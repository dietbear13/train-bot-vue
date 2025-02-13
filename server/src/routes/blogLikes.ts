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

        // Возвращаем только те посты, где liked === true
        const likedPosts = user.blogLikes
            .filter(item => item.liked)
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
        const existingLike = user.blogLikes.find(likeObj => likeObj.postId === postId);

        if (!existingLike) {
            if (like) {
                // Добавляем новый лайк
                user.blogLikes.push({
                    postId: postId, // Используем строку напрямую
                    liked: like,
                    date: Date.now(),
                });
            }
            // Если like = false и записи нет, ничего не делаем
        } else {
            if (like) {
                // Обновляем существующий лайк на true
                existingLike.liked = true;
                existingLike.date = Date.now();
            } else {
                // Удаляем лайк, если пользователь анлайкает
                user.blogLikes = user.blogLikes.filter(likeObj => likeObj.postId !== postId);
            }
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

/**
 * GET /api/blog-likes/all
 * Возвращает агрегированное число лайков для каждого postId,
 * формируя массив вида [{ postId: <значение>, count: <число> }, ...].
 */
router.get('/blog-likes/all', async (req: Request, res: Response) => {
    try {
        // Разворачиваем массив blogLikes у каждого пользователя
        // и считаем общее кол-во лайков (liked = true) для каждого postId
        const pipeline = [
            { $unwind: '$blogLikes' },
            { $match: { 'blogLikes.liked': true } },
            {
                $group: {
                    _id: '$blogLikes.postId',
                    count: { $sum: 1 },
                },
            },
        ];

        const results = await User.aggregate(pipeline);

        // Преобразуем _id в postId
        const counts = results.map(r => ({
            postId: r._id, // Уже строка, преобразование не требуется
            count: r.count,
        }));

        return res.json(counts);
    } catch (error) {
        console.error('Ошибка в GET /blog-likes/all:', error);
        return res.status(500).json({
            error: 'Внутренняя ошибка сервера при агрегации лайков',
        });
    }
});

export default router;
