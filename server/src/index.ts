// src/index.ts

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import { config } from './config/env';
import routes from './routes';
import './bot';

const app = express();

// Настройки CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.use(express.json());

// Подключение к базе данных
connectDB();

// Подключение маршрутов
app.use('/api', routes);

// Запуск сервера
app.listen(config.port, () => {
    console.log(`🚀 Сервер запущен на ${config.appUrl}:${config.port}`);
});
