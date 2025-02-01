<!-- app.vue -->
<template>
  <UserInit />
  <NuxtLayout>
    <v-app>
      <NuxtPage />
    </v-app>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import './assets/global.css'; // Здесь можно хранить глобальные стили, например для user-select
import UserInit from './components/userAndAdmin/UserInit.vue';

const loading = ref(true);

onMounted(() => {
  // Предотвращение двойного тапа (мобильные устройства)
  let lastTap = 0;
  document.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapGap = currentTime - lastTap;
    if (tapGap > 0 && tapGap < 300) { // 300 мс — порог, можно корректировать
      e.preventDefault();
    }
    lastTap = currentTime;
  }, false);

  // Предотвращение двойного клика (для десктопа)
  let lastClick = 0;
  document.addEventListener('click', (e) => {
    const currentTime = new Date().getTime();
    const clickGap = currentTime - lastClick;
    if (clickGap > 0 && clickGap < 300) {
      e.preventDefault();
    }
    lastClick = currentTime;
  }, false);

  // Отключение жестов (например, pinch-zoom)
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  }, false);

  // Отключение контекстного меню (частично для защиты от скриншотов)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  }, false);

  // После инициализации приложения скрываем загрузку
  loading.value = false;
});
</script>

<!-- Можно использовать глобальные стили, но если хотите применить их именно к app.vue,
     то удалите атрибут scoped, чтобы правило было глобальным -->
<style>
/* Запрет выделения текста на всех элементах */
* {
  -webkit-user-select: none; /* Chrome, Safari, Opera */
  -moz-user-select: none;    /* Firefox */
  -ms-user-select: none;     /* IE 10+ */
  user-select: none;         /* Стандарт */
}
</style>
