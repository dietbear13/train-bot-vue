<template>
  <v-container>
    <h2 class="my-2">Профиль</h2>

    <div v-if="userStore.role" class="mb-2">
      <p>Ваш Telegram ID: {{ userStore.telegramId }}</p>
      <p>{{ roleDisplay }}</p>
    </div>

    <!-- Секция для admin -->
    <v-card
        v-if="userStore.role === 'admin'"
        style="border-radius: 16px"
        flat
    >
      <!-- ИСПРАВЛЕНО: проверяем, есть ли данные в kbzhuHistory -->
      <KbzhuCardProfile
          :kbzhu="latestKbzhuResult"
          :timestamp="latestKbzhuTimestamp"
      />
    </v-card>

    <!-- Секция для paidUser -->
    <div v-else-if="userStore.role === 'paidUser'">
      <v-card
          class="mb-1"
          style="border-radius: 16px"
          flat
      >
        <!-- ИСПРАВЛЕНО: проверяем, есть ли данные в kbzhuHistory -->
        <KbzhuCardProfile
            v-if="userStore.role === 'paidUser'"
            :kbzhu="latestKbzhuResult"
            :timestamp="latestKbzhuTimestamp"
        />

        <v-card-text>
          <p>
            Читай наш канал кОчалка.
          </p>
          <v-btn color="primary" @click="goToChannel" class="my-2">
            Перейти в канал
          </v-btn>
        </v-card-text>
      </v-card>
    </div>

    <!-- Секция для freeUser -->
    <div v-else-if="userStore.role === 'freeUser'" class="upgrade-section">
      <v-card class="mb-2">
        <v-card-text>
          <p>
            Подпишись на мой канал кОчалка, чтобы получить
            полный функционал.
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
import KbzhuCardProfile from '~/components/nutrition/KbzhuCardProfile.vue';
import { useApi } from '~/composables/useApi';
import 'dotenv';

/**
 * Хранилище пользователя
 */
const userStore = useUserStore();

/**
 * Простой пример локального Snackbar
 */
const snackbar = reactive({
  show: false,
  message: '',
  color: 'info',
  timeout: 1500,
});

interface IKbzhuHistory {
  kbzhuResult: {
    calories: number;
    extraCalories: number;
    proteins: number;
    fats: number;
    carbs: number;
  };
  timestamp: number; // UNIX timestamp
}

/**
 * Вызов метода API (если нужен для других запросов).
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

    const result = await apiRequest<{ role?: string; error?: string }>(
        'post',
        'check-user',
        { telegramId: userStore.telegramId }
    );

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
    showSnackbar(
        'Ошибка при проверке подписки, обратитесь к разработчику.',
        'error'
    );
  }
};

/**
 * Удобная функция для отображения сообщений в Snackbar
 */
function showSnackbar(
    message: string,
    color: 'success' | 'error' | 'info' | 'warning' = 'info'
) {
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

/**
 * Получение последнего результата КБЖУ
 */
const latestKbzhuResult = computed(() => {
  if (userStore.kbzhuHistory && userStore.kbzhuHistory.length > 0) {
    const sortedHistory = [...userStore.kbzhuHistory].sort(
        (a, b) => b.timestamp - a.timestamp
    );
    console.log('++ sortedHistory', sortedHistory);
    return sortedHistory[0].kbzhu; // <-- используем kbzhu, а не kbzhuResult
  }
  return null;
});

/**
 * Получение timestamp последнего результата КБЖУ
 */
const latestKbzhuTimestamp = computed(() => {
  if (userStore.kbzhuHistory && userStore.kbzhuHistory.length > 0) {
    const sortedHistory = [...userStore.kbzhuHistory].sort(
        (a, b) => b.timestamp - a.timestamp
    );
    return sortedHistory[0].timestamp;
  }
  return null;
});
</script>

<style scoped>
.upgrade-section {
  margin-top: 20px;
}
</style>
