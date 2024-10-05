// models/Exercise.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IExercise extends Document {
    category: string
    subcategory: string
    mainMuscles: string
    additionalMuscles: string
    difficultyLevel: string
    name: string
    equipment: string
    maleRepsLight: string
    maleRepsMedium: string
    maleRepsHeavy: string
    femaleRepsLight: string
    femaleRepsMedium: string
    femaleRepsHeavy: string
}

const ExerciseSchema: Schema = new Schema({
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    mainMuscles: { type: String, required: true },
    additionalMuscles: { type: String },
    difficultyLevel: { type: String, required: true },
    name: { type: String, required: true },
    equipment: { type: String, required: true },
    maleRepsLight: { type: String },
    maleRepsMedium: { type: String },
    maleRepsHeavy: { type: String },
    femaleRepsLight: { type: String },
    femaleRepsMedium: { type: String },
    femaleRepsHeavy: { type: String },
})

export default mongoose.model<IExercise>('Exercise', ExerciseSchema)
