<!-- pages/blog.vue -->
<template>
  <v-app>
    <v-app-bar color="primary" dark elevated>
      <v-toolbar-title>Блог</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <v-container class="py-4">
        <v-row>
          <BlogCard />
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import BlogCard from '../components/blog/BlogCard.vue'
</script>

<style scoped>
/* Ваши стили, если нужны */
</style>
