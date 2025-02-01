import mongoose, { Schema, Document } from 'mongoose'

export interface IKbzhuHistory {
    formData: {
        gender: string
        bodyType: string
        age: number | null
        height: number | null
        weight: number | null
        goal: string
        workoutsPerWeek: number
    }
    kbzhuResult: {
        calories: number
        extraCalories: number
        proteins: number
        fats: number
        carbs: number
    }
    timestamp: number // UNIX timestamp
}

export interface ITrainingHistory {
    formData: {
        gender: string
        goal: string       // Цель (Похудение, Общие, Массонабор и т.д.)
        splitType: string
        splitId: string
    }
    timestamp: number // UNIX timestamp
}

export interface IReferral {
    inviteeId: number
    date: number // UNIX timestamp
}

export interface IBlogLike {
    postId: string
    liked: boolean     // true (лайк) или false (анлайк)
    date: number       // время, когда пользователь изменил лайк
}

// Новая структура для истории нажатий на кнопку "донат звёзд"
export interface IStarDonationPress {
    telegramId: number
    stars: number
    timestamp: number // UNIX timestamp
}

export interface IUser extends Document {
    telegramId: number
    role: 'admin' | 'freeUser' | 'paidUser'
    dateAdded: number // UNIX timestamp
    datePaid?: number // UNIX timestamp
    datePaidUntil?: number // UNIX timestamp
    kbzhuHistory?: IKbzhuHistory[]
    trainingHistory?: ITrainingHistory[]
    referrals: IReferral[]
    blogLikes: IBlogLike[]
    // Новое необязательное поле для хранения нажатий по звёздному донату
    starDonationHistory?: IStarDonationPress[]
}

const UserSchema: Schema = new Schema<IUser>({
    telegramId: { type: Number, required: true, unique: true },
    role: { type: String, enum: ['admin', 'freeUser', 'paidUser'], default: 'freeUser' },
    dateAdded: { type: Number, required: true },
    datePaid: { type: Number },
    datePaidUntil: { type: Number },
    kbzhuHistory: [
        {
            formData: {
                gender: { type: String, required: true },
                bodyType: { type: String, required: true },
                age: { type: Number, required: true },
                height: { type: Number, required: true },
                weight: { type: Number, required: true },
                goal: { type: String, required: true },
                workoutsPerWeek: { type: Number, required: true },
            },
            kbzhuResult: {
                calories: { type: Number, required: true },
                extraCalories: { type: Number, required: true },
                proteins: { type: Number, required: true },
                fats: { type: Number, required: true },
                carbs: { type: Number, required: true },
            },
            timestamp: { type: Number, required: true },
        },
    ],
    trainingHistory: [
        {
            formData: {
                gender: { type: String, required: true },
                goal: { type: String, required: false },
                splitType: { type: String, required: true },
                splitId: { type: String, required: true },
            },
            timestamp: { type: Number, required: true },
        },
    ],
    referrals: {
        type: [
            {
                inviteeId: { type: Number, required: true },
                date: { type: Number, required: true },
            },
        ],
        default: [],
    },
    blogLikes: {
        type: [
            {
                postId: { type: String, required: true },
                liked: { type: Boolean, default: true },
                date: { type: Number, required: true },
            },
        ],
        default: [],
    },
    // Новое поле для записи истории нажатий
    starDonationHistory: {
        type: [
            {
                telegramId: { type: Number, required: true },
                stars: { type: Number, required: true },
                timestamp: { type: Number, required: true },
            },
        ],
        default: [],
    },
})

export default mongoose.model<IUser>('User', UserSchema)
