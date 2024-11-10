// models/GoalCoefficient.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IGoalCoefficient extends Document {
    gender: string;
    bodyType: string;
    goal: string;
    goalCoefficient: number;
}

const GoalCoefficientSchema: Schema = new Schema({
    gender: { type: String, required: true },
    bodyType: { type: String, required: true },
    goal: { type: String, required: true },
    goalCoefficient: { type: Number, required: true },
});

export const GoalCoefficient = mongoose.model<IGoalCoefficient>(
    'GoalCoefficient',
    GoalCoefficientSchema
);
