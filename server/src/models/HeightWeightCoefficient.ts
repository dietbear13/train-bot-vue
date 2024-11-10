// models/HeightWeightCoefficient.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IHeightWeightCoefficient extends Document {
    gender: string;
    bodyType: string;
    weightRange: string; // Например, "60-69"
    heightRange: string; // Например, "166-173"
    coefficient: number;
}

const HeightWeightCoefficientSchema: Schema = new Schema({
    gender: { type: String, required: true },
    bodyType: { type: String, required: true },
    weightRange: { type: String, required: true },
    heightRange: { type: String, required: true },
    coefficient: { type: Number, required: true },
});

export const HeightWeightCoefficient = mongoose.model<IHeightWeightCoefficient>(
    'HeightWeightCoefficient',
    HeightWeightCoefficientSchema
);
