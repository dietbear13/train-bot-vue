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
        exercises: [] as Exercise[],
        splits: [] as any[],
        blogArticles: [] as BlogArticle[],
        subscriptionChecked: false,

        // Массив всех пользователей
        users: [] as any[],

        // trainingHistory станет словарём,
        // ключ = telegramId, значение = массив тренировок (или объект)
        trainingHistory: {} as Record<number, any[]>,
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
        },

        setUsers(usersData: any[]) {
            this.users = usersData;
        },

        // Храним ключ = telegramId, значение = массив тренировок
        setTrainingHistory(telegramId: number, history: any[]) {
            this.trainingHistory[telegramId] = history;
        },
    },
    persist: true, // если используете pinia-plugin-persist
});
