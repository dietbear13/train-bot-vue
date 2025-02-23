<template>
<!--  TODO убрать подложку background у v-card-->
    <v-card class="py-1">
      <v-card-title>🔥 Стена тренировок</v-card-title>
      <v-card-subtitle>
        Отмечайте понравившиеся тренировки и сохраняйте в свой профиль.
      </v-card-subtitle>

      <!--
        В props передаём отсортированный по лайкам массив
        (или можете хранить сортировку прямо в сторе геттером).
      -->
      <WallList
          :workouts="sortedWorkouts"
          @like="handleLike"
          @save="handleSave"
      />
    </v-card>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useWallStore } from '~/stores/wallStore';
import WallList from './WallList.vue';

const wallStore = useWallStore();

onMounted(async () => {
  await wallStore.fetchWorkouts();
});

const sortedWorkouts = computed(() => {
  // Если хотите, можно завести геттер `sortedWorkouts` прямо в wallStore.
  return [...wallStore.workouts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
});

function handleLike(workoutId: string) {
  // вызываем метод в store или сами делаем API-запрос
  wallStore.handleLike(workoutId);
}

function handleSave(workoutId: string) {
  wallStore.handleSave(workoutId);
}
</script>
