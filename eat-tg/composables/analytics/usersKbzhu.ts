/* /composables/analytics/usersKbzhu.ts */

import { useApi } from '../useApi';

/**
 * Хук аналитики для отправки данных КБЖУ на сервер
 */
export function useKbzhuAnalytics() {
    const { apiRequest } = useApi();

    /**
     * Функция для отправки аналитических данных на сервер
     * @param userId - telegramId пользователя
     * @param formData - параметры генерации КБЖУ
     * @param kbzhuResult - результаты генерации КБЖУ
     */
    const sendAnalyticsData = async (
        userId: number,
        formData: any,
        kbzhuResult: any
    ) => {
        if (!userId || !formData || !kbzhuResult) {
            console.warn('[useKbzhuAnalytics] Отсутствуют данные для отправки аналитики.');
            return;
        }

        try {
            await apiRequest('POST', 'analytics/save-kbzhu', {
                userId: userId,
                formData: { ...formData },
                kbzhuResult: { ...kbzhuResult },
                timestamp: Date.now(),
            });
            console.log('[useKbzhuAnalytics] Аналитические данные успешно отправлены.');
        } catch (error: any) {
            console.error('[useKbzhuAnalytics] Ошибка при отправке аналитики:', error);
        }
    };

    return {
        sendAnalyticsData,
    };
}
