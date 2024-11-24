<!-- ~/pages/profile.vue -->

<template>
  <v-container>
    <h2 class="my-4">Профиль</h2>
    <div v-if="userStore.role">
      <p>Ваш Telegram ID: {{ userStore.telegramId }}</p>
      <p>Ваша роль: {{ userStore.role }}</p>
    </div>

    <AdminInfo v-if="userStore.role === 'admin'" />
  </v-container>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/userStore'
import AdminInfo from '~/components/AdminInfo.vue'

const userStore = useUserStore()
</script>

<style scoped>
/* Добавьте стили по необходимости */
</style>
