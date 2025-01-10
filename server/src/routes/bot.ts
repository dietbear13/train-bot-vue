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
 * Интерфейс для упражнения.
 */
interface Exercise {
    name: string;
    sets: number;
    reps: number;
}

/**
 * Интерфейс для дня недели с упражнениями.
 */
interface GeneratedDay {
    dayName: string;
    exercises: Exercise[];
    patternOrExercise?: string[]; // Опциональное поле, если используется
}

/**
 * Функция для экранирования специальных символов HTML.
 */
const escapeHTML = (text: string): string => {
    return text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

/**
 * Функция для форматирования недельного тренировочного плана в HTML-сообщение.
 * Теперь принимает splitName и splitComment.
 * **Исключает** из сообщения дни отдыха (где exercises пусты).
 */
const formatWeeklyWorkoutMessageHTML = (
    plan: GeneratedDay[],
    splitName: string,
    splitComment?: string
): string => {
    let message = `<b>${escapeHTML(splitName)}</b>\n`;

    // Добавляем splitComment, если он есть
    if (splitComment && splitComment.trim() !== '') {
        message += `<i>${escapeHTML(splitComment)}</i>\n\n`;
    } else {
        message += `\n`; // Добавляем пустую строку для разделения
    }

    plan.forEach(day => {
        if (day.exercises && day.exercises.length > 0) {
            message += `<u>${escapeHTML(day.dayName)}</u>\n`;
            day.exercises.forEach((exercise, index) => {
                message += `${index + 1}. ${escapeHTML(exercise.name)} — ${exercise.sets}×${exercise.reps}\n`;
            });
            message += `\n`;
        }
        // **Исключаем** дни отдыха, то есть не добавляем их в сообщение
    });

    // Добавляем ссылки
    message += `<a href="https://t.me/freeload_top_bot">бот с тренировками</a>\n`;
    message += `<a href="https://t.me/training_health">тг-канал «кОчалка»</a>\n`;

    return message;
};

/**
 * Функция для экранирования специальных символов MarkdownV2,
 * но не URL в ссылках.
 */
const escapeMarkdownV2 = (text: string): string => {
    // Список специальных символов для MarkdownV2
    const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
    const escapeRegex = new RegExp(`([${specialChars.map(char => '\\' + char).join('')}])`, 'g');

    // Заменяем каждый специальный символ на экранированный
    let escapedText = text.replace(escapeRegex, '\\$1');

    return escapedText;
};

/**
 * Функция для отправки поста в канал с MarkdownV2
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
 * Функция для отправки тренировки пользователю
 */
const sendWorkoutToUser = (
    chatId: number,
    splitName: string,
    splitComment: string | undefined,
    plan: GeneratedDay[]
) => {
    let message = formatWeeklyWorkoutMessageHTML(plan, splitName, splitComment);

    // Логирование для отладки
    console.log('Сообщение для отправки:', message);

    bot
        .sendMessage(chatId, message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        })
        .then(() => {
            console.log(`План тренировок отправлен пользователю ${chatId}`);
        })
        .catch((error) => {
            console.error('Error sending message to user:', error.response?.body || error.message);
        });
};

/**
 * Маршрут для отправки тренировки
 * Теперь принимает splitName и splitComment
 */
router.post('/send-workout', async (req: Request, res: Response) => {
    const { userId, splitName, splitComment, plan } = req.body;

    if (!userId || !splitName || !plan || !Array.isArray(plan)) {
        return res.status(400).json({ message: 'Необходимо указать userId, splitName и plan (array of days).' });
    }

    try {
        sendWorkoutToUser(userId, splitName, splitComment, plan);
        res.json({ message: 'Тренировка отправлена в Telegram' });
    } catch (error: any) {
        console.error('Ошибка при отправке сообщения в Telegram:', error.message);
        res.status(500).json({ message: 'Ошибка при отправке сообщения в Telegram', error: error.message });
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

    // Экранирование только динамических частей
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
        res.status(500).json({ message: 'Ошибка при отправке сообщения в Telegram', error: error.message });
    }
});

/**
 * Маршрут для логирования характеристик упражнений (только для администраторов)
 */
router.post('/admin/log-exercises', async (req: Request, res: Response) => {
    const { userId, exercise } = req.body;
    console.log("userId exercise", userId, exercise);

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
        let message = `🔧 Лог упражнения\n\n`;
        message += `Упражнение: ${escapeMarkdownV2(exercise.name)}\n`;

        // Если есть дополнительные данные
        if (exercise.dataUsed && Object.keys(exercise.dataUsed).length > 0) {
            message += `*Дополнительные данные:* ${escapeMarkdownV2(JSON.stringify(exercise.dataUsed))}\n`;
        }

        // Логирование сообщения для отладки
        console.log('Сообщение для отправки администратору:', message);

        // Отправляем сообщение администратору
        const adminChatId = 327844310; // Telegram ID администратора
        await bot.sendMessage(adminChatId, message, {
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

/**
 * Маршрут для отправки недельного (или любого другого) плана
 * с полями userId, plan[] (массив дней), splitName и splitComment.
 */
router.post('/send-detailed-plan', async (req: Request, res: Response) => {
    const { userId, plan, splitName, splitComment } = req.body;

    // Валидация входных данных
    if (!userId || !plan || !Array.isArray(plan)) {
        return res
            .status(400)
            .json({ message: 'Нужно передать userId, plan (array of days), splitName и splitComment.' });
    }

    // Валидация splitName
    if (!splitName || typeof splitName !== 'string') {
        return res.status(400).json({ message: 'Нужно передать splitName (строка).' });
    }

    // splitComment может быть опциональным
    const validSplitComment = splitComment && typeof splitComment === 'string' ? splitComment : '';

    try {
        // Форматируем план в HTML с использованием splitName и splitComment
        const formattedMessage = formatWeeklyWorkoutMessageHTML(plan, splitName, validSplitComment);

        // Логирование полученных данных
        console.log('Полученный план тренировок:', plan);
        console.log('Отформатированное сообщение для отправки:', formattedMessage);

        // Отправляем сообщение пользователю
        await bot.sendMessage(userId, formattedMessage, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        });

        console.log(`План успешно отправлен пользователю: ${userId}`);
        res.json({ message: 'План отправлен в Telegram.' });
    } catch (error: any) {
        console.error('Ошибка при отправке плана в Telegram:', error.message);
        res
            .status(500)
            .json({ message: 'Ошибка при отправке плана в Telegram.', error: error.message });
    }
});

export default router;
