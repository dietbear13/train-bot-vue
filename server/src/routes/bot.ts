// routes/bot.ts

import { Router, Request, Response } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import User from '../models/User';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

const botToken = process.env.TELEGRAM_BOT_TOKEN as string;

// ВАЖНО: Экспортируем экземпляр бота,
// чтобы использовать его в других модулях (например, routes/users.ts)
export const bot = new TelegramBot(botToken, { polling: false });

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
    patternOrExercise?: string[];
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
 * Исключает дни отдыха (где exercises пусты).
 */
const formatWeeklyWorkoutMessageHTML = (
    plan: GeneratedDay[],
    splitName: string,
    splitComment?: string
): string => {
    let message = `<b>${escapeHTML(splitName)}</b>\n`;

    if (splitComment && splitComment.trim() !== '') {
        message += `<i>${escapeHTML(splitComment)}</i>\n\n`;
    } else {
        message += `\n`;
    }

    plan.forEach(day => {
        if (day.exercises && day.exercises.length > 0) {
            message += `<u>${escapeHTML(day.dayName)}</u>\n`;
            day.exercises.forEach((exercise, index) => {
                message += `${index + 1}. ${escapeHTML(exercise.name)} — ${exercise.sets}×${exercise.reps}\n`;
            });
            message += `\n`;
        }
    });

    message += `<a href="https://t.me/freeload_top_bot">бот с тренировками</a>\n`;
    message += `<a href="https://t.me/training_health">тг-канал «кОчалка»</a>\n`;

    return message;
};

/**
 * Функция для экранирования специальных символов MarkdownV2, но не URL в ссылках.
 */
const escapeMarkdownV2 = (text: string): string => {
    const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
    const escapeRegex = new RegExp(`([${specialChars.map(char => '\\' + char).join('')}])`, 'g');
    return text.replace(escapeRegex, '\\$1');
};

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
    const cron = require('node-cron');
    const moment = require('moment-timezone');
    const scheduledDate = moment(time);

    if (!scheduledDate.isValid()) {
        throw new Error('Некорректное время публикации');
    }

    // Пример: "0 10 23 3 *" => 23 марта 10:00
    const cronTime = `${scheduledDate.minute()} ${scheduledDate.hour()} ${scheduledDate.date()} ${scheduledDate.month() + 1} *`;
    cron.schedule(cronTime, () => {
        sendPost(channelId, content, imageUrl).catch((err) => console.error(err));
    });

    console.log(`Пост запланирован на ${scheduledDate.format('YYYY-MM-DD HH:mm')}`);
};

/**
 * Маршрут: проверка доступа бота к каналу
 */
router.post('/check-bot-access', async (req: Request, res: Response) => {
    const { channelId } = req.body;
    if (!channelId) {
        return res.status(400).json({ message: 'Необходимо указать channelId' });
    }

    try {
        const botInfo = await bot.getMe();
        const chatMember = await bot.getChatMember(channelId, botInfo.id);
        const hasAccess = ['administrator', 'creator'].includes(chatMember.status);

        res.json({ hasAccess });
    } catch (error: any) {
        console.error('Ошибка при проверке доступа бота к каналу:', error.message);
        res.status(500).json({ message: 'Ошибка при проверке доступа бота к каналу', error: error.message });
    }
});

/**
 * Маршрут: получение списка каналов, к которым бот имеет доступ
 */
router.get('/get-channels', async (req: Request, res: Response) => {
    try {
        // Пример: здесь вы можете вернуть список каналов из БД или констант
        const channels = [
            { id: '@training_health', title: 'Тренировки & Здоровье' },
            // ...
        ];
        res.json({ channels });
    } catch (error: any) {
        console.error('Ошибка при получении списка каналов:', error.message);
        res.status(500).json({ message: 'Ошибка при получении списка каналов', error: error.message });
    }
});

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

/**
 * Функция для отправки плана тренировок пользователю
 */
const sendWorkoutToUser = (
    chatId: number,
    splitName: string,
    splitComment: string | undefined,
    plan: GeneratedDay[]
) => {
    const message = formatWeeklyWorkoutMessageHTML(plan, splitName, splitComment);
    console.log('Сообщение для отправки:', message);

    bot.sendMessage(chatId, message, {
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
 * Маршрут: отправка плана тренировок
 */
router.post('/send-workout', async (req: Request, res: Response) => {
    const { userId, splitName, splitComment, plan } = req.body;
    if (!userId || !splitName || !plan || !Array.isArray(plan)) {
        return res.status(400).json({ message: 'Необходимо указать userId, splitName и plan[]' });
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

    const escapedMessage = escapeMarkdownV2(message);

    bot.sendMessage(chatId, escapedMessage, {
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
 * Маршрут: отправка результатов КБЖУ
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
 * Маршрут (только для админов) для логирования характеристик упражнений.
 */
router.post('/admin/log-exercises', async (req: Request, res: Response) => {
    const { userId, exercise } = req.body;
    if (!userId || !exercise) {
        return res.status(400).json({ message: 'Необходимо указать userId и exercise' });
    }

    try {
        const user = await User.findOne({ telegramId: userId });
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        let message = `🔧 Лог упражнения\n\n`;
        message += `Упражнение: ${escapeMarkdownV2(exercise.name)}\n`;

        if (exercise.dataUsed && Object.keys(exercise.dataUsed).length > 0) {
            message += `*Доп. данные:* ${escapeMarkdownV2(JSON.stringify(exercise.dataUsed))}\n`;
        }

        // ID вашего администратора
        const adminChatId = 327844310;
        await bot.sendMessage(adminChatId, message, {
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: true,
        });

        console.log(`Упражнение "${exercise.name}" от пользователя ${userId} отправлено админу.`);
        res.json({ message: 'Характеристика упражнения успешно отправлена администратору.' });
    } catch (error: any) {
        console.error('Ошибка при отправке характеристики упражнения админу:', error.message);
        res.status(500).json({ message: 'Ошибка при отправке характеристики упражнения админу.' });
    }
});

/**
 * Маршрут для отправки детального плана (c splitName, splitComment, plan[])
 */
router.post('/send-detailed-plan', async (req: Request, res: Response) => {
    const { userId, plan, splitName, splitComment } = req.body;

    if (!userId || !plan || !Array.isArray(plan)) {
        return res.status(400).json({ message: 'Нужно передать userId, plan (array of days), splitName и splitComment.' });
    }

    if (!splitName || typeof splitName !== 'string') {
        return res.status(400).json({ message: 'Нужно передать splitName (строка).' });
    }

    const validSplitComment = splitComment && typeof splitComment === 'string' ? splitComment : '';

    try {
        const formattedMessage = formatWeeklyWorkoutMessageHTML(plan, splitName, validSplitComment);
        await bot.sendMessage(userId, formattedMessage, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        });

        console.log(`План отправлен пользователю: ${userId}`);
        res.json({ message: 'План отправлен в Telegram.' });
    } catch (error: any) {
        console.error('Ошибка при отправке плана в Telegram:', error.message);
        res.status(500).json({ message: 'Ошибка при отправке плана в Telegram.', error: error.message });
    }
});

export default router;
