// models/DietsList.ts
import mongoose, { Schema, Document } from 'mongoose';

/** Интерфейс для одного пункта питания */
interface INutritionExample {
    title: string;
    content: string;
    shortDescription?: string;
}

/** Интерфейс для раздела питания (DietsList) */
export interface IDietsList extends Document {
    title: string;
    items: INutritionExample[];
}

/** Схема для коллекции DietsList без поля description */
const DietsListSchema = new Schema<IDietsList>(
    {
        title: { type: String, required: true },
        items: [
            {
                title: { type: String, required: true },
                content: { type: String, required: true },
                shortDescription: { type: String },
            },
        ],
    },
    {
        timestamps: true, // если нужно хранить createdAt/updatedAt
    }
);

const DietsListModel = mongoose.model<IDietsList>('DietsList', DietsListSchema);
export default DietsListModel;
