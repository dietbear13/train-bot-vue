// server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import './bot'; // Если у вас есть отдельный файл с логикой бота


// Импортируем наши маршруты
import splitsRoutes from './routes/splits';
import botRoutes from './routes/bot';
import usersRoutes from './routes/users';
import exercisesRoutes from './routes/exercises';
import patternsRoutes from './routes/patterns';

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN не задан в файле .env');
}

const bot = new TelegramBot(botToken, { polling: false });

const app = express();
const port = 3002;

app.use(cors({
    origin: '*', // Замените на ваш источник
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Разрешенные методы
    credentials: true // Если вы используете куки или авторизацию
}));
app.use(express.json());

// Подключение к MongoDB
mongoose
    .connect('mongodb://mongodb:27017/fitness-app', {} as mongoose.ConnectOptions)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error: any) => {
        console.error('Error connecting to MongoDB:', error);
    });

// Обратите внимание, что в самих файлах маршрутов пути начинаются без /api,
// поэтому здесь указываем префикс /api там, где нужен.
app.use('/api/log', (req,res)=>{console.log("req", req)
res.send('OK')
});
app.use('/api', splitsRoutes);
app.use('/api', botRoutes);
app.use('/api', usersRoutes);
app.use('/api', exercisesRoutes);
app.use('/api', patternsRoutes);

// Запускаем сервер
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
