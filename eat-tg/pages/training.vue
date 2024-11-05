<!-- pages/training.vue -->
<template>
  <v-container>
    <!-- Настройка v-tabs с дополнительными пропсами для улучшенной адаптивности -->
    <v-tabs
        v-model="activeTab"
        background-color="primary"
        dark
        fixed-tabs
        grow
        mobile-breakpoint="md"
        direction="horizontal"
        align-tabs="center"
        hide-slider
    >
      <v-tab>На одну мышцу</v-tab>
      <v-tab>По уровню сложности</v-tab>
    </v-tabs>

    <!-- Контейнер для содержимого вкладок -->
    <v-tabs-window v-model="activeTab">
      <v-tabs-window-item>
        <TrainingByMuscles />
      </v-tabs-window-item>
      <v-tabs-window-item >
        <TrainingByLevel />
      </v-tabs-window-item>
    </v-tabs-window>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TrainingByLevel from '~/components/TrainingByLevel.vue'
import TrainingByMuscles from '~/components/TrainingByMuscles.vue'

// Инициализация активной вкладки с типизацией
const activeTab = ref<number>(0)
</script>

<style scoped>
/* Стили для страницы тренировок */
/* Можно добавить дополнительные стили для улучшения внешнего вида */
.v-container {
  padding: 16px;
}

.v-tab-panels {
  width: 100%;
}

</style>
