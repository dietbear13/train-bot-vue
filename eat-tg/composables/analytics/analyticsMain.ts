/* /composables/analytics/analyticsMain.ts */

import { ref, reactive, computed, watch } from 'vue'
import { useApi } from '../useApi'

/** Интерфейс для события аналитики */
export interface AnalyticsEvent {
    eventName: string
    timestamp: number
    payload?: Record<string, any>
}

/** Основной интерфейс для сессии (по желанию) */
interface AnalyticsSession {
    sessionId: string
    startTime: number
    endTime?: number
    events: AnalyticsEvent[]
}

/**
 * Основной хук для сбора и отправки аналитики.
 * Предполагается, что вы будете использовать его во всех компонентах
 * через "import { useAnalyticsMain } from '~/composables/analytics/analyticsMain'"
 */
export function useAnalyticsMain() {
    // Здесь будет храниться текущая сессия
    const currentSession = reactive<AnalyticsSession>({
        sessionId: generateSessionId(),
        startTime: Date.now(),
        events: [],
    })

    // Если нужен общий счётчик сессий или событий
    const sessionCounter = ref<number>(1)

    // Пример хранения “подключенных” дочерних аналитических хуков (модулей)
    const registeredChildHooks = ref<string[]>([])

    // Подключаем useApi для отправки данных
    const { apiRequest } = useApi()

    /**
     * Генератор псевдо-уникального идентификатора сессии
     */
    function generateSessionId() {
        return `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    }

    /**
     * Регистрация дочернего аналитического модуля (по желанию)
     */
    function registerChildHook(hookName: string) {
        if (!registeredChildHooks.value.includes(hookName)) {
            registeredChildHooks.value.push(hookName)
            console.info(`Analytics child hook "${hookName}" registered`)
        }
    }

    /**
     * Универсальный метод для трекинга пользовательских событий
     * @param eventName Название события
     * @param payload Дополнительные данные (например, что ввёл пользователь)
     */
    function trackEvent(eventName: string, payload?: Record<string, any>) {
        const event: AnalyticsEvent = {
            eventName,
            timestamp: Date.now(),
            payload,
        }
        currentSession.events.push(event)
        console.log(`[AnalyticsMain] Event tracked: ${eventName}`, payload)
    }

    /**
     * Если нужно разбивать по времени или по количеству событий — например, чтобы отправлять "батчами".
     * Здесь просто пример: отправляем при накоплении > N событий.
     */
    watch(
        () => currentSession.events.length,
        (newCount) => {
            // Допустим, отправляем, если накопилось 5 ивентов
            if (newCount > 0 && newCount % 5 === 0) {
                console.log('[AnalyticsMain] Sending batch of 5 events...')
                sendAnalyticsData()
            }
        }
    )

    /**
     * Пример завершения сессии (можно вызывать при unmounted или logout)
     */
    function endSession() {
        currentSession.endTime = Date.now()
        // Можно сразу отправить финальный батч
        sendAnalyticsData()
        // Обнулить или зафиксировать состояние
        currentSession.events = []
        sessionCounter.value++
        currentSession.sessionId = generateSessionId()
        currentSession.startTime = Date.now()
    }

    /**
     * Отправка аналитики на сервер
     * Можете вызывать как на бэке нужно: batched sending, immediate, и т.д.
     */
    async function sendAnalyticsData() {
        if (!currentSession.events.length) {
            console.warn('[AnalyticsMain] Нет событий для отправки.')
            return
        }

        try {
            const payload = {
                sessionId: currentSession.sessionId,
                startTime: currentSession.startTime,
                endTime: currentSession.endTime || null,
                events: currentSession.events,
            }
            // Пример POST-запроса
            await apiRequest('POST', 'analytics', payload)
            console.log('[AnalyticsMain] События успешно отправлены на сервер.')
            // Очистка массива событий после успешной отправки
            currentSession.events = []
        } catch (error) {
            console.error('[AnalyticsMain] Ошибка при отправке аналитики:', error)
            // В реальном проекте можно хранить эти события, чтобы отправить повторно
        }
    }

    return {
        currentSession,
        sessionCounter,
        trackEvent,
        endSession,
        sendAnalyticsData,
        registerChildHook,
    }
}
