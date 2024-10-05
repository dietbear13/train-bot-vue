// server/routes/trainingRoutes.ts
import express from 'express'
import Exercise from '../models/Exercise'
import Pattern from '../models/Pattern'

const router = express.Router()

// Генерация тренировочной программы
router.post('/generate', async (req, res) => {
    const { gender, muscleGroup, mainMuscle, complexNumber } = req.body

    if (!gender || !muscleGroup || !mainMuscle || !complexNumber) {
        return res.status(400).json({ message: 'Недостаточно данных для генерации тренировки' })
    }

    try {
        // Находим выбранный паттерн
        const selectedPattern = await Pattern.findOne({
            gender,
            muscleGroup,
            mainMuscle,
            complexNumber,
        })

        if (!selectedPattern) {
            return res.status(404).json({ message: 'Паттерн не найден' })
        }

        const workoutResults: { name: string; sets: number; reps: number }[] = []

        for (const patternExercise of selectedPattern.exercises) {
            // Фильтруем упражнения по уровню сложности и подгруппе мышц
            const matchingExercises = await Exercise.find({
                subcategory: mainMuscle,
                difficultyLevel: patternExercise.exerciseLevel,
            })

            if (matchingExercises.length === 0) continue

            // Выбираем случайное упражнение из подходящих
            const selectedExercise =
                matchingExercises[Math.floor(Math.random() * matchingExercises.length)]

            // Определяем число повторений
            let repsOptions = ''
            if (gender === 'Мужчина') {
                if (patternExercise.repetitionLevel === 'легкая') {
                    repsOptions = selectedExercise.maleRepsLight
                } else if (patternExercise.repetitionLevel === 'средняя') {
                    repsOptions = selectedExercise.maleRepsMedium
                } else {
                    repsOptions = selectedExercise.maleRepsHeavy
                }
            } else {
                if (patternExercise.repetitionLevel === 'легкая') {
                    repsOptions = selectedExercise.femaleRepsLight
                } else if (patternExercise.repetitionLevel === 'средняя') {
                    repsOptions = selectedExercise.femaleRepsMedium
                } else {
                    repsOptions = selectedExercise.femaleRepsHeavy
                }
            }

            const repsArray = repsOptions.split(',').map(Number)
            const scale = [6, 8, 10, 12, 15, 20]
            const isScaleExercise = repsArray.every((rep) => scale.includes(rep))

            const reps = repsArray[Math.floor(Math.random() * repsArray.length)]
            const sets = reps >= 15 ? 2 : reps >= 10 ? 3 : 4

            workoutResults.push({
                name: selectedExercise.name,
                sets,
                reps,
            })
        }

        res.json(workoutResults)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

export default router
