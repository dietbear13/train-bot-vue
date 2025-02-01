import mongoose, { Schema, Document } from 'mongoose';

/** Описываем структуру NutritionExample */
interface INutritionExample {
    title: string;
    content: string;
    shortDescription?: string;
}

/** Описываем структуру NutritionSection.
 *  Важно: если у вас каждый документ в базе – это именно "секция" (раздел),
 *  то модель может содержать поля title, description и items.
 *  При необходимости вы можете расширить схему и хранить все секции в одном документе
 *  или в нескольких — всё зависит от логики приложения.
 */
export interface IDietsList extends Document {
    title: string;
    description?: string;
    items: INutritionExample[];
}

/** Схема для коллекции DietsList */
const DietsListSchema = new Schema<IDietsList>(
    {
        title: { type: String, required: true },
        description: { type: String },
        items: [
            {
                title: { type: String, required: true },
                content: { type: String, required: true },
                shortDescription: { type: String },
            },
        ],
    },
    {
        timestamps: true, // по желанию, если хотите хранить createdAt/updatedAt
    }
);

const DietsListModel = mongoose.model<IDietsList>('DietsList', DietsListSchema);
export default DietsListModel;
