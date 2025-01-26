<!-- app.vue -->

<template>
<!--  <div style="height: 80px"></div>-->
    <UserInit />
    <NuxtLayout>
      <v-app>
        <NuxtPage />
      </v-app>
    </NuxtLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import './assets/global.css'; // Импорт глобальных стилей
import UserInit from './components/userAndAdmin/UserInit.vue';

const loading = ref(true);

onMounted(() => {
  // Ваш код для обработки событий touchstart и gesturestart
  document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  });
  document.addEventListener('gesturestart', function(event) {
    event.preventDefault();
  });

  // После инициализации приложения скрываем загрузку
  loading.value = false;
});
</script>

<style scoped>
/* Ваши стили остаются без изменений */
</style>
