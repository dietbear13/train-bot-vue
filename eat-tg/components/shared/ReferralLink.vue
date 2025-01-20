<template>
  <v-card>
    <v-card-title>Реферальная ссылка</v-card-title>
    <v-card-text>
      <v-text-field
          v-model="referralLink"
          label="Ваша реферальная ссылка"
          readonly
      ></v-text-field>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" @click="shareOnTelegram">
        Поделиться в Telegram
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import { useApi } from '@/composables/useApi'; // Предполагается, что у вас есть такой composable
import { useRouter } from 'vue-router';

// Состояния
const referralLink = ref<string>('');
const telegramUserId = ref<number | null>(null);
const router = useRouter();

// Функция для генерации реферальной ссылки
const generateReferralLink = () => {
  // реферальная ссылка включает ID пользователя в качестве query параметра
  if (telegramUserId.value) {
    referralLink.value = `https://https://fitnesstgbot.ru?ref=${telegramUserId.value}`;
  } else {
    referralLink.value = 'Не удалось сгенерировать ссылку';
  }
};

// Инициализация Telegram и получение ID пользователя
onMounted(() => {
  if (process.client) {
    const launchParams = retrieveLaunchParams();
    if (launchParams && launchParams.initData) {
      const user = launchParams.initData.user;
      if (user && user.id) {
        telegramUserId.value = Number(user.id);
        console.log('telegramUserId:', telegramUserId.value);
        generateReferralLink();
        // Отправляем данные на сервер
        sendReferralData();
      } else {
        console.error('Не удалось получить данные пользователя из Telegram.');
      }
    } else {
      console.error('Не удалось получить initData из launchParams.');
    }
  }
});

// Функция для отправки данных на сервер
const sendReferralData = async () => {
  if (telegramUserId.value) {
    const inviteeId = getInviteeId(); // Реализуйте логику получения ID приглашенного
    try {
      await useApi.post('/api/referral', {
        inviterId: telegramUserId.value,
        inviteeId: inviteeId,
      });
      console.log('Данные реферальной ссылки отправлены на сервер');
    } catch (error) {
      console.error('Ошибка при отправке данных на сервер:', error);
    }
  }
};

// Функция для получения ID приглашенного
const getInviteeId = (): number => {
  // Реализуйте логику получения ID приглашенного пользователя
  // Это может быть, например, текущий пользователь в приложении
  // Здесь для примера вернём статическое значение
  return 123456; // Замените на реальную логику
};

// Функция для поделиться в Telegram
const shareOnTelegram = () => {
  if (referralLink.value) {
    // Используем Telegram Web App API для отправки сообщения
    window.Telegram.WebApp.sendData(referralLink.value);
  }
};
</script>

<style scoped>
/* Добавьте стили по необходимости */
</style>
