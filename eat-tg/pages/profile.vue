<template>
  <v-container>
    <h2 class="my-2">Профиль</h2>

    <div v-if="userStore.role" class="mb-2">
      <p>Ваш Telegram ID: {{ userStore.telegramId }}</p>
      <p>{{ roleDisplay }}</p>
    </div>

    <ProfileAdmin v-if="userStore.role === 'admin'" />
    <ProfilePaidUser v-else-if="userStore.role === 'paidUser'" />
    <ProfileFreeUser v-else-if="userStore.role === 'freeUser'" />

    <DonatStarsComponent />
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '../stores/userStore';
import ProfileAdmin from '../components/profile/ProfileAdmin.vue';
import ProfilePaidUser from '../components/profile/ProfilePaidUser.vue';
import ProfileFreeUser from '../components/profile/ProfileFreeUser.vue';
import DonatStarsComponent from '../components/shared/DonatStarsComponent.vue';

const userStore = useUserStore();

const roleDisplay = computed(() => {
  switch (userStore.role) {
    case 'admin':
      return 'Администратор';
    case 'paidUser':
      return 'Подписан на канал';
    case 'freeUser':
      return 'Не подписан на канал';
    default:
      return 'Неизвестно';
  }
});
</script>
