<template>
  <v-card style="border-radius: 16px" flat class="my-2">
    <KbzhuCardProfile :kbzhu="latestKbzhuResult" :timestamp="latestKbzhuTimestamp" />
  </v-card>

  <!-- Кнопка для перехода к сохранённым тренировкам -->
  <v-btn
      block
      color="primary"
      class="my-3"
      size="large"
      elevation="1"
      rounded="pills"
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
import { ref } from 'vue';
import WorkoutsCardProfile from './WorkoutsCardProfile.vue';
import KbzhuCardProfile from "../nutrition/KbzhuCardProfile.vue";
// Путь поправьте под реальную структуру

// Локальный стейт, чтобы управлять BottomSheet
const showSavedWorkouts = ref(false);
</script>
