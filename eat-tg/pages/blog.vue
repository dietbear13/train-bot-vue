<template>
  <v-app>
    <!-- Шапка с названием блога -->
    <v-app-bar
        color="primary"
        dark
        elevated
    >
      <v-toolbar-title>Блог</v-toolbar-title>
    </v-app-bar>

    <!-- Основная часть -->
    <v-main>
      <v-container class="py-4">
        <v-row>
          <!-- Отображение дочернего компонента BlogCard -->
          <BlogCard />
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import BlogCard from './components/blog/BlogCard.vue' // Убедитесь, что путь корректен
</script>

<style scoped>
/* Ваши стили, если нужны */
</style>
