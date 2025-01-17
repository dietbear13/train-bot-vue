// src/models/Anthropometry.ts

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User'; // Импортируем интерфейс IUser для связи

export interface IAnthropometry extends Document {
    user: mongoose.Types.ObjectId | IUser; // Ссылка на пользователя
    formData: {
        gender: string;
        bodyType: string;
        age: number | null;
        height: number | null;
        weight: number | null;
        goal: string;
        workoutsPerWeek: number;
    };
    kbzhuResult: {
        calories: number;
        extraCalories: number;
        proteins: number;
        fats: number;
        carbs: number;
        timestamp: number;
    };
    timestamp: number; // Время создания записи
}

const AnthropometrySchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    formData: {
        gender: { type: String, required: true },
        bodyType: { type: String, required: true },
        age: { type: Number, required: true },
        height: { type: Number, required: true },
        weight: { type: Number, required: true },
        goal: { type: String, required: true },
        workoutsPerWeek: { type: Number, required: true },
    },
    kbzhuResult: {
        calories: { type: Number, required: true },
        extraCalories: { type: Number, required: true },
        proteins: { type: Number, required: true },
        fats: { type: Number, required: true },
        carbs: { type: Number, required: true },
        timestamp: { type: Number, required: true },
    },
    timestamp: { type: Number, default: Date.now },
});

export default mongoose.model<IAnthropometry>('Anthropometry', AnthropometrySchema);
