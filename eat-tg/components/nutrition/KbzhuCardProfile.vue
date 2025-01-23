<template style="border-radius: 16px">
  <v-card
      class="mb-0"
      style="border-radius: 16px"
      flat
  >
    <!-- Заголовок с иконкой и датой, если есть -->
    <v-card-title class="primary white--text mb-2">
      <v-icon left>mdi-food</v-icon>
      Ваши КБЖУ
        <v-chip
            color="white"
            text-color="darkgray"
            style="justify-content: right;"
            v-if="userTimestamp"
        >
          {{ formattedDate }}
        </v-chip>
    </v-card-title>

    <!-- Если идёт загрузка -->
    <v-card-text v-if="isLoading">
      <v-progress-linear
          color="#1976d2"
          indeterminate
      ></v-progress-linear>
    </v-card-text>

    <!-- Если данные KБЖУ получены -->
    <v-card-text v-else-if="userKbzhu">
      <!-- Строка (row) с Калориями и Доп. Калориями -->

      <v-row>
        <v-col>
          <div class="title-text">Калории</div>
          <div class="value-text">{{ userKbzhu.calories }} ккал</div>
        </v-col>
        <v-col>
          <div class="title-text">Доп. Калории</div>
          <div class="value-text">{{ userKbzhu.extraCalories }} ккал</div>
        </v-col>
      </v-row>

      <v-divider class="my-3"></v-divider>

      <!-- Строка (row) с Белками, Жирами и Углеводами -->
      <v-row>
        <v-col>
          <div class="title-text">Белки</div>
          <div class="value-text">{{ userKbzhu.proteins }} г</div>
        </v-col>
        <v-col>
          <div class="title-text">Жиры</div>
          <div class="value-text">{{ userKbzhu.fats }} г</div>
        </v-col>
        <v-col>
          <div class="title-text">Углеводы</div>
          <div class="value-text">{{ userKbzhu.carbs }} г</div>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Если данных нет -->
    <v-card-text v-else>
      <p>Данные о КБЖУ не найдены.</p>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';
import { useUserStore } from '~/stores/userStore';

interface IKbzhuResult {
  calories: number;
  extraCalories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

interface IKbzhuHistoryItem {
  formData: Record<string, any>;
  kbzhuResult: IKbzhuResult;
  timestamp: number;
  _id: string;
}

interface IUser {
  _id: string;
  telegramId: number;
  role: string;
  dateAdded: number;
  kbzhuHistory: IKbzhuHistoryItem[];
  referrals: any[];
}

const { apiRequest } = useApi();
const userStore = useUserStore();

const userKbzhu = ref<IKbzhuResult | null>(null);
const userTimestamp = ref<number | null>(null);
const isLoading = ref<boolean>(true);

onMounted(async () => {
  try {
    const response = await apiRequest<{ users?: IUser[]; error?: string }>(
        'get',
        'users'
    );

    if (!response.users) {
      console.error('Ответ не содержит массива users');
      return;
    }

    const currentUser = response.users.find(
        (u) => u.telegramId === userStore.telegramId
    );
    if (!currentUser) {
      console.warn('Текущий пользователь не найден в списке /users');
      return;
    }

    if (currentUser.kbzhuHistory && currentUser.kbzhuHistory.length > 0) {
      const sortedHistory = [...currentUser.kbzhuHistory].sort(
          (a, b) => b.timestamp - a.timestamp
      );
      userKbzhu.value = sortedHistory[0].kbzhuResult;
      userTimestamp.value = sortedHistory[0].timestamp;
    }
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
  } finally {
    isLoading.value = false;
  }
});

const formattedDate = computed(() => {
  if (!userTimestamp.value) return '';
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
  background-color: #43a047 !important;
  border-radius: 16px;
}

/* Пример: заголовки немного меньше, значения чуть крупнее */
.title-text {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.value-text {
  font-size: 16px;
  font-weight: 600;
}
</style>
