// models/MacrosCoefficient.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IMacrosCoefficient extends Document {
    gender: string;
    bodyType: string;
    proteinCoefficient: number;
    fatCoefficient: number;
    activityCoefficient: number;
}

const MacrosCoefficientSchema: Schema = new Schema({
    gender: { type: String, required: true },
    bodyType: { type: String, required: true },
    proteinCoefficient: { type: Number, required: true },
    fatCoefficient: { type: Number, required: true },
    activityCoefficient: { type: Number, required: true },
});

export const MacrosCoefficient = mongoose.model<IMacrosCoefficient>(
    'MacrosCoefficient',
    MacrosCoefficientSchema
);
