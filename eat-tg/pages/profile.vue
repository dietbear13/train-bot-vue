<template>
  <v-container>
    <h2 class="my-2">Профиль</h2>

    <div v-if="userStore.role">
      <p>Ваш Telegram ID: {{ userStore.telegramId }}</p>
      <p>{{ roleDisplay }}</p>
    </div>

    <!-- Компонент AdminInfo для администраторов -->
    <AdminInfo v-if="userStore.role === 'admin'" />

    <!-- Секция для paidUser -->
    <div v-else-if="userStore.role === 'paidUser'" class="paid-user-section">
      <v-card class="mb-4">
        <v-card-text>
          <p>Ты уже подписан на канал. Спасибо за вашу поддержку!</p>
          <p>
            Читай наш канал <a :href="channelLink" target="_blank">кОчалка</a>.
          </p>
          <v-btn color="primary" @click="goToChannel" class="my-2">
            Перейти в канал
          </v-btn>
        </v-card-text>
      </v-card>
    </div>

    <!-- Секция для freeUser -->
    <div v-else-if="userStore.role === 'freeUser'" class="upgrade-section">
      <v-card class="mb-4">
        <v-card-text>
          <p>
            Подпишись на мой канал <a :href="channelLink" target="_blank">кОчалка</a>, чтобы получить полный функционал.
          </p>
          <v-btn color="primary" @click="goToChannel" class="my-2">
            Перейти в канал
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- Кнопка "Проверить подписку" -->
      <v-btn color="success" @click="checkSubscription">
        Проверить подписку
      </v-btn>
    </div>

    <!-- Snackbar для уведомлений -->
    <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="snackbar.timeout"
        top
        right
    >
      {{ snackbar.message }}
      <template v-slot:action="{ attrs }">
        <v-btn
            color="white"
            text
            v-bind="attrs"
            @click="snackbar.show = false"
        >
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useUserStore } from '~/stores/userStore';
import AdminInfo from '~/components/userAndAdmin/AdminInfo.vue';
import { useApi } from '~/composables/useApi';

/**
 * Хранилище пользователя
 */
const userStore = useUserStore();

/**
 * Простой пример локального Snackbar:
 * (Можно вынести в свой composable, если хотите переиспользовать)
 */
const snackbar = reactive({
  show: false,
  message: '',
  color: 'info',
  timeout: 1500,
});

/**
 * Вызов метода API.
 * Предполагаем, что у вас есть useApi с методом apiRequest
 */
const { apiRequest } = useApi();

/**
 * Ссылка на ваш канал
 */
const channelLink = 'https://t.me/training_health';

/**
 * Открыть канал в новой вкладке
 */
const goToChannel = () => {
  window.open(channelLink, '_blank');
};


/**
 * Ручная проверка подписки (по кнопке):
 * Делает POST на /check-user, передаёт { telegramId }, сервер возвращает { role }.
 */
const checkSubscription = async () => {
  try {
    // Если админ, ничего не меняем
    if (userStore.role === 'admin') {
      showSnackbar('Вы администратор, статус не меняется.', 'warning');
      return;
    }

    // Запрос к вашему маршруту /check-user
    const result = await apiRequest<{ role?: string; error?: string }>(
        'post',
        'check-user',
        { telegramId: userStore.telegramId }
    );

    // Если вернулась роль
    if (result.role) {
      userStore.setRole(result.role as 'admin' | 'freeUser' | 'paidUser');

      if (result.role === 'paidUser') {
        showSnackbar('Подтверждаю подписку! У тебя полный доступ.', 'success');
      } else if (result.role === 'freeUser') {
        showSnackbar('Похоже, вы не подписаны на канал.', 'error');
      } else {
        showSnackbar('Роль: администратор.', 'info');
      }
    } else if (result.error) {
      console.error('Ошибка сервера:', result.error);
      showSnackbar('Ошибка сервера: ' + result.error, 'error');
    }
  } catch (error: any) {
    console.error('Ошибка при проверке подписки:', error);
    showSnackbar('Ошибка при проверке подписки, обратитесь к разработчику.', 'error');
  }
};

/**
 * Удобная функция для отображения сообщений в Snackbar
 */
function showSnackbar(message: string, color: 'success' | 'error' | 'info' | 'warning' = 'info') {
  snackbar.message = message;
  snackbar.color = color;
  snackbar.show = true;
}

/**
 * Роль пользователя в читабельном виде
 */
const roleDisplay = computed(() => {
  switch (userStore.role) {
    case 'admin':
      return 'Администратор';
    case 'paidUser':
      return 'Подписка на канал активна';
    case 'freeUser':
      return 'Без подписки на канал';
    default:
      return 'Неизвестно';
  }
});
</script>

<style scoped>
.upgrade-section {
  margin-top: 20px;
}
.paid-user-section {
  margin-top: 20px;
}
</style>
