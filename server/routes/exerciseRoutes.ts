// server/routes/exerciseRoutes.ts
import express from 'express'
import Exercise from '../models/Exercise'

const router = express.Router()

// Получить все упражнения
router.get('/', async (req, res) => {
    try {
        const exercises = await Exercise.find()
        res.json(exercises)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Создать новое упражнение (для тестирования)
router.post('/', async (req, res) => {
    const exercise = new Exercise(req.body)

    try {
        const newExercise = await exercise.save()
        res.status(201).json(newExercise)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
})

export default router
