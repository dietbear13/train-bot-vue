// routes/blog/blogMain.ts

import { Router, Request, Response } from 'express';
import BlogPost from '../models/Blog';

const router = Router();

/**
 * GET /api/blog
 * Получаем список всех статей
 */
router.get('/blog', async (req: Request, res: Response) => {
    try {
        const posts = await BlogPost.find().sort({ publishedAt: -1 });
        console.log('Полученные посты:', posts);
        return res.json(posts);
    } catch (error) {
        console.error('Ошибка GET /blog:', error);
        return res.status(500).json({ error: 'Ошибка при получении списка постов' });
    }
});

/**
 * GET /api/blog/:id
 * Получаем конкретную статью по ID
 */
router.get('/blog/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const post = await BlogPost.findById(id);
        if (!post) {
            return res.status(404).json({ error: 'Статья не найдена' });
        }
        return res.json(post);
    } catch (error) {
        console.error('Ошибка GET /blog/:id:', error);
        return res.status(500).json({ error: 'Ошибка при получении статьи' });
    }
});

/**
 * POST /api/blog
 * Создаём новую статью
 * Тело запроса: { title, body, publishedAt? }
 */
router.post('/blog', async (req: Request, res: Response) => {
    try {
        const { title, body, publishedAt } = req.body;
        if (!title || !body) {
            return res.status(400).json({ error: 'Необходимо передать title и body' });
        }

        const newPost = new BlogPost({
            title,
            body,
            publishedAt: publishedAt ? publishedAt : Date.now(),
        });
        await newPost.save();

        return res.status(201).json({
            success: true,
            data: newPost,
        });
    } catch (error) {
        console.error('Ошибка POST /blog:', error);
        return res.status(500).json({ error: 'Ошибка при создании статьи' });
    }
});

/**
 * PUT /api/blog/:id
 * Обновляем статью (title, body)
 */
router.put('/blog/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, body } = req.body;

        const post = await BlogPost.findById(id);
        if (!post) {
            return res.status(404).json({ error: 'Статья не найдена' });
        }

        // Обновляем поля, если они переданы
        if (typeof title === 'string') post.title = title;
        if (typeof body === 'string') post.body = body;

        await post.save();

        return res.json({
            success: true,
            data: post,
        });
    } catch (error) {
        console.error('Ошибка PUT /blog/:id:', error);
        return res.status(500).json({ error: 'Ошибка при обновлении статьи' });
    }
});

/**
 * DELETE /api/blog/:id
 * Удаляем статью
 */
router.delete('/blog/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const post = await BlogPost.findByIdAndDelete(id);
        if (!post) {
            return res.status(404).json({ error: 'Статья не найдена или уже удалена' });
        }
        return res.json({ success: true, message: 'Статья успешно удалена' });
    } catch (error) {
        console.error('Ошибка DELETE /blog/:id:', error);
        return res.status(500).json({ error: 'Ошибка при удалении статьи' });
    }
});

export default router;
