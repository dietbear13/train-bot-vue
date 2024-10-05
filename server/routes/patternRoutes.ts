// server/routes/patternRoutes.ts
import express from 'express'
import Pattern from '../models/Pattern'

const router = express.Router()

// Получить все паттерны
router.get('/', async (req, res) => {
    try {
        const patterns = await Pattern.find()
        res.json(patterns)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Создать новый паттерн (для тестирования)
router.post('/', async (req, res) => {
    const pattern = new Pattern(req.body)

    try {
        const newPattern = await pattern.save()
        res.status(201).json(newPattern)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
})

export default router
