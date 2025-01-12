<!-- PaidUserInfo.vue -->
<template>
  <div class="paid-section">
    <p>Вы уже подписаны на канал. Спасибо за поддержку!</p>
    <a :href="channelLink" target="_blank">Перейти в канал</a>
    <!-- Добавьте дополнительный контент для paidUser -->
  </div>
</template>

<script setup lang="ts">
const channelLink = 'https://t.me/training_health';
</script>

<style scoped>
.paid-section {
  margin-top: 20px;
}
</style>
