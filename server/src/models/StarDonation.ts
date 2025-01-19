// models/StarDonation.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IStarDonation extends Document {
    userId: number;
    stars: number;
    createdAt: Date;
}

const StarDonationSchema: Schema = new Schema({
    userId: { type: Number, required: true },
    stars: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IStarDonation>('StarDonation', StarDonationSchema);
