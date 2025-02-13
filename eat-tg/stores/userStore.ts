import { defineStore } from 'pinia';
import { Exercise } from "../composables/types";

interface BlogArticle {
    id: number;
    title: string;
    content: string;
}

export const useUserStore = defineStore('user', {
    state: () => ({
        telegramId: null as number | null,
        role: 'freeUser' as 'admin' | 'freeUser' | 'paidUser',
        kbzhuHistory: [] as { timestamp: number; kbzhuResult: any }[],
        savedWorkouts: [] as { dayName: string; exercises: { name: string; sets: number; reps: number }[] }[],
        exercises: [] as Exercise[], // Кэшируем список упражнений
        splits: [] as any[], // Кэшируем тренировочные сплиты
        blogArticles: [] as BlogArticle[], // ФИКС: добавили отсутствующее поле
        subscriptionChecked: false, // Флаг для предотвращения повторных проверок
    }),
    actions: {
        setTelegramId(id: number) {
            this.telegramId = id;
        },
        setRole(role: 'admin' | 'freeUser' | 'paidUser') {
            this.role = role;
        },
        setKbzhuHistory(history: { timestamp: number; kbzhuResult: any }[]) {
            this.kbzhuHistory = history;
        },
        setSavedWorkouts(workouts: { dayName: string; exercises: { name: string; sets: number; reps: number }[] }[]) {
            this.savedWorkouts = workouts;
        },
        setExercises(exercises: Exercise[]) {
            this.exercises = exercises;
        },
        setBlogArticles(articles: BlogArticle[]) {
            this.blogArticles = articles;
        },
        setSplits(splits: any[]) {
            this.splits = splits;
        },
        setSubscriptionChecked() {
            this.subscriptionChecked = true;
        }
    },
    // persist: true, // Включаем сохранение данных в localStorage
});
