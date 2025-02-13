import axios, { type AxiosInstance, type AxiosRequestConfig, type Method } from 'axios'
import { useUserStore } from '../stores/userStore'

const primaryBaseURL = 'https://fitnesstgbot.ru/api/'

const axiosInstance: AxiosInstance = axios.create({
    baseURL: primaryBaseURL,
    timeout: 15000,
    headers: { "Authorization": `jjk37Gj34HKVvd8234gFcvKqw67fAw` },
})

export function useApi() {
    const userStore = useUserStore();

    const apiRequest = async <T>(
        method: Method,
        endpoint: string,
        data?: any,
        params?: any
    ): Promise<T> => {
        // Проверяем, есть ли уже сохраненные данные
        if (method === 'get') {
            if (endpoint === 'splits') {
                if (!userStore.hasSplits) {
                    console.log('🔄  Загружаем сплиты с API...');
                    const response = await axiosInstance({ method, url: endpoint, data, params });
                    userStore.setSplits(response.data);
                    return response.data;
                } else {
                    console.log('✅  Используем кэшированные сплиты.');
                    return userStore.splits as T;
                }
            }
            if (endpoint === 'exercises' && userStore.exercises.length) return userStore.exercises as T;
        }

        const config: AxiosRequestConfig = {
            method,
            url: endpoint,
            data,
            params,
        };

        try {
            const response = await axiosInstance(config);

            // Сохраняем загруженные данные в Pinia
            if (method === 'get') {
                if (endpoint === 'splits') userStore.setSplits(response.data);
                if (endpoint === 'exercises') userStore.setExercises(response.data);
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
