// server/models/Pattern.ts
import mongoose, { Schema, Document } from 'mongoose'

interface PatternExercise {
    exerciseLevel: string
    repetitionLevel: string
}

export interface IPattern extends Document {
    gender: string
    muscleGroup: string
    mainMuscle: string
    complexNumber: string
    exercises: PatternExercise[]
}

const PatternExerciseSchema: Schema = new Schema({
    exerciseLevel: { type: String, required: true },
    repetitionLevel: { type: String, required: true },
})

const PatternSchema: Schema = new Schema({
    gender: { type: String, required: true },
    muscleGroup: { type: String, required: true },
    mainMuscle: { type: String, required: true },
    complexNumber: { type: String, required: true },
    exercises: { type: [PatternExerciseSchema], required: true },
})

export default mongoose.model<IPattern>('Pattern', PatternSchema)
