import { defineStore } from 'pinia';
import { Exercise } from "../composables/types";

interface BlogArticle {
    id: number;
    title: string;
    content: string;
}

interface CachedData<T> {
    data: T;
    timestamp: number;
}

export const useUserStore = defineStore('user', {
    state: () => ({
        telegramId: null as number | null,
        role: 'freeUser' as 'admin' | 'freeUser' | 'paidUser',
        kbzhuHistory: [] as { timestamp: number; kbzhuResult: any }[],
        savedWorkouts: [] as { dayName: string; exercises: { name: string; sets: number; reps: number }[] }[],
        exercises: { data: [], timestamp: 0 } as CachedData<Exercise[]>,
        splits: { data: [], timestamp: 0 } as CachedData<any[]>,
        blogArticles: { data: [], timestamp: 0 } as CachedData<BlogArticle[]>,
        dietsList: { data: [], timestamp: 0 } as CachedData<any[]>,
        subscriptionChecked: false,

        // Реактивные пользователи (без localStorage)
        users: [] as any[],
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
        setSubscriptionChecked() {
            this.subscriptionChecked = true;
        },

        // Методы кэширования
        setExercises(exercises: Exercise[]) {
            this.exercises = { data: exercises, timestamp: Date.now() };
            localStorage.setItem('exercisesCache', JSON.stringify(this.exercises));
        },
        setSplits(splits: any[]) {
            this.splits = { data: splits, timestamp: Date.now() };
            localStorage.setItem('splitsCache', JSON.stringify(this.splits));
        },
        setBlogArticles(articles: BlogArticle[]) {
            this.blogArticles = { data: articles, timestamp: Date.now() };
            localStorage.setItem('blogCache', JSON.stringify(this.blogArticles));
        },
        setDietsList(diets: any[]) {
            this.dietsList = { data: diets, timestamp: Date.now() };
            localStorage.setItem('dietsCache', JSON.stringify(this.dietsList));
        },

        // Реактивные пользователи (без localStorage)
        setUsers(usersData: any[]) {
            this.users = usersData;
        },

        setTrainingHistory(telegramId: number, history: any[]) {
            this.trainingHistory[telegramId] = history;
        },
        hasSplits: false,

        // Проверка актуальности кэша
        isCacheValid(timestamp: number | null, maxAgeMs = 10 * 60 * 1000) {
            if (!timestamp) return false;
            return Date.now() - timestamp < maxAgeMs;
        },

        resetCache() {
            localStorage.removeItem('exercisesCache');
            localStorage.removeItem('splitsCache');
            localStorage.removeItem('blogCache');
            localStorage.removeItem('dietsCache');

            this.exercises = { data: [], timestamp: 0 };
            this.splits = { data: [], timestamp: 0 };
            this.blogArticles = { data: [], timestamp: 0 };
            this.dietsList = { data: [], timestamp: 0 };
        },


        // Загрузка кэша из `localStorage`
        loadCache() {
            this.exercises = JSON.parse(localStorage.getItem('exercisesCache') || '{"data":[],"timestamp":0}');
            this.splits = JSON.parse(localStorage.getItem('splitsCache') || '{"data":[],"timestamp":0}');
            this.blogArticles = JSON.parse(localStorage.getItem('blogCache') || '{"data":[],"timestamp":0}');
            this.dietsList = JSON.parse(localStorage.getItem('dietsCache') || '{"data":[],"timestamp":0}');
        },
    },
    persist: true,
});
