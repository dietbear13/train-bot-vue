<template>
  <v-container>
    <v-card class="py-1">
      <v-card-title>🔥 Стена тренировок</v-card-title>
      <v-card-subtitle>
        Отмечайте понравившиеся тренировки и сохраняйте в свой профиль.
      </v-card-subtitle>

      <!--
        Компонент, который реально рисует список тренировок (список карточек или что-то ещё).
        Его вы тоже упоминали как WallList.vue
      -->
      <WallList
          class="mt-2"
          :workouts="sortedWorkouts"
          @like="handleLike"
          @save="handleSave"
      />
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import WallList from './WallList.vue';
import { useWallStore } from '~/stores/wallStore';

const wallStore = useWallStore();



/**
 * Вычисленное свойство, которое возвращает
 * список тренировок, отсортированных по лайкам (из wallStore)
 */
const sortedWorkouts = computed(() => {
  return wallStore.sortedWorkouts;
});

/**
 * Обработка лайка — вызываем метод из wallStore
 */
function handleLike(workoutId: string) {
  wallStore.handleLike(workoutId);
}

/**
 * Обработка сохранения — вызываем метод из wallStore
 */
function handleSave(workoutId: string) {
  wallStore.handleSave(workoutId);
}
</script>

<style scoped>
/* Ваши стили, если нужны */
</style>
