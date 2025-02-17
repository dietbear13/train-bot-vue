<template
    style="border-radius: 16px"
    class="mb-2"
>
  <v-card
      class="mb-2"
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
            style="align-content: flex-end"
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
          <div class="title-text" style="text-align: center">Всего калорий</div>
          <div class="value-text" style="text-align: center">{{ userKbzhu.calories }} ккал</div>
        </v-col>
        <v-col>
          <div class="title-text" style="text-align: center">Из которых от тренировок</div>
          <div class="value-text" style="text-align: center">{{ userKbzhu.extraCalories }} ккал</div>
        </v-col>
      </v-row>

      <v-divider class="my-3"></v-divider>

      <!-- Строка (row) с Белками, Жирами и Углеводами -->
      <v-row>
        <v-col style="text-align: center">
          <div class="title-text" style="text-align: center">Белки</div>
          <div class="value-text" style="text-align: center">{{ userKbzhu.proteins }} г</div>
        </v-col>
        <v-col>
          <div class="title-text" style="text-align: center">Жиры</div>
          <div class="value-text" style="text-align: center">{{ userKbzhu.fats }} г</div>
        </v-col>
        <v-col>
          <div class="title-text" style="text-align: center">Углеводы</div>
          <div class="value-text" style="text-align: center">{{ userKbzhu.carbs }} г</div>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Если данных нет -->
    <v-card-text v-else>
      <p>Чтобы отобразились данные, сделайте расчёт в калькуляторе.</p>
      <v-btn
          class="mt-2"
          to="/nutrition"
          color="primary"
          rounded="xl"
      >
        Перейти в калькулятор
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '../../composables/useApi';
import { useUserStore } from '../../stores/userStore';

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
      console.error('кбжу кард профиль - Ответ не содержит массива users');
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
