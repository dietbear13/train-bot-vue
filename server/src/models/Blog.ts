// src/models/Blog.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
    title: string;
    body: string;
    publishedAt: number; // Храним timestamp
    telegramPostUrl?: string; // Новое поле для ссылки на пост в Telegram
}

const BlogSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        body: { type: String, required: true },
        publishedAt: { type: Number, required: true },
        telegramPostUrl: { type: String, default: '' }, // Если ссылка не заполнена, по умолчанию пустая строка
    },
    { collection: 'blog' }
);

export default mongoose.model<IBlog>('Blog', BlogSchema);
