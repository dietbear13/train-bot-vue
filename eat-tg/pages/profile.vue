<!-- ~/pages/profile.vue -->

<template>
  <v-container>
    <h2 class="my-2">Профиль</h2>

    <div v-if="userStore.role">
      <p>Ваш Telegram ID: {{ userStore.telegramId }}</p>
      <p>Ваша роль: {{ userStore.role }}</p>
    </div>

    <!-- Секция для апгрейда до paidUser -->
    <div v-if="userStore.role === 'freeUser'" class="upgrade-section">
      <v-alert type="info" class="my-2">
        Чтобы воспользоваться полным функционалом бота и получить статус <strong>paidUser</strong>, пожалуйста, подпишитесь на наш Telegram канал.
      </v-alert>

      <v-card class="mb-4">
        <v-card-text>
          <p>
            Перейдите в наш канал <a :href="channelLink" target="_blank">@training_health</a> и подпишитесь.
          </p>
          <v-btn color="primary" @click="goToChannel" class="my-2">
            Перейти в канал
          </v-btn>
        </v-card-text>
      </v-card>

      <v-btn color="success" @click="checkSubscription">
        Проверить подписку
      </v-btn>

      <v-btn text @click="goBack" class="ml-2">
        Назад
      </v-btn>
    </div>

    <!-- Компонент AdminInfo для администраторов -->
    <AdminInfo v-if="userStore.role === 'admin'" />

    <!-- Snackbar для уведомлений -->
    <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="snackbar.timeout"
        top
        right
    >
      {{ snackbar.message }}
      <template v-slot:action="{ attrs }">
        <v-btn
            color="white"
            text
            v-bind="attrs"
            @click="snackbar.show = false"
        >
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '~/stores/userStore';
import AdminInfo from '~/components/AdminInfo.vue';
import axios from 'axios';

const userStore = useUserStore();

const channelLink = 'https://t.me/training_health';
const primaryBaseURL = 'https://fit-server-bot.ru.tuna.am/api/';

const goToChannel = () => {
  window.open(channelLink, '_blank');
};

const snackbar = ref({
  show: false,
  message: '',
  color: 'info', // Цвет уведомления: 'success', 'error', 'info', 'warning'
  timeout: 3000, // Время отображения в миллисекундах
});

const showSnackbar = (message: string, color: string = 'info') => {
  snackbar.value.message = message;
  snackbar.value.color = color;
  snackbar.value.show = true;
};

const checkSubscription = async () => {
  try {
    // Проверяем, не является ли пользователь администратором
    if (userStore.role === 'admin') {
      // Если пользователь администратор, не изменяем его статус
      showSnackbar('Вы являетесь администратором. Ваш статус не может быть изменен.', 'warning');
      return;
    }

    // Замените URL и логику на ваш фактический API-эндпоинт
    const response = await axios.post(`${primaryBaseURL}check-subscription`, {
      telegramId: userStore.telegramId,
    });

    if (response.data.isSubscribed) {
      // Обновляем роль пользователя в хранилище
      userStore.role = 'paidUser';

      // Показываем сообщение об успехе
      showSnackbar('Вижу твою подписку! Пользуйся полным функционалом и не отписывайся', 'success');

      // Дополнительно обновляем интерфейс, если необходимо
    } else {
      // Показываем сообщение об ошибке
      showSnackbar('Ты не подписался на канал или отписался от него', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка при проверке подписки:', error);
    showSnackbar('Произошла ошибка при проверке подписки, передайте ошибку разработчику', 'error');
  }
};

const goBack = () => {
  // Логика для возврата в приложении
  window.history.back();
};
</script>

<style scoped>
.upgrade-section {
  margin-top: 20px;
}
</style>
