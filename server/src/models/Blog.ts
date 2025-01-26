// src/models/Blog.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
    title: string;
    body: string;
    likesCount: number;
    publishedAt: number; // или можно хранить как число (timestamp)
}

const BlogSchema: Schema = new Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    likesCount: { type: Number, default: 0 },
    publishedAt: { type: Number, required: true },
},
    { collection: 'blog' }
);

export default mongoose.model<IBlog>('Blog', BlogSchema);
