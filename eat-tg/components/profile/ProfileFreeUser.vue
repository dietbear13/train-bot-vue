<template>
  <div class="upgrade-section">
    <v-card class="mb-2">
      <v-card-text>
        <p>
          Подпишись на канал кОчалка, чтобы получить полный функционал бота.
          Там рассказываю как превратить набор упражнений в программе в план действий.
        </p>
        <v-btn color="primary" @click="goToChannel" class="my-2" rounded="xl">
          Перейти в канал
        </v-btn>
      </v-card-text>
      <v-btn color="success" @click="checkSubscription" class="my-2" rounded="xl">
        Проверить подписку
      </v-btn>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '../../stores/userStore';
import { useApi } from '../../composables/useApi';

const userStore = useUserStore();
const { apiRequest } = useApi();
const channelLink = 'https://t.me/training_health';

const goToChannel = () => {
  window.open(channelLink, '_blank');
};

const checkSubscription = async () => {
  try {
    if (userStore.role === 'admin') {
      alert('Вы администратор, статус не меняется.');
      return;
    }

    const result = await apiRequest<{ role?: string; error?: string }>('post', 'check-user', {
      telegramId: userStore.telegramId,
    });

    if (result.role) {
      userStore.setRole(result.role as 'admin' | 'freeUser' | 'paidUser');
      alert(result.role === 'paidUser' ? 'Подтверждаю подписку! У тебя полный доступ.' : 'Похоже, вы не подписаны.');
    } else if (result.error) {
      console.error('Ошибка сервера:', result.error);
      alert('Ошибка сервера: ' + result.error);
    }
  } catch (error) {
    console.error('Ошибка при проверке подписки:', error);
    alert('Ошибка при проверке подписки, обратитесь к разработчику.');
  }
};
</script>

<style scoped>
.upgrade-section {
  margin-top: 20px;
}
</style>
