// src/routes/bot/sendDetailedPlan.ts

import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb'; // Импортируем ObjectId
import { bot } from '../../config/bot';
import { formatWeeklyWorkoutMessageHTML, escapeHTML } from '../../utils/helpers';

const appUrl = process.env.APP_URL;

const router = Router();

/**
 * Интерфейс для упражнения.
 */
interface Exercise {
    _id: ObjectId; // Используем ObjectId для идентификатора из MongoDB
    name: string;
    sets: number;
    reps: number;
    dataUsed?: Record<string, any>;
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
 * Маршрут для отправки детального плана (с splitName, splitComment, plan[])
 */
router.post('/send-detailed-plan', async (req: Request, res: Response) => {
    const { userId, plan, splitName, splitComment } = req.body;
    console.log('🚨 plan', plan)

    if (!userId || !plan || !Array.isArray(plan)) {
        return res.status(400).json({ message: 'Нужно передать userId, plan (array of days), splitName и splitComment.' });
    }

    if (!splitName || typeof splitName !== 'string') {
        return res.status(400).json({ message: 'Нужно передать splitName (строка).' });
    }

    const validSplitComment = splitComment && typeof splitComment === 'string' ? splitComment : '';

    try {
        const messageHTML = formatWeeklyWorkoutMessageHTML(plan, splitName, splitComment);

        function capitalizeFirstLetter(str: string) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        }



        // Формируем сообщение с привязкой к каждому упражнению
        let detailedMessage = '';
        plan.forEach(day => {
            if (day.exercises && day.exercises.length > 0) {
                detailedMessage += `<u>${escapeHTML(day.dayName)}</u>\n`;
                day.exercises.forEach((exercise: Exercise, index: number) => {
                    // Преобразуем ObjectId в строку для формирования URL
                    const idStr = exercise._id.toString();
                    console.log('exercise id:', idStr);

                    const externalUrl = `${appUrl}/landingsOutside/exerciseInChat?id=${encodeURIComponent(exercise._id.toString())}`;
                    detailedMessage += `${index + 1}. <a href="${externalUrl}">${escapeHTML(capitalizeFirstLetter(exercise.name))}</a> — ${exercise.sets}×${exercise.reps} <a href="${externalUrl}">🔗</a>\n`;
                    console.log('exercise id:', exercise._id.toString());
                });
                detailedMessage += `\n`;
            }
        });

        // Добавляем ссылки на бота и канал в конце сообщения
        detailedMessage += `<a href="https://t.me/kochalkatg_bot">бот с тренировками</a>\n`;
        detailedMessage += `<a href="https://t.me/training_health">тг-канал «кОчалка»</a>\n`;


        // Отправляем сообщение пользователю
        await bot.sendMessage(userId, detailedMessage, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        });

        console.log(`Детальный план тренировок отправлен пользователю ${userId}`);
        res.json({ message: 'Детальный план отправлен в чат' });
    } catch (error: any) {
        console.error('Ошибка при отправке детального плана в Telegram:', error.message);
        res.status(500).json({ message: 'Ошибка при отправке детального плана в Telegram.', error: error.message });
    }
});

export default router;
