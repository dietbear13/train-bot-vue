// routes/bot.ts
import { Router, Request, Response } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import User from '../models/User';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

const botToken = process.env.TELEGRAM_BOT_TOKEN as string;
const bot = new TelegramBot(botToken, { polling: false });

/**
 * Функция для экранирования специальных символов MarkdownV2,
 * но не URL в ссылках.
 */
const escapeMarkdownV2 = (text: string): string => {
    // Список специальных символов для MarkdownV2
    const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
    const escapeRegex = new RegExp(`([${specialChars.map(char => '\\' + char).join('')}])`, 'g');

    // Экранирование всех специальных символов
    let escapedText = text.replace(escapeRegex, '\\$1');

    return escapedText;
};

/**
 * Функция для отправки поста в канал без предпросмотра ссылок
 */
const sendPost = async (channelId: string, content: string, imageUrl?: string) => {
    try {
        // Экранируем текст контента
        const escapedContent = escapeMarkdownV2(content);

        // Логирование сообщения для отладки
        console.log('Сообщение для отправки:', escapedContent);

        if (imageUrl) {
            // Отправляем фото с подписью
            await bot.sendPhoto(channelId, imageUrl, {
                caption: escapedContent,
                parse_mode: 'MarkdownV2',
            });
            console.log(`Фото с подписью отправлено в канал ${channelId}`);
        } else {
            // Отправляем текстовое сообщение
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
 * Функция для планирования публикации поста
 */
const schedulePost = (channelId: string, content: string, imageUrl: string | undefined, time: string) => {
    // Используем библиотеку node-cron для планирования задач
    const cron = require('node-cron');
    const moment = require('moment-timezone');

    // Парсим время публикации
    const scheduledDate = moment(time);

    // Проверяем, корректно ли распарсено время
    if (!scheduledDate.isValid()) {
        throw new Error('Некорректное время публикации');
    }

    // Создаём строку cron-формата
    const cronTime = `${scheduledDate.minute()} ${scheduledDate.hour()} ${scheduledDate.date()} ${scheduledDate.month() + 1} *`;

    cron.schedule(cronTime, () => {
        sendPost(channelId, content, imageUrl);
    });

    console.log(`Пост запланирован на ${scheduledDate.format('YYYY-MM-DD HH:mm')}`);
};

/**
 * Маршрут для проверки доступа бота к каналу
 */
router.post('/check-bot-access', async (req: Request, res: Response) => {
    const { channelId } = req.body;

    if (!channelId) {
        return res.status(400).json({ message: 'Необходимо указать channelId' });
    }

    try {
        // Получаем информацию о боте
        const botInfo = await bot.getMe();

        // Проверяем, является ли бот администратором
        const chatMember = await bot.getChatMember(channelId, botInfo.id);
        const hasAccess = ['administrator', 'creator'].includes(chatMember.status);

        res.json({ hasAccess });
    } catch (error: any) {
        console.error('Ошибка при проверке доступа бота к каналу:', error.message);
        res.status(500).json({ message: 'Ошибка при проверке доступа бота к каналу', error: error.message });
    }
});

/**
 * Маршрут для получения списка каналов, к которым бот имеет доступ
 */
router.get('/get-channels', async (req: Request, res: Response) => {
    try {
        // Здесь вы должны реализовать логику получения каналов, к которым бот имеет доступ.
        // Например, если у вас есть база данных с каналами:
        const channels = [
            { id: '@training_health', title: 'Тренировки & Здоровье' },
            // Добавьте другие каналы
        ];

        res.json({ channels });
    } catch (error: any) {
        console.error('Ошибка при получении списка каналов:', error.message);
        res.status(500).json({ message: 'Ошибка при получении списка каналов', error: error.message });
    }
});

/**
 * Маршрут для публикации поста
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
            // Планируем отложенную публикацию
            schedulePost(channelId, postContent, imageUrl, scheduledTime);
            res.json({ success: true, message: 'Пост запланирован' });
        }
    } catch (error: any) {
        console.error('Ошибка при публикации поста:', error.message);
        res.status(500).json({ message: 'Ошибка при публикации поста', error: error.message });
    }
});

/**
 * Маршрут для получения информации о пользователе из Telegram API
 */
router.post('/get-user-info', async (req: Request, res: Response) => {
    const { telegramId } = req.body;

    if (!telegramId) {
        return res.status(400).json({ message: 'Необходимо указать telegramId' });
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getChat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: telegramId }),
        });
        const data = await response.json();

        if (data.ok) {
            res.json(data.result);
        } else {
            res.status(400).json({ message: data.description });
        }
    } catch (error: any) {
        console.error('Ошибка при запросе к Telegram API:', error.message);
        res.status(500).json({ message: 'Ошибка при запросе к Telegram API' });
    }
});

/**
 * Маршрут для проверки подписки пользователя на канал и обновления его роли
 */
router.post('/check-subscription', async (req: Request, res: Response) => {
    const { telegramId } = req.body;

    if (!telegramId) {
        return res.status(400).json({ message: 'Необходимо указать telegramId' });
    }

    try {
        const channelId = '@training_health';
        const chatMember = await bot.getChatMember(channelId, telegramId);
        const isSubscribed = ['member', 'administrator', 'creator'].includes(chatMember.status);

        // Получаем пользователя из базы данных
        const user = await User.findOne({ telegramId });

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // Если пользователь является администратором, не изменяем его роль
        if (user.role === 'admin') {
            return res.json({
                isSubscribed: true,
                message: 'Пользователь является администратором, роль не изменена.'
            });
        }

        if (isSubscribed) {
            user.role = 'paidUser';
            await user.save();
            res.json({
                isSubscribed: true,
                message: 'Подписка подтверждена, роль пользователя обновлена.'
            });
        } else {
            res.json({ isSubscribed: false, message: 'Пользователь не подписан на канал.' });
        }
    } catch (error: any) {
        console.error('Ошибка при проверке подписки:', error.message);
        res.status(500).json({ message: 'Ошибка при проверке подписки' });
    }
});

