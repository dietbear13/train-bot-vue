<!-- pages/training.vue -->
<template>
  <v-container>
    <h2 class="my-4">Тренировки</h2>
    <v-tabs v-model="activeTab" background-color="primary" dark>
      <v-tab>По уровню сложности</v-tab>
      <v-tab>По мышечным группам</v-tab>
    </v-tabs>

    <v-tabs-items v-model="activeTab">
      <v-tab-item>
        <TrainingByLevel />
      </v-tab-item>
      <v-tab-item>
        <TrainingByMuscles />
      </v-tab-item>
    </v-tabs-items>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import TrainingByLevel from '~/components/TrainingByLevel.vue'
import TrainingByMuscles from '~/components/TrainingByMuscles.vue'

const activeTab = ref(0)
</script>

<style scoped>
/* Стили для страницы тренировок */
</style>
