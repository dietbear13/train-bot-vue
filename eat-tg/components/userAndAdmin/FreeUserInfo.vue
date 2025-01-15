<!-- FreeUserInfo.vue -->
<template>
  <div class="upgrade-section">
    <p><v-icon color="#B32821">mdi-warning</v-icon> используете бесплатную версию. <a href="#" @click.prevent="upgrade">Обновить до платной версии</a>.</p>
    <!-- Добавьте дополнительный контент для freeUser -->
  </div>
</template>

<script setup lang="ts">
const upgrade = () => {
  // Логика апгрейда до paidUser
  // Например, перенаправление на страницу оплаты
  window.location.href = '/upgrade';
};
</script>

<style scoped>
.upgrade-section {
  margin-top: 20px;
}
</style>
