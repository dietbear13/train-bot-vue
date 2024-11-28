// server.ts

import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

// Импортируем модели
import Exercise from '../src/models/Exercise';
import Pattern from '../src/models/Pattern';
import { MacrosCoefficient } from '../src/models/MacrosCoefficient';
import { GoalCoefficient } from '../src/models/GoalCoefficient';
import { HeightWeightCoefficient } from '../src/models/HeightWeightCoefficient';
import User, { IUser } from '../src/models/User';

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN не задан в файле .env');
}

const bot = new TelegramBot(botToken, { polling: false });

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// Подключение к MongoDB
mongoose
    .connect('mongodb://localhost:27017/fitness-app', {} as mongoose.ConnectOptions)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error: any) => {
        console.error('Error connecting to MongoDB:', error);
    });

/**
 * Маршрут для проверки доступа бота к каналу
 */
app.post('/api/check-bot-access', async (req: Request, res: Response) => {
    const { channelId } = req.body;

    if (!channelId) {
        return res.status(400).json({ message: 'Необходимо указать channelId' });
    }

    try {
        // Получаем информацию о боте
        const botInfo = await bot.getMe();

        // Проверяем, является ли бот администратором в указанном канале
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
app.get('/api/get-channels', async (req: Request, res: Response) => {
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
app.post('/api/publish-post', async (req: Request, res: Response) => {
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
 * Функция для экранирования специальных символов MarkdownV2,
 * но не URL в ссылках.
 */
const escapeMarkdownV2 = (text: string): string => {
    // Регулярное выражение для поиска ссылок [текст](url)
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;

    // Функция для экранирования специальных символов, не используемых для форматирования
    const escapeNonFormatting = (str: string) => {
        return str.replace(/([#>+=|{}.!])/g, '\\$1').replace(/\|\|/g, '\\|\\|');
    };

    // Экранирование текста внутри ссылок, не экранируя URL
    const escapedText = text.replace(regex, (match, p1, p2) => {
        const escapedP1 = escapeNonFormatting(p1);
        return `[${escapedP1}](${p2})`;
    });

    // Экранирование оставшихся специальных символов вне ссылок
    return escapedText.replace(/([#>+=|{}.!])/g, '\\$1').replace(/\|\|/g, '\\|\\|');
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
                caption: escapedContent, // Экранированный контент
                parse_mode: 'MarkdownV2', // Используем MarkdownV2
            });
            console.log(`Фото с подписью отправлено в канал ${channelId}`);
        } else {
            // Отправляем текстовое сообщение с отключённым предпросмотром ссылок
            await bot.sendMessage(channelId, escapedContent, {
                parse_mode: 'MarkdownV2', // Используем MarkdownV2
                disable_web_page_preview: true, // Отключаем предпросмотр ссылок
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

    // Создаём строку cron-формата
    const cronTime = `${scheduledDate.minute()} ${scheduledDate.hour()} ${scheduledDate.date()} ${scheduledDate.month() + 1} *`;

    cron.schedule(cronTime, () => {
        sendPost(channelId, content, imageUrl);
    });

    console.log(`Пост запланирован на ${scheduledDate.format('YYYY-MM-DD HH:mm')}`);
};



/**
 * Маршрут для получения информации о пользователе из Telegram API
 */
app.post('/api/get-user-info', async (req: Request, res: Response) => {
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
app.post('/api/check-subscription', async (req: Request, res: Response) => {
    const { telegramId } = req.body;

    if (!telegramId) {
        return res.status(400).json({ message: 'Необходимо указать telegramId' });
    }

    try {
        // Идентификатор вашего канала (может быть в формате '@channelusername' или ID канала)
        const channelId = '@training_health';

        // Проверяем статус пользователя в канале
        const chatMember = await bot.getChatMember(channelId, telegramId);

        const isSubscribed = ['member', 'administrator', 'creator'].includes(chatMember.status);

        // Получаем пользователя из базы данных
        const user = await User.findOne({ telegramId });

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // Если пользователь является администратором, не изменяем его роль
        if (user.role === 'admin') {
            return res.json({ isSubscribed: true, message: 'Пользователь является администратором, роль не изменена.' });
        }

        if (isSubscribed) {
            // Обновляем роль пользователя на 'paidUser'
            user.role = 'paidUser';
            await user.save();
            res.json({ isSubscribed: true, message: 'Подписка подтверждена, роль пользователя обновлена.' });
        } else {
            res.json({ isSubscribed: false, message: 'Пользователь не подписан на канал.' });
        }
    } catch (error: any) {
        console.error('Ошибка при проверке подписки:', error.message);
        res.status(500).json({ message: 'Ошибка при проверке подписки' });
    }
});

/**
 * Маршрут для получения списка всех пользователей (только для администраторов)
 */
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, '-__v -password') // Исключаем ненужные поля
        res.json({ users })
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error)
        res.status(500).json({ message: 'Ошибка при получении пользователей' })
    }
})


/**
 * Маршрут для проверки и добавления пользователя
 */
app.post('/api/check-user', async (req: Request, res: Response) => {
    const { telegramId } = req.body;

    if (!telegramId) {
        return res.status(400).json({ message: 'Необходимо указать telegramId' });
    }

    try {
        let user = await User.findOne({ telegramId });

        if (!user) {
            // Проверяем, является ли пользователь администратором
            const isAdmin = telegramId === 327844310;

            user = new User({
                telegramId,
                role: isAdmin ? 'admin' : 'freeUser',
                dateAdded: Math.floor(Date.now() / 1000), // UNIX timestamp
            });

            await user.save();
            console.log(`Добавлен новый пользователь: ${telegramId}`);
        } else {
            console.log(`Пользователь найден: ${telegramId}`);
        }

        res.json({ role: user.role });
    } catch (error: any) {
        console.error('Ошибка при работе с пользователем:', error.message);
        res.status(500).json({ message: 'Ошибка при работе с пользователем' });
    }
});

/**
 * Маршрут для обновления роли пользователя
 */
app.post('/api/update-user-role', async (req: Request, res: Response) => {
    const { telegramId, role, datePaid, datePaidUntil } = req.body;

    if (!telegramId || !role) {
        return res.status(400).json({ message: 'Необходимо указать telegramId и роль' });
    }

    try {
        const user = await User.findOne({ telegramId });

        if (user) {
            user.role = role;
            if (datePaid) user.datePaid = datePaid;
            if (datePaidUntil) user.datePaidUntil = datePaidUntil;

            await user.save();
            res.json({ message: 'Роль пользователя обновлена' });
        } else {
            res.status(404).json({ message: 'Пользователь не найден' });
        }
    } catch (error: any) {
        console.error('Ошибка при обновлении пользователя:', error.message);
        res.status(500).json({ message: 'Ошибка при обновлении пользователя' });
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
    // Формируем сообщение в простом текстовом формате
    let message = `${muscleGroup}, тренировка (${date})\n\n`;
    message += '[Генератор тренировок](https://t.me/freeload_top_bot)\n'; // Заменить на проде
    message += '[Канал о тренировках и здоровье](https://t.me/training_health)\n\n'; // Заменить на проде
    workout.forEach((exercise, index) => {
        message += `${index + 1}. ${exercise.name} — ${exercise.sets}×${exercise.reps}\n`;
    });

    // Логирование сообщения для отладки
    console.log('Сообщение для отправки:', message);

    // Отправляем сообщение без параметра parse_mode
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
app.post('/api/send-workout', async (req: Request, res: Response) => {
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
            parse_mode: 'MarkdownV2', // Используем MarkdownV2
            disable_web_page_preview: true,
        })
        .then(() => {
            console.log(`KbzhuResult sent to user ${chatId}`);
        })
        .catch((error) => {
            console.error('Error sending KbzhuResult to user:', error.message);
        });
};

/**
 * Маршрут для отправки результатов КБЖУ
 */
app.post('/api/send-kbzhu', async (req: Request, res: Response) => {
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
 * Маршрут для получения всех упражнений
 */
app.get('/api/exercises', async (req: Request, res: Response) => {
    try {
        const exercises = await Exercise.find();
        res.json(exercises);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Маршрут для получения всех паттернов
 */
app.get('/api/patterns', async (req: Request, res: Response) => {
    try {
        const patterns = await Pattern.find();
        res.json(patterns);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Маршрут для получения всех коэффициентов БЖУ
 */
app.get('/api/macros-coefficients', async (req: Request, res: Response) => {
    try {
        const macrosCoefficients = await MacrosCoefficient.find();
        res.json(macrosCoefficients);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Маршрут для получения всех коэффициентов целей питания
 */
app.get('/api/goal-coefficients', async (req: Request, res: Response) => {
    try {
        const goalCoefficients = await GoalCoefficient.find();
        res.json(goalCoefficients);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Маршрут для получения всех коэффициентов по росту и весу
 */
app.get('/api/height-weight-coefficients', async (req: Request, res: Response) => {
    try {
        const heightWeightCoefficients = await HeightWeightCoefficient.find();
        res.json(heightWeightCoefficients);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Тестовый маршрут
 */
app.get('/', (req: Request, res: Response) => {
    res.send('Привет, я сервер на TypeScript с Express!');
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
