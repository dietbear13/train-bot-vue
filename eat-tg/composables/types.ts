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
    category: string;           // например: "ноги"
    subcategory: string;        // например: "ягодицы"
    mainMuscle: string;         // "ягодицы"
    additionalMuscles: string;  // "бицепс бедра, квадрицепс" и т.д.
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
}

export interface WorkoutResult {
    _id: string;
    name: string;
    sets: number;
    reps: number;
}

export interface PatternExercise {
    muscleGroup: string;         // например: "ноги"
    subcategory?: string;        // "ягодицы" (учитываем ТОЛЬКО при выборе паттерна)
    mainMuscle: string;          // "ягодицы"
    repetitionLevel: string;
    additionalColumn: string;
    _id?: string;
}

export interface Pattern {
    _id: string;
    gender: string;          // "мужчина,женщина" или "мужчина" и т.д.
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

