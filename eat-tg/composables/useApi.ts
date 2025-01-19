/* /composables/useApi.ts */
import axios, { type AxiosInstance, type AxiosRequestConfig, type Method } from 'axios'

// Базовые URL для основных и резервных серверов
const primaryBaseURL = 'https://fitnesstgbot.ru/api/'
const fallbackBaseURL = 'http://localhost:3002/api/'
// const primaryBaseURL = 'https://fitnesstgbot.ru/api/'

// Создаём экземпляр Axios с основным базовым URL
const axiosInstance: AxiosInstance = axios.create({
    baseURL: primaryBaseURL,
    timeout: 10000,
})


/**
 * Composable useApi для управления API-запросами.
 */
export function useApi() {
    /**
     * Функция для отправки API-запросов.
     *
     * @template T - Тип данных, которые ожидаются в ответе.
     * @param method - HTTP-метод запроса (GET, POST, и т.д.).
     * @param endpoint - Конечная точка API (например, 'exercises').
     * @param data - Данные для отправки в теле запроса (для методов POST, PUT и т.д.).
     * @param params - Параметры запроса (для методов GET).
     * @returns Promise с данными типа T.
     */
    const apiRequest = async <T>(
        method: Method,
        endpoint: string,
        data?: any,
        params?: any
    ): Promise<T> => {
        const config: AxiosRequestConfig = {
            method,
            url: endpoint,
            data,
            params,
        }

        try {
            const response = await axiosInstance(config)
            console.log('! response UseApi', response)
            return response.data
        } catch (error) {
            console.error(`Ошибка при запросе к ${endpoint}:`, error)
            throw error
        }
    }

    return {
        apiRequest,
    }
}
