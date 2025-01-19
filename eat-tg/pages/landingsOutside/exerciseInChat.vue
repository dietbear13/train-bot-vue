<!-- pages/exerciseInChat.vue -->
<template>
  <div>
    <v-card v-if="exercise" class="pa-6 mx-auto" max-width="700">
      <v-card-title class="headline text-center" style="word-break: break-word;">
        {{ capitalizeFirstLetter(exercise.name) }}
      </v-card-title>

      <div class="gif-container my-6">
        <v-img
            v-if="exercise.gifImage"
            :src="getGifUrl(exercise.gifImage)"
            aspect-ratio="1.7777"
            class="rounded-gif"
            alt="Exercise GIF"
        />
      </div>

      <!-- Информационная плашка -->
      <v-alert
          v-if="showBanner"
          type="info"
          colored-border
          variant="tonal"
          dismissible
          class="banner-alert"
          @dismissed="handleCloseBanner"
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
        <v-row dense>
          <!-- Основная и Дополнительные мышцы -->
          <v-col cols="12" md="6">
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-2" color="primary">mdi-human-muscle</v-icon>
              <strong>Основная мышца:</strong>
            </div>
            <v-chip-group>
              <v-chip
                  class="ma-1"
                  color="primary lighten-4"
                  text-color="primary"
                  label
              >
                {{ exercise.mainMuscle }}
              </v-chip>
              <v-chip
                  v-if="exercise.additionalMuscles"
                  class="ma-1"
                  color="secondary lighten-4"
                  text-color="secondary"
                  label
              >
                {{ exercise.additionalMuscles }}
              </v-chip>
            </v-chip-group>
          </v-col>

          <!-- Оборудование -->
          <v-col cols="12" md="6">
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-2" color="primary">mdi-dumbbell</v-icon>
              <strong>Оборудование:</strong>
            </div>
            <v-chip
                v-if="exercise.equipment"
                class="ma-1"
                color="success lighten-4"
                text-color="success"
                label
            >
              {{ exercise.equipment }}
            </v-chip>
            <span v-else>—</span>
          </v-col>

          <!-- Техника -->
          <v-col cols="12">
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-2" color="primary">mdi-skill-level</v-icon>
              <strong>Техника:</strong>
            </div>
            <div v-if="exercise.technique">
              <v-expand-transition>
                <div class="technique-text">
                  {{ exercise.technique }}
                </div>
              </v-expand-transition>
            </div>
            <span v-else>—</span>
          </v-col>

          <!-- Ограничения при травмах -->
          <v-col cols="12">
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-2" color="error">mdi-alert</v-icon>
              <strong>Ограничения при травмах:</strong>
            </div>
            <v-row>
              <v-col cols="12" sm="4" class="d-flex align-center">
                <v-icon
                    :color="exercise.spineRestrictions ? 'red lighten-2' : 'green lighten-2'"
                    class="mr-2"
                >
                  {{ exercise.spineRestrictions ? 'mdi-close-circle' : 'mdi-check-circle' }}
                </v-icon>
                позвоночника:
                <span :class="exercise.spineRestrictions ? 'text-red' : 'text-green'">
                  {{ exercise.spineRestrictions ? 'не рекомендуется' : 'можно' }}
                </span>
              </v-col>
              <v-col cols="12" sm="4" class="d-flex align-center">
                <v-icon
                    :color="exercise.kneeRestrictions ? 'red lighten-2' : 'green lighten-2'"
                    class="mr-2"
                >
                  {{ exercise.kneeRestrictions ? 'mdi-close-circle' : 'mdi-check-circle' }}
                </v-icon>
                коленей:
                <span :class="exercise.kneeRestrictions ? 'text-red' : 'text-green'">
                  {{ exercise.kneeRestrictions ? 'не рекомендуется' : 'можно' }}
                </span>
              </v-col>
              <v-col cols="12" sm="4" class="d-flex align-center">
                <v-icon
                    :color="exercise.shoulderRestrictions ? 'red lighten-2' : 'green lighten-2'"
                    class="mr-2"
                >
                  {{ exercise.shoulderRestrictions ? 'mdi-close-circle' : 'mdi-check-circle' }}
                </v-icon>
                плеч:
                <span :class="exercise.shoulderRestrictions ? 'text-red' : 'text-green'">
                  {{ exercise.shoulderRestrictions ? 'не рекомендуется' : 'можно' }}
                </span>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <div class="mt-4 text-gray small-text">
          Не является медицинской рекомендацией, при травмах стоит обратиться к врачу.
        </div>
      </v-card-text>

      <!-- Кнопка для перехода в полную версию бота -->
      <div class="mt-6 text-center">
        <v-btn color="primary" @click="redirectToTelegramBot" large>
          Перейти в Telegram бот
        </v-btn>
      </div>
    </v-card>

    <v-card v-else class="pa-6 mx-auto" max-width="700">
      <div class="text-center my-10">
        <v-progress-circular
            indeterminate
            color="primary"
            size="48"
        />
      </div>
    </v-card>

    <!-- Модальное окно с инструкцией -->
    <v-dialog v-model="isDialogOpen" max-width="600">
      <v-card class="instruction-card">
        <v-card-title class="headline">
          Как включить встроенный браузер в Telegram
        </v-card-title>
        <v-card-text>
          <!-- Иконки платформ -->
          <div class="d-flex justify-center mb-4">
            <v-icon large class="mr-2">mdi-apple</v-icon>
            <v-icon large class="ml-2">mdi-android</v-icon>
          </div>

          <!-- Инструкция -->
          <div class="mx-4">
            <ol>
              <li>Откройте <strong>Настройки</strong> Telegram.</li>
              <li>Выберите <strong>Данные и хранилище</strong> → <strong>Браузер</strong>.</li>
              <li>Выберите браузер <strong>Telegram</strong>.</li>
            </ol>
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
import { useApi } from '../../composables/useApi';
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

// Функция для капитализации первой буквы
function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Метод для получения полного URL GIF
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

  // Проверяем user-agent на iPhone
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isIphone = /iPhone/i.test(userAgent);

  // Отображаем плашку только если пользователь на iPhone и плашка не была закрыта ранее
  showBanner.value = isIphone && !isClosed;
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

.headline {
  font-weight: 700;
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
  /* Убираем обрезку текста */
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
}

.custom-list {
  padding-left: 20px; /* Отступ для списка */
  margin: 0; /* Убираем внешние отступы */
}

.custom-list li {
  margin-bottom: 4px; /* Отступ между элементами списка */
  list-style-type: disc; /* Маркированные точки */
}

.full-text {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
}

.technique-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.text-red {
  color: #e53935; /* Тускло красный цвет */
}

.text-green {
  color: #43a047; /* Тускло зелёный цвет */
}

@media (max-width: 600px) {
  .instruction-card {
    height: 80vh; /* Адаптивная высота для малых экранов */
  }
}
</style>
