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
    userStore.loadCache(); // Загружаем данные из localStorage

    const apiRequest = async <T>(
        method: Method,
        endpoint: string,
        data?: any,
        params?: any
    ): Promise<T> => {
        if (method === 'get') {
            // Кэшируемые данные на 1 час
            if (['splits', 'exercises', 'blog', 'dietsList'].includes(endpoint)) {
                const cache = userStore[endpoint as keyof typeof userStore] as any;
                if (cache && cache.data && cache.data.length > 0 && userStore.isCacheValid(cache.timestamp)) {
                    console.log(`✅ Используем кэшированные данные для ${endpoint}.`);
                    return cache.data as T;
                }
            }

            // `users` всегда запрашиваем с сервера, т.к. они реактивные
            if (endpoint === 'users' && userStore.users.length > 0) {
                console.log('✅ Используем реактивные данные пользователей.');
                return userStore.users as T;
            }
        }

        // Если кэша нет или устарел, делаем запрос
        const config: AxiosRequestConfig = {
            method,
            url: endpoint,
            data,
            params,
        };

        try {
            const response = await axiosInstance(config);

            if (method === 'get') {
                if (endpoint === 'splits') {
                    userStore.setSplits(response.data);
                } else if (endpoint === 'exercises') {
                    userStore.setExercises(response.data);
                } else if (endpoint === 'blog') {
                    userStore.setBlogArticles(response.data);
                } else if (endpoint === 'dietsList') {
                    userStore.setDietsList(response.data);
                } else if (endpoint === 'users') {
                    const usersArray = Array.isArray(response.data) ? response.data : response.data.users;
                    console.log('👀 usersArray', usersArray, response.data);

                    if (!usersArray) {
                        console.error('❌ Ошибка: API не вернул массив пользователей.', response.data);
                        throw new Error('API не вернул массив пользователей.');
                    }

                    userStore.setUsers(usersArray);
                }
            }

            return response.data;
        } catch (error) {
            console.error(`❌ Ошибка при запросе к ${endpoint}:`, error);
            throw error;
        }
    };

    return {
        apiRequest,
    };
}
