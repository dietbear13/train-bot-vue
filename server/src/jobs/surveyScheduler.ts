// src/jobs/surveyScheduler.ts
import nodeCron from 'node-cron';
import ScheduledSurvey from '../models/ScheduledSurvey';
import bot from '../bot'; // Ваш Telegram bot instance

// Проверка каждую минуту (пример)
nodeCron.schedule('* * * * *', async () => {
    const now = new Date();
    // Ищем рассылки, которые надо отправить
    const surveys = await ScheduledSurvey.find({
        completed: false,
        scheduledAt: { $lte: now },
    });

    for (const survey of surveys) {
        // Если ещё не отправляли (currentIndex = -1), отправим первое сообщение
        if (survey.currentIndex === -1) {
            await sendMessage(survey, 0);
        }
        // Иначе проверяем, вдруг нужно отправить следующее (зависит от вашей логики)
    }
});

async function sendMessage(survey: any, index: number) {
    if (index >= survey.messages.length) {
        // Все сообщения отправлены
        survey.completed = true;
        await survey.save();
        return;
    }
    const message = survey.messages[index];
    // Формируем кнопки
    const inline_keyboard = message.inlineButtons.map((b: any) => [
        {
            text: b.text,
            callback_data: `SURVEY|${survey._id}|${message._id}|${b.callbackData}`,
        }
    ]);
    // Отправляем
    await bot.sendMessage(survey.telegramId, message.text, {
        reply_markup: {
            inline_keyboard
        }
    });
    // Обновляем currentIndex
    survey.currentIndex = index;
    await survey.save();
}
