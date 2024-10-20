import express, { Request, Response } from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import Exercise from '../models/Exercise'
import Pattern from '../models/Pattern'
import dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
dotenv.config()

const botToken = process.env.TELEGRAM_BOT_TOKEN
if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN не задан в файле .env')
}

const bot = new TelegramBot(botToken, { polling: false })

const app = express()
const port = 3002

app.use(cors())
app.use(express.json())

// Подключение к MongoDB
mongoose
    .connect('mongodb://localhost:27017/fitness-app', {
    } as mongoose.ConnectOptions)
    .then(() => {
        console.log('Connected to MongoDB')
    })
    .catch((error: any) => {
        console.error('Error connecting to MongoDB:', error)
    })

// Модель пользователя (можете изменить по необходимости)
interface User {
    telegramId: number
}

// Простая имитация базы данных пользователей
const users: { [key: number]: User } = {}

// Function to send the workout to the user
const sendWorkoutToUser = (chatId: number, workout: { name: string; sets: number; reps: number }[]) => {
    let message = 'Тренировка на {подгруппа мышц}:\n\n'
    workout.forEach((exercise, index) => {
        message += `${index + 1}. ${exercise.name} — ${exercise.sets}×${exercise.reps}\n`
    })

    bot
        .sendMessage(chatId, message)
        .then(() => {
            console.log(`Workout sent to user ${chatId}`)
        })
        .catch((error) => {
            console.error('Error sending message to user:', error.message)
        })
}

// Route to send the workout
app.post('/api/send-workout', async (req: Request, res: Response) => {
    const { userId, workout } = req.body

    if (!userId || !workout) {
        return res.status(400).json({ message: 'Необходимо указать userId и workout' })
    }

    try {
        sendWorkoutToUser(userId, workout)
        res.json({ message: 'Тренировка отправлена в Telegram' })
    } catch (error: any) {
        console.error('Ошибка при отправке сообщения в Telegram:', error.message)
        res.status(500).json({ message: 'Ошибка при отправке сообщения в Telegram' })
    }
})

// Маршрут для получения всех упражнений
app.get('/api/exercises', async (req: Request, res: Response) => {
    try {
        const exercises = await Exercise.find()
        res.json(exercises)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// Маршрут для получения всех паттернов
app.get('/api/patterns', async (req: Request, res: Response) => {
    try {
        const patterns = await Pattern.find()
        res.json(patterns)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// Тестовый маршрут
app.get('/', (req: Request, res: Response) => {
    res.send('Привет, TypeScript с Express!')
})

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`)
})
