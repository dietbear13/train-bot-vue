// stores/wallStore.ts

import { defineStore } from 'pinia';
import { useApi } from '~/composables/useApi';
import { useUserStore } from '~/stores/userStore';

interface TrainingItem {
    _id: string;
    timestamp: number;
    isSended?: boolean;
    likes?: number;
    plan?: any[];        // массив дней и упражнений
    formData?: {
        goal?: string;
        splitType?: string;
        comment?: string;
        // ... любые другие поля, которые у вас приходят
    };
    telegramId?: number; // если храните идентификатор пользователя
}

interface CachedWallData {
    data: TrainingItem[];
    timestamp: number;
}

export const useWallStore = defineStore('wall', {
    state: () => ({
        // Все тренировки, которые "isSended = true" из разных пользователей
        workouts: [] as TrainingItem[],
        timestamp: 0, // для контроля "свежести" данных
    }),

    actions: {
        /**
         * Проверяем, не устарели ли данные за `maxAgeMs` миллисекунд (10 минут по умолчанию).
         */
        isCacheValid(timestamp: number | null, maxAgeMs = 10 * 60 * 1000) {
            if (!timestamp) return false;
            return Date.now() - timestamp < maxAgeMs;
        },

        /**
         * Загружаем кэш из localStorage при инициализации стора (или перед fetchWorkouts).
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
         * Сохраняем текущие данные в localStorage (можно вызывать после формирования массива workouts).
         */
        saveCache() {
            const payload: CachedWallData = {
                data: this.workouts,
                timestamp: Date.now(),
            };
            localStorage.setItem('wallWorkoutsCache', JSON.stringify(payload));
        },

        /**
         * Собираем тренировки (isSended = true) из userStore.users и кэшируем.
         * - Если локальный кэш не устарел — используем его.
         * - Если устарел, берём users из userStore (при необходимости — forceLoadData, если в userStore нет данных).
         */
        async fetchWorkouts() {
            // 1) Пробуем загрузить из локального кэша
            this.loadCache();

            // 2) Если есть свежий кэш — используем его
            if (this.workouts.length > 0 && this.isCacheValid(this.timestamp)) {
                console.log('✅ Используем кэш "wallWorkouts" из wallStore');
                return;
            }

            // 3) Иначе получаем актуальные данные из userStore
            const userStore = useUserStore();
            // Убедимся, что userStore уже имеет свежий массив users
            // Можно просто вызвать forceLoadData(), чтобы загрузить их из API,
            // или проверить userStore.isCacheValid(...) при желании.
            if (userStore.users.length === 0) {
                console.log('♻️ userStore.users пуст, делаем forceLoadData...');
                const { apiRequest } = useApi();
                // Или непосредственно userStore.forceLoadData(), если у вас так принято:
                await userStore.forceLoadData();
            }

            // 4) Теперь userStore.users должен содержать всех пользователей.
            //    У каждого пользователя в .trainingHistory находим isSended = true.
            const allSendedWorkouts: TrainingItem[] = userStore.users.flatMap((user: any) => {
                // Добавим telegramId в каждый workout, чтобы знать, от кого пришла тренировка
                return (user.trainingHistory || [])
                    .filter((w: any) => w.isSended === true)
                    .map((w: TrainingItem) => {
                        // Присваиваем telegramId пользователя, если надо
                        w.telegramId = user.telegramId;
                        return w;
                    });
            });

            // 5) Заполняем в state
            this.workouts = allSendedWorkouts;
            this.timestamp = Date.now();

            // 6) Кэшируем в localStorage
            this.saveCache();

            console.log(`✅ Сформированы ${this.workouts.length} тренировок для стены`);
        },
    },
});
