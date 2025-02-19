<template>
  <v-container>
    <v-card class="pa-5">
      <v-card-title>🔥 Стена тренировок</v-card-title>
      <v-card-subtitle>Выберите тренировку, чтобы сохранить или лайкнуть</v-card-subtitle>

      <WallList :workouts="sortedWorkouts" @like="handleLike" @save="handleSave" />
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed } from "vue";
import WallList from "./WallList.vue";
import { useUserStore } from "../../stores/userStore";

const userStore = useUserStore();

// Загружаем тренировки всех пользователей с isSended = true
const allWorkouts = computed(() => {
  return userStore.allUsers
      .flatMap(user => user.trainingHistory.filter(w => w.isSended === true));
});

// Сортируем по лайкам
const sortedWorkouts = computed(() => {
  return allWorkouts.value.sort((a, b) => (b.likes || 0) - (a.likes || 0));
});

const handleLike = (workoutId) => {
  // Логика лайка (API-запрос)
};

const handleSave = (workoutId) => {
  // Проверяем, есть ли уже в сохранённых
  if (!userStore.savedWorkouts.some(w => w._id === workoutId)) {
    userStore.savedWorkouts.push(workoutId);
  }
};
</script>
