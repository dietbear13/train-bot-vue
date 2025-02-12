import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import { config } from './config/env';
import routes from './routes';
import { initBot } from './config/bot';
import { errorHandler } from './middleware/errorHandler';
import { setupBotCommands } from './services/botService';

const app = express();



// Логируем входящие запросы (помогает в дебаге)
app.use((req, res, next) => {
    console.log(`📢 Запрос: ${req.method} ${req.originalUrl}`);
    next();
});


app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.use(express.json());

connectDB();

// Подключение маршрутов
app.use('/api', routes);


// последний app.use
app.use(errorHandler);

setupBotCommands();

// Запуск Telegram бота
initBot().then(() => {
    // Запускаем сервер только после инициализации бота
    app.listen(config.port, () => {
        console.log(`🚀 Сервер запущен на ${config.appUrl}:${config.port}`);
    });
});
