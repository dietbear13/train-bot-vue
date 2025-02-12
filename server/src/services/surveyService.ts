import mongoose from 'mongoose';
import ScheduledSurvey from '../models/ScheduledSurvey';
import { bot } from '../config/bot';

/**
 * Сохраняет ответ пользователя на опрос
 */
export const saveSurveyAnswer = async (
    surveyId: string,
    messageId: string,
    telegramUserId: number,
    userChoice: string
) => {
    try {
        const survey = await ScheduledSurvey.findById(surveyId);
        if (!survey) {
            console.error('Рассылка не найдена:', surveyId);
            return;
        }
        survey.answers = survey.answers || [];
        survey.answers.push({
            messageId: new mongoose.Types.ObjectId(messageId),
            telegramUserId,
            userChoice,
            answeredAt: new Date(),
        });
        await survey.save();
    } catch (err) {
        console.error('Ошибка при сохранении ответа рассылки:', err);
    }
};

/**
 * Отправляет следующее сообщение пользователю в рамках рассылки
 */
export const processNextMessage = async (surveyId: string, currentMessageId: string, telegramUserId: number) => {
    try {
        const survey = await ScheduledSurvey.findById(surveyId);
        if (!survey) return;

        let currentIndex = survey.currentIndex ?? -1;
        const idx = survey.messages.findIndex((msg: any) => msg._id.toString() === currentMessageId);
        if (idx === -1) return;

        if (survey.messages[idx].waitForResponse) {
            survey.currentIndex = idx + 1;
            await survey.save();

            if (survey.currentIndex < survey.messages.length) {
                const nextMessage = survey.messages[survey.currentIndex];
                const keyboard = {
                    inline_keyboard: nextMessage.inlineButtons.map((btn: any) => [
                        { text: btn.text, callback_data: `SURVEY|${surveyId}|${nextMessage._id}|${btn.callbackData}` },
                    ]),
                };
                await bot.sendMessage(telegramUserId, nextMessage.text, { reply_markup: keyboard });
            } else {
                survey.completed = true;
                await survey.save();
            }
        }
    } catch (err) {
        console.error('Ошибка в processNextMessage:', err);
    }
};
