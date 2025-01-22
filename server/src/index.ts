import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import path from 'path';

// Импорт маршрутов
import splitsRoutes from './routes/splits';
import botRoutes from './routes/bot';
import usersRoutes from './routes/users';
import exercisesRoutes from './routes/exercises';
import exerciseRoutes from './routes/exercise';
import patternsRoutes from './routes/patterns';
// import donationsRoutes from './routes/donations';
import analyticsMainRoutes from './routes/analytics/analyticsMain';
import referralRouter from './routes/referral';

// Импорт модели Configuration
import Configuration, { IConfiguration } from './models/Configuration';

// Загрузка переменных окружения для подключения к MongoDB
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));
app.use(express.json());

// Функция для подключения к MongoDB и извлечения конфигурации
const initializeServer = async () => {
    try {
        // Подключение к MongoDB
        await mongoose.connect('mongodb://frobot1519dpf:2!L8ys9U)(rK@mongodb:27017/fitness-app', {
            authSource: 'fitness-app',
            useNewUrlParser: true,
            useUnifiedTopology: true,
        } as mongoose.ConnectOptions);
        console.log('Connected to MongoDB');

        // Определение текущей среды
        const NODE_ENV = process.env.NODE_ENV || 'development';

        // Извлечение конфигурации из базы данных
        const config: IConfiguration | null = await Configuration.findOne({ environment: NODE_ENV });

        if (!config) {
            throw new Error(`Configuration for environment "${NODE_ENV}" not found in the database.`);
        }

        const appUrl = config.VITE_API_BASE_URL;
        const botToken = config.TELEGRAM_BOT_API_KEY;

        if (!botToken) {
            throw new Error('TELEGRAM_BOT_API_KEY is missing in the configuration.');
        }

        // Инициализация TelegramBot
        const bot = new TelegramBot(botToken, { polling: false });

        // Импорт и инициализация дополнительных модулей или логики бота
        // import './bot'; // Убедитесь, что файл `bot.ts` использует уже инициализированный bot

        // Подключение маршрутов
        app.use('/api', splitsRoutes);
        app.use('/api', botRoutes);
        app.use('/api', usersRoutes);
        app.use('/api', exercisesRoutes);
        app.use('/api', patternsRoutes);
        app.use('/api', exerciseRoutes);
        // app.use('/api', donationsRoutes);
        app.use('/api', analyticsMainRoutes);
        // app.use('/api', referralRouter);

        // Запуск сервера
        app.listen(port, () => {
            console.log(`Сервер запущен на ${appUrl}:${port} в режиме ${NODE_ENV}`);
        });

    } catch (error) {
        console.error('Failed to initialize server:', error);
        process.exit(1); // Завершаем процесс с ошибкой
    }
};

// Запуск инициализации сервера
initializeServer();
