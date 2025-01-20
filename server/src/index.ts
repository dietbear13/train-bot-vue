// server.ts
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import './bot';
import path from 'path';

// Импорт старых маршрутов
import splitsRoutes from './routes/splits';
import botRoutes from './routes/bot';
import usersRoutes from './routes/users';
import exercisesRoutes from './routes/exercises';
import exerciseRoutes from './routes/exercise';
import patternsRoutes from './routes/patterns';
// import donationsRoutes from './routes/donations';
import analyticsMainRoutes from './routes/analytics/analyticsMain';
import referralRoutes from './routes/referral';

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN не задан в файле .env');
}
const bot = new TelegramBot(botToken, { polling: false });

const app = express();
const port = 4000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));
app.use(express.json());

// Подключение к MongoDB
mongoose
    // .connect('mongodb://localhost:27017/fitness-app', {} as mongoose.ConnectOptions)
    // Для продакшена (docker etc.)
    .connect('mongodb://mongodb:27017/fitness-app', {} as mongoose.ConnectOptions)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error: any) => {
        console.error('Error connecting to MongoDB:', error);
    });


// Подключаем основные роуты
app.use('/api', splitsRoutes);
app.use('/api', botRoutes);
app.use('/api', usersRoutes);
app.use('/api', exercisesRoutes);
app.use('/api', patternsRoutes);
app.use('/api', exerciseRoutes);
// app.use('/api', donationsRoutes);

// <-- Подключаем наш новый маршрут Analytics
app.use('/api', analyticsMainRoutes);

// Подключаем новый маршрут Referral
app.use('/api', referralRoutes);

// Запускаем сервер
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
