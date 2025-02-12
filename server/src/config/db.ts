import mongoose from 'mongoose';
import { config } from './env';

export const connectDB = async () => {
    try {
        await mongoose.connect(config.mongoUri, {
            authSource: 'fitness-app',
            user: 'frobot1519dpf',
            pass: '2!L8ys9U)(rK',
            useNewUrlParser: true,
            useUnifiedTopology: true,
        } as mongoose.ConnectOptions);

        console.log('✅  Подключено к MongoDB');
    } catch (error) {
        console.error('❌ Ошибка подключения к MongoDB:', error);
        process.exit(1);
    }
};
