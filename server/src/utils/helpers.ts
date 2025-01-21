// src/utils/helpers.ts

import { GeneratedDay } from '../routes/bot/types';

/**
 * Функция для экранирования специальных символов HTML.
 */
export const escapeHTML = (text: string): string => {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

/**
 * Функция для экранирования специальных символов MarkdownV2, но не URL в ссылках.
 */
export const escapeMarkdownV2 = (text: string): string => {
    const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
    const escapeRegex = new RegExp(`([${specialChars.map(char => '\\' + char).join('')}])`, 'g');
    return text.replace(escapeRegex, '\\$1');
};

/**
 * Функция для форматирования недельного тренировочного плана в HTML-сообщение.
 * Исключает дни отдыха (где exercises пусты).
 */
export const formatWeeklyWorkoutMessageHTML = (
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
                message += `${index + 1}. ${escapeHTML(exercise.name)} — ${exercise.sets}×${exercise.reps} 🔗\n`;
            });
            message += `\n`;
        }
    });

    message += `<a href="https://t.me/kochalkatg_bot">бот с тренировками</a>\n`;
    message += `<a href="https://t.me/training_health">тг-канал «кОчалка»</a>\n`;

    return message;
};
