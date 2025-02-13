// composables/types.ts

export interface RepetitionLevels {
    maleRepsLight: string;
    maleRepsMedium: string;
    maleRepsHeavy: string;
    femaleRepsLight: string;
    femaleRepsMedium: string;
    femaleRepsHeavy: string;
}

export interface Exercise extends RepetitionLevels {
    _id: string;
    category: string;
    subcategory: string;
    mainMuscle: string;
    additionalMuscles: string[];
    difficultyLevel: string;
    name: string;
    equipment: string;
    typeExercise?: string;
    isWarnGif?: boolean;
    technique?: string;
    spineRestrictions?: boolean;
    kneeRestrictions?: boolean;
    shoulderRestrictions?: boolean;
    gifImage?: string;
    createdAt?: string;  // Дата создания
    updatedAt?: string;  // Дата обновления
}



export interface WorkoutResult {
    _id: string;
    name: string;
    sets: number;
    reps: number;
}

export interface PatternExercise {
    muscleGroup: string;
    subcategory?: string;
    mainMuscle: string;
    repetitionLevel: string;
    additionalColumn: string;
    _id?: string;
}

export interface Pattern {
    _id: string;
    gender: string;
    complexNumber: string;
    exerciseLevel?: string;
    exercises: PatternExercise[];
}

export interface TelegramUserData {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

export interface SnackbarState {
    show: boolean;
    message: string;
    color: string;
    timeout?: number;
}
