<template>
  <v-card style="border-radius: 16px" flat class="my-2">
    <KbzhuCardProfile :kbzhu="latestKbzhuResult" :timestamp="latestKbzhuTimestamp" />
  </v-card>

  <!-- Кнопка для перехода к сохранённым тренировкам -->
  <v-btn
      block
      color="primary"
      class="my-3"
      elevation="1"
      rounded="xl"
      @click="showSavedWorkouts = true"
  >
    📋 Сохранённые тренировки
  </v-btn>

  <!-- Подключаем новый компонент и связываем диалог с помощью v-model -->
  <WorkoutsCardProfile
      v-model="showSavedWorkouts"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '../../composables/useApi';
import { useUserStore } from '../../stores/userStore';
import WorkoutsCardProfile from './WorkoutsCardProfile.vue';
import KbzhuCardProfile from "../nutrition/KbzhuCardProfile.vue";

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
const showSavedWorkouts = ref(false);

onMounted(async () => {
  try {
    const response = await apiRequest<{ users?: IUser[]; error?: string }>(
        'get',
        'users'
    );

    if (!response.users) {
      console.error('ProfileAdmin Ответ не содержит массива users');
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

const latestKbzhuResult = computed(() => userKbzhu.value); // ✅ Связываем с userKbzhu
const latestKbzhuTimestamp = computed(() => userTimestamp.value); // ✅ Связываем с userTimestamp

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
