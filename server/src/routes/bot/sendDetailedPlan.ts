// src/routes/bot/sendDetailedPlan.ts

import { Router, Request, Response } from 'express';
import { bot, appUrl } from './botInstance';
import { formatWeeklyWorkoutMessageHTML, escapeHTML } from '../../utils/helpers';

const router = Router();

/**
 * Интерфейс для упражнения.
 */
interface Exercise {
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
        const messageHTML = formatWeeklyWorkoutMessageHTML(plan, splitName, splitComment);

        function capitalizeFirstLetter(str: string) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        // Добавляем иконку-ссылку к каждому упражнению
        // Используем схему tg://open-web-app для открытия Mini App внутри Telegram
        let detailedMessage = '';
        plan.forEach(day => {
            if (day.exercises && day.exercises.length > 0) {
                detailedMessage += `<u>${escapeHTML(day.dayName)}</u>\n`;
                day.exercises.forEach((exercise: Exercise, index: number) => {
                    const externalUrl = `${appUrl}/landingsOutside/exerciseInChat?name=${encodeURIComponent(exercise.name)}`;
                    detailedMessage += `${index + 1}. ${escapeHTML(capitalizeFirstLetter(exercise.name))} — ${exercise.sets}×${exercise.reps} <a href="${externalUrl}">🔗</a>\n`;
                });
                detailedMessage += `\n`;
            }
        });

        // Добавляем ссылки на бота и канал в конце сообщения
        detailedMessage += `<a href="https://t.me/freeload_top_bot">бот с тренировками</a>\n`;
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
