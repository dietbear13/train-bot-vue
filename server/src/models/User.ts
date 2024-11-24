// src/models/User.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    telegramId: number;
    role: 'admin' | 'freeUser' | 'paidUser';
    dateAdded: number; // UNIX timestamp
    datePaid?: number; // UNIX timestamp
    datePaidUntil?: number; // UNIX timestamp
}

const UserSchema: Schema = new Schema({
    telegramId: { type: Number, required: true, unique: true },
    role: { type: String, enum: ['admin', 'freeUser', 'paidUser'], default: 'freeUser' },
    dateAdded: { type: Number, required: true },
    datePaid: { type: Number },
    datePaidUntil: { type: Number },
});

export default mongoose.model<IUser>('User', UserSchema);
