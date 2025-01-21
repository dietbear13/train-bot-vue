// src/routes/bot/types.ts

/**
 * Интерфейс для упражнения.
 */
export interface Exercise {
    name: string;
    sets: number;
    reps: number;
    dataUsed?: Record<string, any>;
}

/**
 * Интерфейс для дня недели с упражнениями.
 */
export interface GeneratedDay {
    dayName: string;
    exercises: Exercise[];
    patternOrExercise?: string[];
}

/**
 * Интерфейс для тела запроса в маршруте /send-workout.
 */
export interface SendWorkoutRequestBody {
    userId: number;
    splitName: string;
    splitComment?: string;
    plan: GeneratedDay[];
}

// Добавьте другие общие типы по мере необходимости
