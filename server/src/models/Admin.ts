import mongoose, { Schema, Document } from 'mongoose'

export interface IAdmin extends Document {
    username: string
    password: string
    telegramId: number
}

const AdminSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    telegramId: { type: Number, required: true, unique: true }
})

export default mongoose.model<IAdmin>('Admin', AdminSchema)