/**
 * Функция для отправки тренировки пользователю
 */
const sendWorkoutToUser = (
    chatId: number,
    muscleGroup: string,
    date: string,
    workout: { name: string; sets: number; reps: number }[]
) => {
    let message = `${muscleGroup}, тренировка (${date})\n\n`;
    message += '[Генератор тренировок](https://t.me/freeload_top_bot)\n';
    message += '[Канал о тренировках и здоровье](https://t.me/training_health)\n\n';
    workout.forEach((exercise, index) => {
        message += `${index + 1}. ${exercise.name} — ${exercise.sets}×${exercise.reps}\n`;
    });

    // Логирование для отладки
    console.log('Сообщение для отправки:', message);

    bot
        .sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
        })
        .then(() => {
            console.log(`Workout sent to user ${chatId}`);
        })
        .catch((error) => {
            console.error('Error sending message to user:', error.response?.body || error.message);
        });
};

/**
 * Маршрут для отправки тренировки
 */
router.post('/send-workout', async (req: Request, res: Response) => {
    const { userId, muscleGroup, date, workout } = req.body;

    if (!userId || !muscleGroup || !date || !workout) {
        return res.status(400).json({ message: 'Необходимо указать userId, muscleGroup, date и workout' });
    }

    try {
        sendWorkoutToUser(userId, muscleGroup, date, workout);
        res.json({ message: 'Тренировка отправлена в Telegram' });
    } catch (error: any) {
        console.error('Ошибка при отправке сообщения в Telegram:', error.message);
        res.status(500).json({ message: 'Ошибка при отправке сообщения в Telegram' });
    }
});

/**
 * Функция для отправки результатов КБЖУ пользователю
 */
const sendKbzhuResultToUser = (
    chatId: number,
    kbzhuResult: { calories: number; proteins: number; fats: number; carbs: number }
) => {
    let message = 'Ваши результаты расчёта КБЖУ:\n\n';
    message += `Калории: ${kbzhuResult.calories} ккал\n`;
    message += `Белки: ${kbzhuResult.proteins} г\n`;
    message += `Жиры: ${kbzhuResult.fats} г\n`;
    message += `Углеводы: ${kbzhuResult.carbs} г\n`;

    console.log(`KbzhuResult sent to user ${chatId}`);

    const escapedMessage = escapeMarkdownV2(message);

    bot
        .sendMessage(chatId, escapedMessage, {
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: true,
        })
        .then(() => {
            console.log(`KbzhuResult sent to user ${chatId}`);
        })
        .catch((error) => {
            console.error('Error sending KbzhuResult to user:', error.response?.body || error.message);
        });
};

/**
 * Маршрут для отправки результатов КБЖУ
 */
router.post('/send-kbzhu', async (req: Request, res: Response) => {
    const { userId, kbzhuResult } = req.body;

    if (!userId || !kbzhuResult) {
        return res.status(400).json({ message: 'Необходимо указать userId и kbzhuResult' });
    }

    try {
        sendKbzhuResultToUser(userId, kbzhuResult);
        res.json({ message: 'Результаты отправлены в Telegram' });
    } catch (error: any) {
        console.error('Ошибка при отправке сообщения в Telegram:', error.message);
        res.status(500).json({ message: 'Ошибка при отправке сообщения в Telegram' });
    }
});

/**
 * Маршрут для логирования характеристик упражнений (только для администраторов)
 */
router.post('/admin/log-exercises', async (req: Request, res: Response) => {
    const { userId, exercise } = req.body;
    console.log("userId exercise", userId, exercise)
    if (!userId || !exercise) {
        return res.status(400).json({ message: 'Необходимо указать userId и exercise' });
    }

    try {
        // Получаем информацию о пользователе (при необходимости)
        const user = await User.findOne({ telegramId: userId });
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // Формируем сообщение для администратора
        let message = `🔧 *Лог упражнения от пользователя:* ${userId}\n\n`;
        message += `*Упражнение:* ${exercise.name}\n`;
        message += `*Подходы × Повторения:* ${exercise.sets}×${exercise.reps}\n`;

        // Если есть дополнительные данные
        if (exercise.dataUsed && Object.keys(exercise.dataUsed).length > 0) {
            message += `*Дополнительные данные:* ${JSON.stringify(exercise.dataUsed)}\n`;
        }

        // Экранируем специальные символы для MarkdownV2
        const escapedMessage = escapeMarkdownV2(message);

        // Отправляем сообщение администратору
        const adminChatId = 327844310; // Telegram ID администратора
        await bot.sendMessage(adminChatId, escapedMessage, {
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: true,
        });

        console.log(`Характеристика упражнения ${exercise.name} от пользователя ${userId} успешно отправлена админу.`);
        res.json({ message: 'Характеристика упражнения успешно отправлена администратору.' });
    } catch (error: any) {
        console.error('Ошибка при отправке характеристики упражнения админу:', error.message);
        res.status(500).json({ message: 'Ошибка при отправке характеристики упражнения админу' });
    }
});

export default router;
