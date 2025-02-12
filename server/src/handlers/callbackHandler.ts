import { bot } from '../config/bot';
import { saveSurveyAnswer, processNextMessage } from '../services/surveyService';
import User from '../models/User';

export const handleCallbackQuery = async (query: any) => {
    try {
        if (!query.data) return;

        const parts = query.data.split('|');
        if (parts.length < 4) {
            console.error('Неверный формат callback_data:', query.data);
            return bot.answerCallbackQuery(query.id, {
                text: 'Неверный формат запроса.',
                show_alert: true,
            });
        }

        const [type, surveyId, messageId, userChoice] = parts;

        if (type === 'SURVEY') {
            if (userChoice.startsWith('q_')) {
                const user = await User.findOne({ telegramId: query.from.id });
                if (user) {
                    user.surveyCallbacks = user.surveyCallbacks || [];
                    user.surveyCallbacks.push({ surveyId, messageId, callbackAt: userChoice, answeredAt: new Date() });
                    await user.save();
                }
                await bot.deleteMessage(query.message.chat.id, query.message.message_id);
                return bot.answerCallbackQuery(query.id, { text: 'Ваш ответ принят!', show_alert: false });
            } else {
                await saveSurveyAnswer(surveyId, messageId, query.from.id, userChoice);
                await bot.deleteMessage(query.message.chat.id, query.message.message_id);
                await bot.answerCallbackQuery(query.id, { text: 'Ответ принят!', show_alert: false });
                await processNextMessage(surveyId, messageId, query.from.id);
            }
        }
    } catch (error) {
        console.error('Ошибка в обработчике callback_query:', error);
        await bot.answerCallbackQuery(query.id, { text: 'Произошла ошибка. Попробуйте позже.', show_alert: true });
    }
};
