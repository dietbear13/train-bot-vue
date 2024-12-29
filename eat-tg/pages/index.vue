<!-- pages/index.vue (ex. training) -->
<template>
  <v-container class="training-container">
    <!-- Настройка v-tabs с дополнительными пропсами для улучшенной адаптивности -->
    <v-tabs
        v-model="activeTab"
        background-color="transparent"
        dark
        fixed-tabs
        grow
        mobile-breakpoint="md"
        direction="horizontal"
        align-tabs="center"
        hide-slider
        class="custom-tabs"
    >
      <v-tab
          class="custom-tab px-1"
          style="border-radius: 16px"
          :class="{ 'active-tab': activeTab === 0 }"
      >
        Прога на неделю
      </v-tab>

      <v-tab
          class="custom-tab px-1"
          style="border-radius: 16px"
          :class="{ 'active-tab': activeTab === 1 }"
      >
        На одну мышцу
      </v-tab>
      <v-tab
          class="custom-tab px-1"
          style="border-radius: 16px"
          :class="{ 'active-tab': activeTab === 2 }"
      >
        Вики
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab">
      <v-tabs-window-item>
        <TrainingOnWeek />
      </v-tabs-window-item>
      <v-tabs-window-item>
        <TrainingByMuscles />
      </v-tabs-window-item>
      <v-tabs-window-item>
        <ExerciseSearch />
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- Подключение компонента HowToUse -->
    <HowToUse />
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TrainingOnWeek from '~/components/TrainingOnWeek.vue'
import TrainingByMuscles from '~/components/TrainingByMuscles.vue'
import ExerciseSearch from "~/components/ExerciseSearch.vue"
import HowToUse from '~/components/HowToUseGenerator.vue' // Импортируем компонент HowToUse

// Инициализация активной вкладки с типизацией
const activeTab = ref<number>(0)
</script>

<style scoped>
.active-tab {
  color: #ffffff !important; /* Белый цвет текста активной вкладки */
  background-color: #43a047; /* Цвет фона активной вкладки */
}

.v-tab.v-tab.v-btn {
  border-top: 16px;
}

.custom-tabs {
  border-radius: 16px;
  background-color: darkslategray;
}

.custom-tab {
  border-radius: 16px;
}
</style>
