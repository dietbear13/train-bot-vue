// src/routes/bot/sendWorkout.ts

import { Router, Request, Response } from 'express';
import { bot } from './botInstance';
import User from '../../models/User';
import { formatWeeklyWorkoutMessageHTML, escapeHTML } from '../../utils/helpers';

const router = Router();

const appUrl = process.env.APP_URL

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
        .catch((error: any) => {
            console.error('Error sending message to user:', error.response?.body || error.message);
        });
};

/**
 * Функция для отправки тренировки пользователю
 */
const sendWorkoutsToUser = (
    chatId: number,
    muscleGroup: string,
    date: string,
    workout: { name: string; sets: number; reps: number }[]
) => {
    let message = `${muscleGroup}, тренировка (${date})\n\n`;
    message += '[Генератор тренировок](https://t.me/kochalkatg_bot)\n';
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
            console.error('Error sending message to userAndAdmin:', error.response?.body || error.message);
        });
};

/**
 * Маршрут для отправки тренировки
 */
router.post('/send-workout', async (req: Request, res: Response) => {
    const { userId, muscleGroup, date, workout } = req.body;

    if (!userId || !muscleGroup || !date || !workout || !Array.isArray(workout)) {
        return res.status(400).json({ message: 'Необходимо указать userId, muscleGroup, date и workout (массив упражнений).' });
    }

    try {
        function capitalizeFirstLetter(str: string) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        // Формируем сообщение с тренировкой
        let workoutMessage = `<b>Тренировка: ${escapeHTML(muscleGroup)}</b>\nДата: ${escapeHTML(date)}\n\n`;

        workout.forEach((exercise: Exercise, index: number) => {
            const externalUrl = `${appUrl}/landingsOutside/exerciseInChat?name=${encodeURIComponent(exercise.name)}`;
            workoutMessage += `${index + 1}. ${escapeHTML(capitalizeFirstLetter(exercise.name))} — ${exercise.sets}×${exercise.reps} <a href="${externalUrl}">🔗</a>\n`;
        });

        // Отправляем сообщение пользователю
        await bot.sendMessage(userId, workoutMessage, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        });

        console.log(`Тренировка отправлена пользователю ${userId}`);
        res.json({ message: 'Тренировка отправлена в Telegram' });
    } catch (error: any) {
        console.error('Ошибка при отправке сообщения в Telegram:', error.message);
        res.status(500).json({ message: 'Ошибка при отправке сообщения в Telegram.' });
    }
});

export default router;
