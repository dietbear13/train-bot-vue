// src/routes/bot/publishPost.ts

import { Router, Request, Response } from 'express';
import { bot } from './botInstance';
import { escapeMarkdownV2 } from '../../utils/helpers';
import cron from 'node-cron';
import moment from 'moment-timezone';

const router = Router();

/**
 * Отправка поста (текст/фото) в канал с парсингом MarkdownV2
 */
const sendPost = async (channelId: string, content: string, imageUrl?: string) => {
    try {
        const escapedContent = escapeMarkdownV2(content);
        console.log('Сообщение для отправки:', escapedContent);

        if (imageUrl) {
            await bot.sendPhoto(channelId, imageUrl, {
                caption: escapedContent,
                parse_mode: 'MarkdownV2',
            });
            console.log(`Фото с подписью отправлено в канал ${channelId}`);
        } else {
            await bot.sendMessage(channelId, escapedContent, {
                parse_mode: 'MarkdownV2',
                disable_web_page_preview: true,
            });
            console.log(`Текстовое сообщение отправлено в канал ${channelId}`);
        }
    } catch (error: any) {
        console.error('Ошибка при отправке поста:', error.response?.body || error.message);
        throw error;
    }
};

/**
 * Планирование отложенной публикации поста
 */
const schedulePost = (
    channelId: string,
    content: string,
    imageUrl: string | undefined,
    time: string
) => {
    const scheduledDate = moment(time);

    if (!scheduledDate.isValid()) {
        throw new Error('Некорректное время публикации');
    }

    // Пример: "0 10 23 3 *" => 23 марта 10:00
    const cronTime = `${scheduledDate.minute()} ${scheduledDate.hour()} ${scheduledDate.date()} ${scheduledDate.month() + 1} *`;
    cron.schedule(cronTime, () => {
        sendPost(channelId, content, imageUrl).catch((err: any) => console.error(err));
    });

    console.log(`Пост запланирован на ${scheduledDate.format('YYYY-MM-DD HH:mm')}`);
};

/**
 * Маршрут: публикация (или планирование) поста
 */
router.post('/publish-post', async (req: Request, res: Response) => {
    const { channelId, postContent, imageUrl, publishNow, scheduledTime } = req.body;

    if (!channelId || !postContent) {
        return res.status(400).json({ message: 'Необходимо указать channelId и postContent' });
    }

    try {
        if (publishNow) {
            await sendPost(channelId, postContent, imageUrl);
            res.json({ success: true, message: 'Пост опубликован' });
        } else {
            schedulePost(channelId, postContent, imageUrl, scheduledTime);
            res.json({ success: true, message: 'Пост запланирован' });
        }
    } catch (error: any) {
        console.error('Ошибка при публикации поста:', error.message);
        res.status(500).json({ message: 'Ошибка при публикации поста', error: error.message });
    }
});

export default router;
