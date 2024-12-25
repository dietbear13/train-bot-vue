import mongoose, { Schema, Document } from 'mongoose'

interface PatternExercise {
    // Смысл: "exercises" (изолированное-добив / многосуставное-сложное / ...)
    // пойдут сюда как "exerciseLevel"
    exerciseLevel: string

    // Раньше называлось repetitionLevel, теперь оно — случайная
    // сложность: "легкая" / "средняя" / "тяжелая"
    repetitionLevel: string
}

export interface IPattern extends Document {
    gender: string            // "мужчина", "женщина" или "мужчина,женщина"
    muscleGroup: string       // Грудь, Спина и т.д.
    subcategory: string       // Верхняя грудная, ширина спины и т.д.
    mainMuscle: string        // Верхняя грудная, широчайшая...
    complexNumber: string     // "29", "30" ...
    exercises: PatternExercise[]
}

const PatternExerciseSchema: Schema = new Schema({
    exerciseLevel: { type: String, required: true },
    repetitionLevel: { type: String, required: true },
})

const PatternSchema: Schema = new Schema({
    gender:        { type: String, required: true },   // может быть "мужчина", "женщина", "мужчина,женщина"
    muscleGroup:   { type: String, required: true },
    subcategory:   { type: String, required: true },
    mainMuscle:    { type: String, required: true },
    complexNumber: { type: String, required: true },
    exercises:     { type: [PatternExerciseSchema], required: true },
})

export default mongoose.model<IPattern>('Pattern', PatternSchema)
