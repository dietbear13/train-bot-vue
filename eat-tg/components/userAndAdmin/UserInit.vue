<!-- ~/components/UserInit.vue -->

<template>
  <!-- Компонент не имеет визуального отображения -->
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from '~/stores/userStore';
import axios, { Method } from 'axios';

const config = useRuntimeConfig();
const apiBaseURL = config.public.apiBaseUrl;

const ensureTrailingSlash = (url: string) =>
    url.endsWith('/') ? url : `${url}/`;

const primaryBaseURL = 'https://fit-server-bot.ru.tuna.am/api/';
const fallbackBaseURL = 'http://localhost:3002/api/';

const apiRequest = async <T>(
    method: Method,
    endpoint: string,
    data?: any,
    params?: any
): Promise<T> => {
  const axiosInstance = axios.create({
    baseURL: primaryBaseURL,
    timeout: 5000,
  });

  try {
    console.log(
        `Отправка запроса: ${method.toUpperCase()} ${primaryBaseURL}${endpoint}`,
        { data, params }
    );
    const response = await axiosInstance.request<T>({
      method,
      url: endpoint,
      data,
      params,
    });
    console.log('Ответ от основного сервера:', response.data);
    return response.data;
  } catch (primaryError) {
    console.warn(
        `Основной сервер недоступен: ${primaryError}. Переключение на резервный сервер.`
    );
    const fallbackInstance = axios.create({
      baseURL: fallbackBaseURL,
      timeout: 5000,
    });
    const response = await fallbackInstance.request<T>({
      method,
      url: endpoint,
      data,
      params,
    });
    console.log('Ответ от резервного сервера:', response.data);
    return response.data;
  }
};

interface TelegramUserData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

const userStore = useUserStore();

onMounted(async () => {
  const tg = (window as any).Telegram?.WebApp;

  // Расширяем веб-приложение
  tg.expand();
  tg.disableVerticalSwipes();

  // Запрос на переход в полноэкранный режим (если доступно)
  // if (typeof tg.requestFullscreen === 'function') {
  //   tg.requestFullscreen();
  // }

  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const userData: TelegramUserData = tg.initDataUnsafe.user;
    const telegramUserId = userData.id;

    console.log('NEW Telegram User ID:', telegramUserId);

    if (telegramUserId) {
      userStore.setTelegramId(telegramUserId);

      try {
        const result = await apiRequest<{
          role?: string;
          error?: string;
        }>('post', 'check-userAndAdmin', {
          telegramId: telegramUserId,
        });

        if (result.role) {
          userStore.setRole(result.role as 'admin' | 'freeUser' | 'paidUser');

          // Проверяем подписку на канал, если пользователь не админ
          if (result.role !== 'admin') {
            const subscriptionResult = await apiRequest<{
              isSubscribed: boolean;
              message?: string;
            }>('post', 'check-subscription', {
              telegramId: telegramUserId,
            });

            console.log('Результат проверки подписки:', subscriptionResult);

            if (subscriptionResult.isSubscribed) {
              if (userStore.role !== 'paidUser') {
                userStore.setRole('paidUser');
                console.log(
                    'Пользователь подписан на канал. Роль обновлена на paidUser.'
                );
              }
            } else {
              console.log('Пользователь не подписан на канал.');
              if (userStore.role === 'paidUser') {
                userStore.setRole('freeUser');
                console.log(
                    'Роль пользователя изменена на freeUser из-за отсутствия подписки.'
                );

                try {
                  await apiRequest('post', 'update-userAndAdmin-role', {
                    telegramId: telegramUserId,
                    role: 'freeUser',
                  });
                  console.log('Роль пользователя обновлена на сервере.');
                } catch (error) {
                  console.error(
                      'Ошибка при обновлении роли пользователя на сервере:',
                      error
                  );
                }
              }
            }
          }
        } else if (result.error) {
          console.error('Ошибка сервера:', result.error);
        } else {
          console.error('Роль пользователя не получена.');
        }
      } catch (error) {
        console.error('Ошибка при отправке запроса на сервер:', error);
      }
    } else {
      console.error('Данные пользователя не найдены.');
    }
  } else {
    console.error('Не удалось получить данные пользователя из Telegram.');
  }
});
</script>
