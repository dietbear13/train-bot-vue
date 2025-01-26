<template>
  <v-app>
    <!-- Шапка с названием блога -->
    <v-app-bar
        color="primary"
        dark
        elevated
    >
    </v-app-bar>

    <!-- Основная часть -->
    <v-main>
      <v-container class="py-4">
        <v-row>
          <!-- Отображение дочернего компонента BlogCard -->
          <v-toolbar-title>Блог</v-toolbar-title>
          <!-- Кнопка видима только для admin -->
          <v-btn
              v-if="isAdmin"
              color="primary"
              class="ma-2"
              @click="openAdminPanel"
          >
            Открыть Админку Блога
          </v-btn>

    <BlogCard />
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '../stores/userStore'; // Импорт вашего Pinia-хранилища
import BlogCard from '../components/blog/BlogCard.vue';

// Подключаем хранилище
const userStore = useUserStore();

// Проверяем, является ли пользователь администратором
const isAdmin = computed(() => userStore.role === 'admin');

// Метод для открытия админки
const openAdminPanel = () => {
  console.log('Админка открыта!'); // Замените на ваш функционал, например, переход на страницу админки
};
</script>

<style scoped>
/* Ваши стили, если нужны */
</style>
