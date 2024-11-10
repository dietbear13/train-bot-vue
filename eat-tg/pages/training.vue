<!-- pages/training.vue -->
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
        class="custom-tab"
        :class="{ 'active-tab': activeTab === 0 }"
    >
      На одну мышцу
    </v-tab>
    <v-tab
        class="custom-tab"
        :class="{ 'active-tab': activeTab === 1 }"
    >
      По уровню сложности
    </v-tab>
    </v-tabs>


    <v-tabs-window v-model="activeTab">
      <v-tabs-window-item>
        <v-card flat>
          <TrainingByMuscles />
        </v-card>
      </v-tabs-window-item>
      <v-tabs-window-item>
        <v-card flat>
          <TrainingByLevel />
        </v-card>
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
.training-container {
  padding: 16px;
  background-color: #121212; /* Тёмный фон контейнера */
  border-radius: 12px;
}

/* Настройка v-tabs */
.custom-tabs {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1); /* Лёгкая граница снизу */
}

/* Стилизация отдельных вкладок */
.custom-tab {
  color: #b0bec5; /* Светло-серый цвет текста */
  font-weight: 500;
  font-size: 16px;
  padding: 8px 12px;
  margin: 0 1px; /* Минимальные горизонтальные отступы */
  transition: background-color 0.3s, color 0.3s;
  border-radius: 4px;
}

/* Выделение активной вкладки */
.active-tab {
  color: #ffffff !important; /* Белый цвет текста активной вкладки */
  background-color: #43a047; /* Цвет фона активной вкладки */
}

/* Эффект наведения на вкладки */
.custom-tab:hover {
  background-color: rgba(67, 160, 71, 0.2); /* Светлый зелёный фон при наведении */
  color: #ffffff;
}

/* Стилизация содержимого вкладок */
.v-tabs-items {
  margin-top: 16px;
}

.v-tab-item {
  background-color: #1e1e1e; /* Тёмный фон содержимого вкладок */
  border-radius: 8px;
  padding: 16px;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 800px) {
  .custom-tab {
    font-size: 14px;
    padding: 6px 8px;
    margin: 0 0.5px;
  }

  .active-tab {
    font-size: 14px;
  }
}
</style>
