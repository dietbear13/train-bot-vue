// models/ScheduledSurvey.ts
import { Schema, model, Types } from 'mongoose';

interface IInlineButton {
    text: string;          // Надпись на кнопке
    callbackData: string;  // То, что вернётся при нажатии
}

interface ISurveyMessage {
    _id?: Types.ObjectId;
    order: number;         // Порядок в цепочке
    text: string;          // Текст сообщения
    inlineButtons: IInlineButton[]; // Набор кнопок (может быть пустым)
    waitForResponse: boolean;       // Нужно ли ждать ответа, прежде чем отправить следующее
}

export interface ISurveyAnswer {
    messageId: Types.ObjectId;    // Идентификатор сообщения, на которое ответили
    telegramUserId: number;       // Telegram ID пользователя, давшего ответ
    userChoice: string;           // Выбранное значение (callbackData)
    answeredAt: Date;             // Дата и время ответа
}

export interface IScheduledSurvey {
    userId: Types.ObjectId;    // ID пользователя в вашей БД
    telegramId: number;        // Telegram ID, чтобы бот мог отправить
    triggerCondition: string;  // Например, 'afterWorkoutCreation'
    scheduledAt: Date;         // Когда отправлять (абсолютное время)
    messages: ISurveyMessage[]; // Список сообщений (последовательность)
    currentIndex: number;       // Какое сообщение уже отправлено. -1 значит ещё не отправлено.
    completed: boolean;         // Завершена цепочка или нет
    answers?: ISurveyAnswer[];  // Массив ответов пользователей
}

const inlineButtonSchema = new Schema<IInlineButton>({
    text: String,
    callbackData: String,
}, { _id: false });

const surveyMessageSchema = new Schema<ISurveyMessage>({
    order: Number,
    text: String,
    inlineButtons: [inlineButtonSchema],
    waitForResponse: Boolean,
}, { _id: true });

// Схема ответа
const surveyAnswerSchema = new Schema<ISurveyAnswer>({
    messageId: { type: Schema.Types.ObjectId, required: true },
    telegramUserId: { type: Number, required: true },
    userChoice: { type: String, required: true },
    answeredAt: { type: Date, required: true },
}, { _id: false });

const scheduledSurveySchema = new Schema<IScheduledSurvey>({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    telegramId: Number,
    triggerCondition: String,
    scheduledAt: Date,
    messages: [surveyMessageSchema],
    currentIndex: { type: Number, default: -1 },
    completed: { type: Boolean, default: false },
    answers: [surveyAnswerSchema],
});

export default model<IScheduledSurvey>('ScheduledSurvey', scheduledSurveySchema);
