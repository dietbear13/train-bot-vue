<!-- ~/components/UserInit.vue -->

<template>
  <!-- Компонент не имеет визуального отображения -->
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '~/stores/userStore'
import axios, { Method } from 'axios'

// Получение базового URL из runtimeConfig
const config = useRuntimeConfig()
const apiBaseURL = config.public.apiBaseUrl

// Проверка, что URL заканчивается слешем
const ensureTrailingSlash = (url: string) => url.endsWith('/') ? url : `${url}/`

const primaryBaseURL = 'https://fit-server-bot.ru.tuna.am/api/';
const fallbackBaseURL = 'http://localhost:3002/api/';

// Функция apiRequest для выполнения запросов с приоритетом
const apiRequest = async <T>(
    method: Method,
    endpoint: string,
    data?: any,
    params?: any
): Promise<T> => {
  if (!primaryBaseURL) {
    throw new Error('apiBaseUrl is not defined in runtimeConfig.public')
  }

  const axiosInstance = axios.create({
    baseURL: primaryBaseURL,
    timeout: 5000,
  })

  try {
    console.log(`Отправка запроса: ${method.toUpperCase()} ${primaryBaseURL}${endpoint}`, { data, params })
    const response = await axiosInstance.request<T>({
      method,
      url: endpoint,
      data,
      params,
    })
    console.log('Ответ от основного сервера:', response.data)
    return response.data
  } catch (primaryError) {
    console.warn(`Основной сервер недоступен: ${primaryError}. Переключение на резервный сервер.`)
    // Попытка с резервным сервером
    if (!fallbackBaseURL) {
      throw new Error('fallbackBaseURL is not defined in runtimeConfig.public')
    }
    const fallbackInstance = axios.create({
      baseURL: fallbackBaseURL,
      timeout: 5000,
    })
    try {
      const response = await fallbackInstance.request<T>({
        method,
        url: endpoint,
        data,
        params,
      })
      console.log('Ответ от резервного сервера:', response.data)
      return response.data
    } catch (fallbackError) {
      console.error(`Резервный сервер также недоступен: ${fallbackError}`)
      throw fallbackError
    }
  }
}

interface TelegramUserData {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
}

const userStore = useUserStore()

onMounted(async () => {
  const tg = (window as any).Telegram.WebApp
  tg.expand();

  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const userData: TelegramUserData = tg.initDataUnsafe.user
    const telegramUserId = userData.id

    console.log('NEW Telegram User ID:', telegramUserId)

    if (telegramUserId) {
      userStore.setTelegramId(telegramUserId)
      console.log('Telegram ID установлен в Pinia Store:', telegramUserId)

      // Отправляем запрос на сервер для проверки пользователя
      try {
        const result = await apiRequest<{ role?: string; error?: string }>('post', 'check-user', {
          telegramId: telegramUserId,
        })

        console.log('Результат запроса:', result)

        if (result.role) {
          console.log('Роль пользователя:', result.role)
          userStore.setRole(result.role as 'admin' | 'freeUser' | 'paidUser')
          console.log('Роль установлена в Pinia Store:', result.role)
        } else if (result.error) {
          console.error('Ошибка сервера:', result.error)
        } else {
          console.error('Роль пользователя не получена.')
        }
      } catch (error) {
        console.error('Ошибка при отправке запроса на сервер:', error)
      }
    } else {
      console.error('Данные пользователя не найдены.')
    }
  } else {
    console.error('Не удалось получить данные пользователя из Telegram.')
  }
})
</script>
