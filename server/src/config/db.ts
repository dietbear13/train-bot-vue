import mongoose from 'mongoose';
import { config } from './env';

export const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://frobot1519dpf:2!L8ys9U)(rK@mongodb:27017/fitness-app', {
            authSource: 'fitness-app',
        } as mongoose.ConnectOptions);
        console.log('✅  Подключено к MongoDB');
    } catch (error) {
        console.error('❌ Ошибка подключения к MongoDB:', error);
    }
};

