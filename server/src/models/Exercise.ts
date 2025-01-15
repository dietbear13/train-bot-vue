// ~/server/models/Exercise.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IExercise extends Document {
    category: string;
    subcategory: string;
    mainMuscle: string;
    additionalMuscles?: string;
    typeExercise?: string;
    difficultyLevel: string;
    difficultyLevelOld?: string;
    name: string;
    equipment: string;
    isWarnGif?: boolean;
    technique?: string;
    gifImage?: string;
    maleRepsLight?: string;
    maleRepsMedium?: string;
    maleRepsHeavy?: string;
    femaleRepsLight?: string;
    femaleRepsMedium?: string;
    femaleRepsHeavy?: string;
    spineRestrictions?: boolean;
    kneeRestrictions?: boolean;
    shoulderRestrictions?: boolean;
}

const ExerciseSchema: Schema<IExercise> = new Schema({
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    mainMuscle: { type: String, required: true },
    additionalMuscles: { type: String },
    typeExercise: { type: String },
    difficultyLevel: { type: String, required: true },
    difficultyLevelOld: { type: String },
    name: { type: String, required: true },
    equipment: { type: String, required: true },
    isWarnGif: { type: Boolean },
    technique: { type: String },
    gifImage: { type: String }, // Добавлено поле в схему
    maleRepsLight: { type: String },
    maleRepsMedium: { type: String },
    maleRepsHeavy: { type: String },
    femaleRepsLight: { type: String },
    femaleRepsMedium: { type: String },
    femaleRepsHeavy: { type: String },
    spineRestrictions: { type: Boolean },
    kneeRestrictions: { type: Boolean },
    shoulderRestrictions: { type: Boolean },
});

export default mongoose.model<IExercise>('Exercise', ExerciseSchema);
