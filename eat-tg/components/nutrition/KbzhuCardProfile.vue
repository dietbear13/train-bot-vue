<template>
  <v-card class="mb-4 elevation-3">
    <v-card-title class="primary white--text mt-2">
      <v-icon left>mdi-food</v-icon>
      Ваши КБЖУ

      <!-- Дата, если есть timestamp -->
      <div class="text-right" v-if="userTimestamp">
        <v-chip color="white" text-color="darkgray">
          {{ formattedDate }}
        </v-chip>
      </div>
    </v-card-title>

    <v-card-text v-if="isLoading">
      <p>Загрузка данных...</p>
    </v-card-text>

    <v-card-text v-else-if="userKbzhu">
      <v-list dense>
        <v-list-item>
          <v-list-item-title>Калории</v-list-item-title>
          <v-list-item-subtitle>{{ userKbzhu.calories }} ккал</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title>Доп. Калории</v-list-item-title>
          <v-list-item-subtitle>{{ userKbzhu.extraCalories }} ккал</v-list-item-subtitle>
        </v-list-item>

        <v-divider class="my-3"></v-divider>

        <v-list-item>
          <v-list-item-title>Белки</v-list-item-title>
          <v-list-item-subtitle>{{ userKbzhu.proteins }} г</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title>Жиры</v-list-item-title>
          <v-list-item-subtitle>{{ userKbzhu.fats }} г</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title>Углеводы</v-list-item-title>
          <v-list-item-subtitle>{{ userKbzhu.carbs }} г</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-card-text v-else>
      <p>Данные о КБЖУ не найдены.</p>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';
import { useUserStore } from '~/stores/userStore';

/**
 * Описание структуры результата КБЖУ, которую возвращает сервер
 */
interface IKbzhuResult {
  calories: number;
  extraCalories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

/**
 * Описание структуры одного элемента в kbzhuHistory
 */
interface IKbzhuHistoryItem {
  formData: Record<string, any>; // или более точный тип, если хотите
  kbzhuResult: IKbzhuResult;
  timestamp: number;
  _id: string;
}

/**
 * Описание структуры пользователя на сервере
 */
interface IUser {
  _id: string;
  telegramId: number;
  role: string;
  dateAdded: number;
  kbzhuHistory: IKbzhuHistoryItem[];
  referrals: any[];
}

/**
 * Подтягиваем необходимые инструменты
 */
const { apiRequest } = useApi();
const userStore = useUserStore();

/**
 * Локальные реактивные переменные для хранения последнего КБЖУ и timestamp
 */
const userKbzhu = ref<IKbzhuResult | null>(null);
const userTimestamp = ref<number | null>(null);
const isLoading = ref<boolean>(true);

/**
 * При монтировании компонента выполним GET-запрос /users,
 * найдём нашего (текущего) пользователя по userStore.telegramId
 * и возьмём у него последний по времени элемент из kbzhuHistory.
 */
onMounted(async () => {
  try {
    // Тип ответа от сервера: { users: IUser[], ... }
    const response = await apiRequest<{ users?: IUser[]; error?: string }>(
        'get',
        'users'
    );

    if (!response.users) {
      console.error('Ответ не содержит массива users');
      return;
    }

    // Ищем пользователя с тем же telegramId, что в userStore
    const currentUser = response.users.find(
        (u) => u.telegramId === userStore.telegramId
    );
    if (!currentUser) {
      console.warn('Текущий пользователь не найден в списке /users');
      return;
    }

    // У пользователя смотрим kbzhuHistory
    if (currentUser.kbzhuHistory && currentUser.kbzhuHistory.length > 0) {
      // Сортируем от более нового к более старому
      const sortedHistory = [...currentUser.kbzhuHistory].sort(
          (a, b) => b.timestamp - a.timestamp
      );
      // Берём самый свежий
      userKbzhu.value = sortedHistory[0].kbzhuResult;
      userTimestamp.value = sortedHistory[0].timestamp;
    }
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
  } finally {
    isLoading.value = false;
  }
});

/**
 * Вычисляем форматированную дату из userTimestamp
 */
const formattedDate = computed(() => {
  if (!userTimestamp.value) return '';
  // Обратите внимание, здесь timestamp в БД может быть в секундах или миллисекундах.
  // Судя по вашему примеру, там очень большое число (например 1737137089666),
  // значит, это уже миллисекунды. Если сервер хранит в секундах, домножайте * 1000.
  const date = new Date(userTimestamp.value);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});
</script>

<style scoped>
.primary {
  background-color: #3f51b5 !important;
}

.v-chip {
  font-weight: bold;
}
</style>
