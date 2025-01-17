<!-- pages/exerciseInChat.vue -->
<template>
  <div>
    <v-card v-if="exercise" class="pa-4 mx-auto" max-width="600">
      <v-card-title style="word-break: break-word;">
        {{ capitalizeFirstLetter(exercise.name) }}
      </v-card-title>

      <div class="gif-container my-4">
        <v-img
            v-if="exercise.gifImage"
            :src="getGifUrl(exercise.gifImage)"
            aspect-ratio="1.7777"
            class="rounded-gif"
        />
      </div>

      <!-- Информационная плашка -->
      <v-alert
          v-if="showBanner"
          type="info"
          colored-border
          variant="tonal"
          close-label="Закрыть"
          class="banner-alert"
          @close="handleCloseBanner"
      >
        <div class="d-flex justify-space-between align-center">
          <div
              class="flex-grow-1"
              @click="openInstructions"
              style="cursor: pointer;"
          >
            <strong>Если страница открылась в браузере, свернув Telegram</strong>, поставьте в настройках Telegram открытие ссылок во встроенном браузере.
            <br><u>Открыть инструкцию <v-icon size="14px">mdi-open-in-new</v-icon></u>
          </div>
        </div>
      </v-alert>

      <!-- Контент упражнения -->
      <v-card-text>
        <v-list dense>
          <v-list-item>
            <v-list-item-title class="font-weight-bold">Основная мышца:</v-list-item-title>
            <v-list-item-subtitle>{{ exercise.mainMuscle }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title class="font-weight-bold">Доп. мышцы:</v-list-item-title>
            <v-list-item-subtitle>{{ exercise.additionalMuscles || '—' }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title class="font-weight-bold">Оборудование:</v-list-item-title>
            <v-list-item-subtitle>{{ exercise.equipment || '—' }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
              <v-list-item-title class="font-weight-bold">Техника:</v-list-item-title>
              <v-list-item-subtitle style="white-space: pre-wrap;">{{ exercise.technique || '—' }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title class="font-weight-bold">Ограничения при травмах</v-list-item-title>
            <v-list-item-subtitle>
              <v-list>
                <v-list-item>
                    <v-list-item-title>Спина: {{ exercise.spineRestrictions ? 'не рекомендуется' : 'можно' }}</v-list-item-title>
                    <v-list-item-title>Колени: {{ exercise.kneeRestrictions ? 'не рекомендуется' : 'можно' }}</v-list-item-title>
                    <v-list-item-title>Плечи: {{ exercise.shoulderRestrictions ? 'не рекомендуется' : 'можно' }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <div class="mt-2 text-gray small-text">
          Не является медицинской рекомендацией, при травмах стоит обратиться к врачу.
        </div>
      </v-card-text>

      <!-- Кнопка для перехода в полную версию бота -->
      <div v-if="exercise" class="mt-4 text-center">
        <v-btn color="primary" @click="redirectToTelegramBot">
          Перейти в телеграм бот
        </v-btn>
      </div>

    </v-card>

    <div v-else class="text-center my-10">
      <v-progress-circular
          indeterminate
          color="primary"
          size="48"
      />
    </div>

    <!-- Модальное окно с инструкцией -->
    <v-dialog v-model="isDialogOpen" max-width="600">
      <v-card class="instruction-card">
        <v-card-title class="headline">
          Как включить встроенный браузер в Telegram
        </v-card-title>
        <v-card-text>
          <!-- Иконки платформ -->
          <div class="d-flex justify-center mb-2">
            <v-icon large class="mr-2">mdi-apple</v-icon>
            <v-icon large>mdi-android</v-icon>
          </div>

          <!-- Инструкция -->
          <div class="mx-3">
            <p>1. Откройте <strong>Настройки</strong> Telegram.</p>
            <p>2. Выберите <strong>Данные и хранилище</strong> → <strong>Браузер</strong>.</p>
              <p>3. Выберите браузер <strong>Telegram</strong>.</p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="isDialogOpen = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';
import { useRoute, useRouter } from 'vue-router';

interface Exercise {
  name: string;
  mainMuscle: string;
  additionalMuscles?: string;
  typeExercise?: string;
  equipment?: string;
  isWarnGif?: boolean;
  technique?: string;
  spineRestrictions?: boolean;
  kneeRestrictions?: boolean;
  shoulderRestrictions?: boolean;
  gifImage?: string;
}

const exercise = ref<Exercise | null>(null);
const route = useRoute();
const router = useRouter();
const { apiRequest } = useApi();

// Состояние плашки и диалога
const showBanner = ref(false);
const isDialogOpen = ref(false);

// Переменная для управления текущей вкладкой

function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}


/**
 * Метод для получения полного URL GIF
 */
function getGifUrl(gifPath: string): string {
  // Предполагается, что gifPath — это относительный путь
  if (gifPath.startsWith('/')) {
    return gifPath;
  } else {
    return '/' + gifPath;
  }
}

/**
 * Метод для проверки, отображать ли плашку
 */
function checkBannerVisibility() {
  const isClosed = localStorage.getItem('bannerClosed');
  showBanner.value = !isClosed;
}

/**
 * Метод для открытия инструкций
 */
function openInstructions() {
  isDialogOpen.value = true;
}

/**
 * Метод для закрытия диалога
 */
function closeDialog() {
  isDialogOpen.value = false;
}

/**
 * Метод для закрытия плашки и сохранения состояния
 */
function handleCloseBanner() {
  showBanner.value = false;
  localStorage.setItem('bannerClosed', 'true');
}

/**
 * Метод для перехода в Telegram бот
 */
function redirectToTelegramBot() {
  const botUsername = 'freeload_top_bot'; // Замените на username вашего бота без @
  window.location.href = `tg://resolve?domain=${botUsername}`;
}

/**
 * Получение данных об упражнении
 */
async function fetchExerciseData() {
  try {
    // Получаем название упражнения из query: /exerciseInChat?name=...
    const exerciseName = route.query.name as string;
    if (!exerciseName) return;

    // Запрос на сервер: GET /api/exercise?name=...
    const data = await apiRequest<Exercise>(
        `GET`,
        `exercise?name=${encodeURIComponent(exerciseName)}`
    );

    if (data) {
      exercise.value = data;
    }
  } catch (error: any) {
    console.error('Ошибка при получении данных об упражнении:', error);
  }
}

// Определение метаданных страницы для использования разметки no-footer
definePageMeta({
  layout: 'no-footer',
});

onMounted(() => {
  fetchExerciseData();
  checkBannerVisibility();
});
</script>

<style scoped>
.banner-alert {
  border-radius: 16px;
}

.gif-container {
  border-radius: 16px;
  overflow: hidden;
}

.rounded-gif {
  border-radius: 16px;
}

.icon-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* Дополнительные стили для кнопок вкладок */
.instruction-card {
  height: 500px; /* Фиксированная высота модального окна */
}

.instruction-window {
  height: calc(100% - 64px); /* Учитываем высоту кнопок и отступы */
  overflow-y: auto; /* Добавляем прокрутку, если содержимое превышает высоту */
}

.v-btn {
  min-width: 100px;
}

.v-btn .v-icon {
  color: inherit; /* Убираем цветовое оформление иконок */
}

.font-weight-bold {
  font-weight: 600;
}

.text-gray {
  color: gray;
}

.small-text {
  font-size: 0.9rem;
}

.v-list-item-title {
  font-size: 1rem;
}

.v-list-item-subtitle {
  font-size: 0.95rem;
}

.custom-list {
  padding-left: 20px; /* Отступ для списка */
  margin: 0; /* Убираем внешние отступы */
}

.custom-list li {
  margin-bottom: 4px; /* Отступ между элементами списка */
  list-style-type: disc; /* Маркированные точки */
}


@media (max-width: 600px) {
  .instruction-card {
    height: 80vh; /* Адаптивная высота для малых экранов */
  }
}
</style>
