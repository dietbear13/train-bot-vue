import mongoose, { Schema, Document, model } from 'mongoose';

/**
 * Дочерняя часть — день в сплите
 */
export interface IDay {
    numberDay: number;
    patternOrExercise: string[];
}

/**
 * Родительский интерфейс данных
 */
export interface ISplit {
    split: string;       // тип сплита (фулбади и т.п.)
    splitId: number;     // уникальный числовой внутренний id
    gender: string;      // пол ("мужской", "женский" или "мужчина,женщина")
    splitDays: string;   // например "2(пн,ср,пт)"
    days: IDay[];        // массив дней, внутри — упражнения/паттерны
}

/**
 * Интерфейс документа для Mongoose.
 * Объединяет данные ISplit и служебные поля Document.
 */
export interface ISplitDocument extends ISplit, Document {}

/**
 * Схема для дочерней сущности — Day
 */
const daySchema = new Schema<IDay>(
    {
        numberDay: { type: Number, required: true },
        patternOrExercise: [{ type: String, required: true }],
    },
    {
        _id: false,
        // Можно отключить _id у дней, если не нужно
        // иначе будет генерироваться _id для каждого "day"
    }
);

/**
 * Схема для родительского документа — Split
 * ВАЖНО: обязательно типизируем как <ISplitDocument>,
 * а не <ISplit>.
 */
const splitSchema = new Schema<ISplitDocument>({
    split: { type: String, required: true },
    splitId: { type: Number, required: true },
    gender: { type: String, required: true },
    splitDays: { type: String, required: true },
    days: {
        type: [daySchema],
        default: [],
    },
});

/**
 * Модель
 * Тут тоже <ISplitDocument>
 */
const SplitModel = model<ISplitDocument>('Splits', splitSchema);

export default SplitModel;
