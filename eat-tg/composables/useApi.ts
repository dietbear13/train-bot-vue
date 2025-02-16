import axios, { type AxiosInstance, type AxiosRequestConfig, type Method } from 'axios';
import { useUserStore } from '../stores/userStore';

const primaryBaseURL = 'https://fitnesstgbot.ru/api/';

const axiosInstance: AxiosInstance = axios.create({
    baseURL: primaryBaseURL,
    timeout: 15000,
    headers: { "Authorization": `jjk37Gj34HKVvd8234gFcvKqw67fAw` },
});

export function useApi() {
    const userStore = useUserStore();

    const apiRequest = async <T>(
        method: Method,
        endpoint: string,
        data?: any,
        params?: any
    ): Promise<T> => {
        // Логика кэширования
        if (method === 'get') {
            if (endpoint === 'splits') {
                if (userStore.splits.length === 0) {
                    console.log('🔄  Загружаем сплиты с API...');
                    const response = await axiosInstance({ method, url: endpoint, data, params });
                    userStore.setSplits(response.data);
                    return response.data;
                } else {
                    console.log('✅  Используем кэшированные сплиты.');
                    return userStore.splits as T;
                }
            }

            if (endpoint === 'exercises' && userStore.exercises.length) {
                console.log('✅ Используем кэшированные упражнения.');
                return userStore.exercises as T;
            }

            if (endpoint === 'blog-articles' && userStore.blogArticles.length) {
                console.log('✅ Используем кэшированные статьи блога.');
                return userStore.blogArticles as T;
            }

            if (endpoint === 'users' && userStore.users.length) {
                console.log('✅ Используем кэшированные данные пользователей.');
                return userStore.users as T;
            }
        }

        // Если кэш не подошёл, делаем запрос:
        const config: AxiosRequestConfig = {
            method,
            url: endpoint,
            data,
            params,
        };

        try {
            const response = await axiosInstance(config);

            if (method === 'get') {
                // Сохранение в store
                if (endpoint === 'splits') {
                    userStore.setSplits(response.data);
                } else if (endpoint === 'exercises') {
                    userStore.setExercises(response.data);
                } else if (endpoint === 'blog-articles') {
                    userStore.setBlogArticles(response.data);
                } else if (endpoint === 'users') {
                    // Тут response.data = { users: [...] }
                    const usersArray = response.data.users;
                    userStore.setUsers(usersArray);

                    // Ищем нужного пользователя по userStore.telegramId
                    const currentId = userStore.telegramId;
                    if (currentId) {
                        const matchingUser = usersArray.find((u: any) => u.telegramId === currentId);
                        if (matchingUser && matchingUser.trainingHistory) {
                            // Сохраняем тренировочную историю только текущего пользователя
                            userStore.setTrainingHistory(currentId, matchingUser.trainingHistory);
                        } else {
                            // Если не нашли / нет trainingHistory — обнуляем
                            userStore.setTrainingHistory(currentId, []);
                        }
                    }
                }
            }

            return response.data;
        } catch (error) {
            console.error(`Ошибка при запросе к ${endpoint}:`, error);
            throw error;
        }
    };

    return {
        apiRequest,
    };
}
