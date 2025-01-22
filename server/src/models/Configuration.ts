import mongoose, { Schema, Document } from 'mongoose';

export interface IConfiguration extends Document {
    environment: string;
    VITE_API_BASE_URL: string;
    TELEGRAM_BOT_API_KEY: string;
}

const ConfigurationSchema: Schema = new Schema({
    environment: { type: String, required: true, unique: true },
    VITE_API_BASE_URL: { type: String, required: true },
    TELEGRAM_BOT_API_KEY: { type: String, required: true },
});

// Устанавливаем уникальный индекс на поле environment
ConfigurationSchema.index({ environment: 1 }, { unique: true });

export default mongoose.model<IConfiguration>('Configuration', ConfigurationSchema);
