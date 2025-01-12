<!-- ~/components/UserInit.vue -->

<template>
  <!-- Компонент не имеет визуального отображения -->
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from '~/stores/userStore';
import { useApi } from '~/composables/useApi';
import { useSubscription } from '~/composables/useSubscription';

const { apiRequest } = useApi();
const { checkSubscription } = useSubscription();
const userStore = useUserStore();

interface TelegramUserData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

onMounted(async () => {
  const tg = (window as any).Telegram?.WebApp;

  // Расширяем веб-приложение
  if (tg) {
    tg.expand();
    tg.disableVerticalSwipes();
  }

  // Проверяем, есть ли данные о пользователе в tg.initDataUnsafe
  if (tg?.initDataUnsafe?.user) {
    const userData: TelegramUserData = tg.initDataUnsafe.user;
    const telegramUserId = userData.id;

    console.log('NEW Telegram User ID:', telegramUserId);

    if (telegramUserId) {
      // Сохраняем Telegram ID в Pinia
      userStore.setTelegramId(telegramUserId);

      try {
        // Сначала получаем роль пользователя из базы
        const result = await apiRequest<{
          role?: string;
          error?: string;
        }>('post', 'check-user', {
          telegramId: telegramUserId,
        });

        // Если с сервера вернулась роль
        if (result.role) {
          // Устанавливаем её в Pinia
          userStore.setRole(result.role as 'admin' | 'freeUser' | 'paidUser');

          // Если роль не админ, делаем автоматическую проверку фактической подписки
          // — особенно важно для paidUser, чтобы поймать отписку.
          if (result.role !== 'admin') {
            await checkSubscription();
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
      console.error('Данные пользователя не найдены в tg.initDataUnsafe.');
    }
  } else {
    console.error('Не удалось получить данные пользователя из Telegram.');
  }
});
</script>

<style scoped>
/* Компонент не имеет визуального отображения */
</style>
