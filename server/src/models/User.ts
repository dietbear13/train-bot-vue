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
        goal?: string
        splitType: string
        splitId: string
        // <-- Добавляем под-объект injuryFilters
        injuryFilters?: {
            spine?: boolean
            knee?: boolean
            shoulder?: boolean
        }
    }
    timestamp: number // UNIX timestamp
    isSended?: boolean
    plan?: any // <-- план тренировки
}

export interface IReferral {
    inviteeId: number
    date: number // UNIX timestamp
}

export interface IBlogLike {
    postId: string
    liked: boolean
    date: number
}

export interface IStarDonationPress {
    telegramId: number
    stars: number
    timestamp: number // UNIX timestamp
}

export interface ISurveyCallback {
    surveyId: string
    messageId: string
    callbackAt: string
    answeredAt: Date
}

export interface IUser extends Document {
    telegramId: number
    role: 'admin' | 'freeUser' | 'paidUser'
    dateAdded: number
    datePaid?: number
    datePaidUntil?: number
    kbzhuHistory?: IKbzhuHistory[]
    trainingHistory?: ITrainingHistory[]
    referrals: IReferral[]
    blogLikes: IBlogLike[]
    starDonationHistory?: IStarDonationPress[]
    surveyCallbacks?: ISurveyCallback[]
}

const SurveyCallbackSchema = new Schema<ISurveyCallback>(
    {
        surveyId: { type: String, required: true },
        messageId: { type: String, required: true },
        callbackAt: { type: String },
        answeredAt: { type: Date },
    },
    { _id: false }
)

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
                // <-- Добавляем схему для injuryFilters
                injuryFilters: {
                    spine: { type: Boolean, default: false },
                    knee: { type: Boolean, default: false },
                    shoulder: { type: Boolean, default: false },
                },
            },
            timestamp: { type: Number, required: true },
            isSended: { type: Boolean, default: false },
            plan: { type: Schema.Types.Mixed }, // храним полный план
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
    surveyCallbacks: {
        type: [SurveyCallbackSchema],
        default: [],
    },
})

export default mongoose.model<IUser>('User', UserSchema)
