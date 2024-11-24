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
    workout: { name: string; sets: number; reps: number }[]
) => {
    let message = 'Тренировка на {подгруппа мышц}:\n\n';
    workout.forEach((exercise, index) => {
        message += `${index + 1}. ${exercise.name} — ${exercise.sets}×${exercise.reps}\n`;
    });

    bot
        .sendMessage(chatId, message)
        .then(() => {
            console.log(`Workout sent to user ${chatId}`);
        })
        .catch((error) => {
            console.error('Error sending message to user:', error.message);
        });
};

/**
 * Маршрут для отправки тренировки
 */
app.post('/api/send-workout', async (req: Request, res: Response) => {
    const { userId, workout } = req.body;

    if (!userId || !workout) {
        return res.status(400).json({ message: 'Необходимо указать userId и workout' });
    }

    try {
        sendWorkoutToUser(userId, workout);
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

    bot
        .sendMessage(chatId, message)
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
