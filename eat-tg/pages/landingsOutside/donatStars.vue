<!-- pages/landingsOutside/donatStars.vue -->

<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="pa-5" elevation="4">
          <v-card-title class="justify-center">
            <v-icon large color="primary">mdi-star</v-icon>
            <span class="ml-3">Отправить Stars</span>
          </v-card-title>
          <v-card-subtitle class="text-center">
            Поддержите наш проект, отправив Telegram Stars!
          </v-card-subtitle>
          <v-card-text>
            <v-form @submit.prevent="handleDonateStars">
              <v-text-field
                  v-model="stars"
                  label="Количество звёзд"
                  type="number"
                  required
                  variant="outlined"
                  min="1"
                  :rules="[v => v >= 1 || 'Минимум звёзд — 1']"
                  prepend-icon="mdi-star"
              ></v-text-field>

              <v-btn
                  color="primary"
                  type="submit"
                  :loading="isLoading"
                  block
              >
                Отправить звёзды
              </v-btn>
            </v-form>

            <v-alert v-if="error" type="error" dismissible class="mt-4">
              {{ error }}
            </v-alert>

            <v-alert v-if="success" type="success" dismissible class="mt-4">
              {{ success }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const stars = ref<number>(1);
const error = ref<string>('');
const success = ref<string>('');
const isLoading = ref<boolean>(false);

// Получение данных WebApp от Telegram
const tgWebApp = ref<any>(null);

onMounted(() => {
  if (window.Telegram?.WebApp) {
    tgWebApp.value = window.Telegram.WebApp;
    tgWebApp.value.ready();
    console.log('Telegram WebApp инициализирован:', tgWebApp.value);
  } else {
    error.value = 'Этот функционал доступен только в Telegram.';
    console.error('Telegram WebApp недоступен.');
  }
});

// Обработка отправки звёзд
const handleDonateStars = () => {
  error.value = '';
  success.value = '';

  if (stars.value < 1) {
    error.value = 'Минимальное количество звёзд — 1.';
    console.error('Введено недопустимое количество звёзд:', stars.value);
    return;
  }

  if (!tgWebApp.value) {
    error.value = 'Telegram WebApp не инициализирован.';
    console.error('Telegram WebApp не инициализирован.');
    return;
  }

  isLoading.value = true;

  try {
    // Вызов встроенного метода для отправки звёзд
    tgWebApp.value.requestInvoice({
      // Параметры инвойса
      title: 'Поддержка проекта',
      description: 'Донат для поддержки нашего проекта',
      payload: JSON.stringify({ stars: stars.value }),
      provider_token: 'PROVIDER_TOKEN', // Замените на ваш токен провайдера
      currency: 'XTR',
      prices: [{ label: 'Донат', amount: stars.value * 100 }], // amount в сотых долях
      start_parameter: 'donate_stars',
    });
    console.log('Запрос инвойса отправлен:', stars.value);
  } catch (err) {
    error.value = 'Произошла ошибка при отправке звёзд. Попробуйте позже.';
    console.error('Ошибка при вызове requestInvoice:', err);
  } finally {
    isLoading.value = false;
  }
};

// Определение метаданных страницы для использования разметки no-footer
definePageMeta({
  layout: 'no-footer',
});

</script>

<style scoped>
.v-card {
  max-width: 500px;
}
.v-card-title {
  align-items: center;
}
.ml-3 {
  margin-left: 1rem;
}
</style>
