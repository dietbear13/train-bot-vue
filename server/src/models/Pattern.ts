// models/Pattern.ts
import mongoose, { Schema, Document } from 'mongoose';

interface PatternExercise {
    exerciseLevel: string;     // "многосуставное-сложное", "изолированное-база" и т.д.
    repetitionLevel: string;   // "легкая", "средняя", "тяжелая"
}

export interface IPattern extends Document {
    gender: string;            // "мужчина", "женщина" или "мужчина,женщина"
    muscleGroup: string;       // Грудь, Спина и т.д.
    subcategory: string;       // Верхняя грудная, ширина спины и т.д.
    mainMuscle: string;        // Верхняя грудная, широчайшая...
    complexNumber: string;     // "29", "30" ...
    exercises: PatternExercise[];
}

const PatternExerciseSchema: Schema = new Schema({
    exerciseLevel: { type: String, required: true },
    repetitionLevel: { type: String, required: true },
});

const PatternSchema: Schema = new Schema({
    gender: { type: String, required: true },           // "мужчина", "женщина" или "мужчина,женщина"
    muscleGroup: { type: String, required: true },      // "Грудь", "Спина" и т.д.
    subcategory: { type: String, required: true },      // "верхняя грудная", "ширина спины" и т.д.
    mainMuscle: { type: String, required: true },       // "верхняя грудная", "широчайшая" и т.д.
    complexNumber: { type: String, required: true },    // "29", "30" и т.д.
    exercises: { type: [PatternExerciseSchema], required: true },
});

export default mongoose.model<IPattern>('Pattern', PatternSchema);
