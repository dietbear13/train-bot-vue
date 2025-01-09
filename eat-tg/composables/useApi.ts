// composables/useApi.ts

import axios from 'axios';
import type { AxiosRequestConfig, Method } from 'axios';

/**
 * Composable для выполнения API-запросов с переключением на резервный сервер при ошибке
 */
export function useApi() {
    const primaryBaseURL = 'http://fitnesstgbot.ru/api/';
    const fallbackBaseURL = 'http://localhost:3001/api/';

    /**
     * Функция для выполнения API-запросов с переключением на резервный сервер при ошибке
     */
    const apiRequest = async <T>(
        method: Method,
        endpoint: string,
        data?: any,
        params?: any
    ): Promise<T> => {
        const config: AxiosRequestConfig = {
            method,
            url: primaryBaseURL + endpoint,
            data,
            params,
            timeout: 30000,
        };

        try {
            const response = await axios(config);
            return response.data;
        } catch (primaryError) {
            console.warn(
                `Основной сервер не доступен: ${primaryError}. Переключение на резервный сервер.`
            );
            const fallbackConfig: AxiosRequestConfig = {
                method,
                url: fallbackBaseURL + endpoint,
                data,
                params,
                timeout: 5000,
            };
            try {
                const response = await axios(fallbackConfig);
                return response.data;
            } catch (fallbackError) {
                console.error(`Резервный сервер тоже недоступен: ${fallbackError}`);
                throw fallbackError;
            }
        }
    };

    return {
        apiRequest,
    };
}
