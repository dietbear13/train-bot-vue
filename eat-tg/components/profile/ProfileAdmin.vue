<template>
  <v-card style="border-radius: 16px" flat class="my-2">
    <KbzhuCardProfile :kbzhu="latestKbzhuResult" :timestamp="latestKbzhuTimestamp" />
  </v-card>

  <!-- Кнопка для сохранённых тренировок -->
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

  <!-- Кнопка для стены тренировок -->
  <v-btn
      block
      color="red"
      class="my-3"
      elevation="1"
      rounded="xl"
      @click="showWall = true"
  >
    🔥 Стена тренировок
  </v-btn>

  <!-- Диалог для стены тренировок -->
  <v-dialog v-model="showWall" fullscreen>
    <v-card>
      <v-toolbar dense dark color="primary">
        <v-btn icon @click="showWall = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>🔥 Стена тренировок</v-toolbar-title>
      </v-toolbar>
      <WallMain />
    </v-card>
  </v-dialog>

  <!-- Подключаем сохранённые тренировки -->
  <WorkoutsCardProfile v-model="showSavedWorkouts" />
</template>

<script setup>
import { ref } from "vue";
import WorkoutsCardProfile from "./WorkoutsCardProfile.vue";
import KbzhuCardProfile from "../nutrition/KbzhuCardProfile.vue";
import WallMain from "../wall/WallMain.vue";

const showSavedWorkouts = ref(false);
const showWall = ref(false); // Флаг для открытия стены тренировок
</script>
