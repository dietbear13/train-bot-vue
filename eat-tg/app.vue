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
import UserInit from './components/shared/UserInit.vue';
import { useUserStore } from './stores/userStore'

const loading = ref(true);

const { apiRequest } = useApi()

const userStore = useUserStore()


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

  // TODO ВКЛЮЧИТЬ! Отключение контекстного меню
  // document.addEventListener('contextmenu', (e) => {
  //   e.preventDefault();
  // }, false);

  // После инициализации приложения скрываем загрузку
  loading.value = false;
});
</script>

<style>
/* Запрет выделения текста на всех элементах */
* {
  -webkit-user-select: none; /* Chrome, Safari, Opera */
  -moz-user-select: none;    /* Firefox */
  -ms-user-select: none;     /* IE 10+ */
  user-select: none;         /* Стандарт */
}
</style>
