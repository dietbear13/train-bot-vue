<!-- pages/index.vue (ex. training) -->
<template>
  <!-- Компонент TrainingTabs отвечает за отображение и логику табов -->
  <TrainingTabs />
<!--  <p>12412412</p>-->
</template>

<script setup lang="ts">
import TrainingTabs from '../components/training/TrainingTabs.vue'
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

.training-container {

}
</style>
