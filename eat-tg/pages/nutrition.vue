<!-- pages/nutrition.vue -->
<template>
  <v-container class="nutrition-container">
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
          class="custom-tab"
          :class="{ 'active-tab': activeTab === 0 }"
      >
        Советы
      </v-tab>
      <v-tab
          class="custom-tab"
          :class="{ 'active-tab': activeTab === 1 }"
      >
        Калькулятор КБЖУ
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab">
      <v-tabs-window-item>
          <NutritionAdvice />
      </v-tabs-window-item>
      <v-tabs-window-item class="px-3">
          <KbzhuCalculator />
      </v-tabs-window-item>
    </v-tabs-window>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NutritionAdvice from '~/components/NutritionAdvice.vue'
import KbzhuCalculator from '~/components/KbzhuCalculator.vue'

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

</style>
