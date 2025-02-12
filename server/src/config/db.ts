import mongoose from 'mongoose';
import { config } from './env';

export const connectDB = async () => {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('✅  Подключено к MongoDB');
    } catch (error) {
        console.error('❌ Ошибка подключения к MongoDB:', error);
        process.exit(1);
    }
};
