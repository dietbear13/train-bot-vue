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
import analyticsMainRoutes from './routes/analytics/analyticsMain';
import blogMainRoutes from './routes/blogMain';
import starsRoutes from './routes/donations/stars'

// Импортируем НОВЫЙ маршрут для лайков блога
import blogLikesRoutes from './routes/blogLikes';

import referralRouter from './routes/referral';

dotenv.config();

const appUrl = process.env.APP_URL;
const botToken = process.env.TELEGRAM_BOT_API_KEY;

if (!botToken) {
    throw new Error('TELEGRAM_BOT_API_KEY не задан в файле .env');
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
    .connect('mongodb://frobot1519dpf:2!L8ys9U)(rK@mongodb:27017/fitness-app', {
        authSource: 'fitness-app',
        useNewUrlParser: true,
        useUnifiedTopology: true,
    } as mongoose.ConnectOptions)
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

// Подключаем маршрут Analytics
app.use('/api', analyticsMainRoutes);
app.use('/api', blogMainRoutes);

// Подключаем маршрут BlogLikes
app.use('/api', blogLikesRoutes);

// Подключаем новый маршрут Referral (если нужно)
app.use('/api', referralRouter);
app.use('/api', starsRoutes);

// Запускаем сервер
app.listen(port, () => {
    console.log(`Сервер запущен на ${appUrl}:${port}`);
});
