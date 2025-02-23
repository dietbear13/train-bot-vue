// stores/wallStore.ts
import { defineStore } from 'pinia';
import { useApi } from '~/composables/useApi';

interface TrainingItem {
    _id: string;
    timestamp: number;
    isSended?: boolean;
    likes?: number;
    plan?: any[];
    formData?: {
        goal?: string;
        splitType?: string;
        comment?: string;
        // ... любые поля
    };
    telegramId?: number; // чтобы знать, от кого
}

interface CachedWallData {
    data: TrainingItem[];
    timestamp: number;
}

export const useWallStore = defineStore('wall', {
    state: () => ({
        workouts: [] as TrainingItem[], // храним все isSended=true тренировки
        timestamp: 0, // для контроля устаревания
    }),

    actions: {
        /**
         * Проверяем, не устарел ли кэш (по умолчанию 10 мин).
         */
        isCacheValid(timestamp: number | null, maxAgeMs = 10 * 60 * 1000) {
            if (!timestamp) return false;
            return Date.now() - timestamp < maxAgeMs;
        },

        /**
         * Читаем локальный кэш (wallWorkoutsCache).
         */
        loadCache() {
            const localData = localStorage.getItem('wallWorkoutsCache');
            if (localData) {
                const parsed: CachedWallData = JSON.parse(localData);
                this.workouts = parsed.data;
                this.timestamp = parsed.timestamp;
            }
        },

        /**
         * Сохраняем в локальный кэш (wallWorkoutsCache).
         */
        saveCache() {
            const payload: CachedWallData = {
                data: this.workouts,
                timestamp: Date.now(),
            };
            localStorage.setItem('wallWorkoutsCache', JSON.stringify(payload));
        },

        /**
         * Основной метод: загружаем ВСЕХ пользователей через /users,
         * собираем у каждого user.trainingHistory с isSended=true,
         * складываем в this.workouts, кэшируем.
         */
        async fetchWorkouts() {
            console.log('💾 [wallStore] Начало fetchWorkouts()');
            this.loadCache();

            // 1) Если кэш свежий, используем его
            if (this.workouts.length > 0 && this.isCacheValid(this.timestamp)) {
                return;
            }
            console.log('⛔ Кэш пуст или устарел — запрашиваем /users');

            // 2) Получаем всех пользователей прямо из API (через useApi).
            const { apiRequest } = useApi();
            let allUsers: any[] = [];
            try {
                // Предполагаем, что бэкенд вернёт массив (или объект { users: [...] }),
                // см. ниже, как обработать
                const response = await apiRequest<any>('GET', 'users');
                // Может быть либо массив, либо объект { users: [...] }
                if (Array.isArray(response)) {
                    allUsers = response;
                } else if (Array.isArray(response.users)) {
                    allUsers = response.users;
                } else {
                    throw new Error('Сервер вернул некорректный формат /users');
                }
            } catch (err) {
                console.error('❌ [wallStore] Ошибка при загрузке /users:', err);
                return;
            }

            // 3) Из каждого юзера берём .trainingHistory, фильтруем по isSended=true.
            const allSended: TrainingItem[] = allUsers.flatMap((user: any) => {
                const { telegramId } = user;
                return (user.trainingHistory || [])
                    .filter((w: any) => w.isSended === true)
                    .map((w: TrainingItem) => {
                        w.telegramId = telegramId;
                        return w;
                    });
            });

            // 4) Заполняем в store
            this.workouts = allSended;
            this.timestamp = Date.now();
            this.saveCache();

        },

        /**
         * Пример метода лайка. Можно вызвать из WallMain.vue
         */
        handleLike(workoutId: string) {
            console.log(`[wallStore] Лайк тренировки: ${workoutId}`);
            // Обычный PUT/POST запрос, либо локальное обновление this.workouts
            // ...
        },

        /**
         * Пример метода сохранения. Если нужно.
         */
        handleSave(workoutId: string) {
            console.log(`[wallStore] Сохранение тренировки: ${workoutId}`);
            // ...
        },
    },
});
