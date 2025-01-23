<!-- pages/exerciseInChat.vue -->
<template>
  <v-container class="py-2" fluid>
    <v-card v-if="exercise" class="mx-auto" max-width="700" outlined>
      <!-- Заголовок -->
      <v-card-title class="headline text-center" style="word-break: break-word;">
        {{ capitalizeFirstLetter(exercise.name) }}
      </v-card-title>

      <!-- Изображение GIF -->
      <v-img
          v-if="exercise.gifImage"
          :src="getGifUrl(exercise.gifImage)"
          aspect-ratio="16/9"
          class="my-2 rounded-lg"
          alt="{{ capitalizeFirstLetter(exercise.name) }}"
      />

      <!-- Информационная плашка -->
      <v-alert
          v-if="showBanner"
          type="info"
          border="left"
          dismissible
          class="mb-2 rounded-lg"
          @dismissed="handleCloseBanner"
      >
        <v-row align="center" justify="space-between">
          <v-col cols="12" @click="openInstructions" class="cursor-pointer">
            <strong>Если страница открылась в браузере, свернув Telegram</strong>, поставьте в настройках Telegram открытие ссылок во встроенном браузере.
            <br>
            <u>Открыть инструкцию <v-icon small>mdi-open-in-new</v-icon></u>
          </v-col>
        </v-row>
      </v-alert>

      <!-- Контент упражнения -->
      <v-card-text>
        <v-row>
          <!-- Основная и Дополнительные мышцы -->
          <v-col cols="12" md="6">
            <v-card flat>
              <v-card-title class="d-flex align-center">
                <v-icon color="primary" class="me-2">mdi-arm-flex</v-icon>
                <span class="font-weight-bold">Мышцы</span>
              </v-card-title>
              <v-card-text class="pa-0">
                <v-chip-group column>
                  <!-- Основные мышцы -->
                  <v-chip
                      v-for="(muscle, index) in splitMuscles(exercise.mainMuscle)"
                      :key="'main-muscle-' + index"
                      color="primary lighten-4"
                      text-color="primary"
                      outlined
                      class="ma-1"
                  >
                    {{ muscle }}
                  </v-chip>
                  <!-- Дополнительные мышцы -->
                  <v-chip
                      v-if="exercise.additionalMuscles"
                      v-for="(muscle, index) in splitMuscles(exercise.additionalMuscles)"
                      :key="'additional-muscle-' + index"
                      color="secondary lighten-4"
                      text-color="secondary"
                      outlined
                      class="ma-1"
                  >
                    {{ muscle }}
                  </v-chip>
                </v-chip-group>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

          <!-- Оборудование -->
          <v-col cols="12" md="6">
            <v-card flat>
              <v-card-title class="d-flex align-center">
                <v-icon color="success" class="me-0">mdi-dumbbell</v-icon>
                <span class="font-weight-bold">Оборудование:</span>
              </v-card-title>
              <v-card-text class="pa-0">
                <template v-if="exercise.equipment">
                  <v-chip
                      color="success lighten-4"
                      text-color="success"
                      outlined
                      class="ma-1"
                  >
                    {{ exercise.equipment }}
                  </v-chip>
                </template>
                <template v-else>
                  <span>—</span>
                </template>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Техника -->
          <v-col cols="12">
            <v-card flat>
              <v-card-title class="d-flex align-center">
                <v-icon color="info" class="me-0">mdi-weight-lifter</v-icon>
                <span class="font-weight-bold">Техника:</span>
              </v-card-title>
              <v-card-text class="pa-0">
                <template v-if="exercise.technique">
                  <transition name="fade">
                    <div class="technique-text">
                      {{ exercise.technique }}
                    </div>
                  </transition>
                </template>
                <template v-else>
                  <span>—</span>
                </template>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Ограничения при травмах -->
          <v-col cols="12">
            <v-card flat>
              <v-card-title class="d-flex align-center">
                <v-icon color="error" class="me-0">mdi-alert</v-icon>
                <span class="font-weight-bold">Ограничения при травмах:</span>
              </v-card-title>
              <v-card-text class="pa-0">
                <v-row>
                  <v-col cols="12" sm="4" class="d-flex align-center">
                    <v-icon
                        :color="exercise.spineRestrictions ? 'red lighten-2' : 'green lighten-2'"
                        class="me-2"
                    >
                      {{ exercise.spineRestrictions ? 'mdi-close-circle' : 'mdi-check-circle' }}
                    </v-icon>
                    Позвоночника:
                    <span :class="exercise.spineRestrictions ? 'text-red' : 'text-green'">
                      {{ exercise.spineRestrictions ? 'не рекомендуется' : 'можно' }}
                    </span>
                  </v-col>
                  <v-col cols="12" sm="4" class="d-flex align-center">
                    <v-icon
                        :color="exercise.kneeRestrictions ? 'red lighten-2' : 'green lighten-2'"
                        class="me-2"
                    >
                      {{ exercise.kneeRestrictions ? 'mdi-close-circle' : 'mdi-check-circle' }}
                    </v-icon>
                    Коленей:
                    <span :class="exercise.kneeRestrictions ? 'text-red' : 'text-green'">
                      {{ exercise.kneeRestrictions ? 'не рекомендуется' : 'можно' }}
                    </span>
                  </v-col>
                  <v-col cols="12" sm="4" class="d-flex align-center">
                    <v-icon
                        :color="exercise.shoulderRestrictions ? 'red lighten-2' : 'green lighten-2'"
                        class="me-2"
                    >
                      {{ exercise.shoulderRestrictions ? 'mdi-close-circle' : 'mdi-check-circle' }}
                    </v-icon>
                    Плеч:
                    <span :class="exercise.shoulderRestrictions ? 'text-red' : 'text-green'">
                      {{ exercise.shoulderRestrictions ? 'не рекомендуется' : 'можно' }}
                    </span>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>

        <v-divider class="my-4"></v-divider>

        <v-alert type="warning" border="left" outlined>
          Не является медицинской рекомендацией, при травмах стоит обратиться к врачу.
        </v-alert>

      <!-- Кнопка перехода в Telegram бот -->
      <v-card-actions class="justify-center">
        <v-btn color="primary" @click="redirectToTelegramBot" large>
          Перейти в Telegram бот
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Индикатор загрузки -->
    <v-card v-else class="mx-auto" max-width="700" outlined>
      <v-card-text class="d-flex justify-center py-10">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
      </v-card-text>
    </v-card>

    <!-- Модальное окно с инструкцией -->
    <v-dialog v-model="isDialogOpen" max-width="600">
      <v-card>
        <v-card-title class="headline">
          Как включить встроенный браузер в Telegram
        </v-card-title>
        <v-card-text>
          <!-- Иконки платформ -->
          <v-row justify="center" class="mb-4">
            <v-col cols="auto">
              <v-icon large>mdi-apple</v-icon>
            </v-col>
          </v-row>

          <!-- Инструкция -->
          <v-list>
            <v-list-item>
                <v-list-item-title>1. Откройте <strong>Настройки</strong> Telegram.</v-list-item-title>
            </v-list-item>
            <v-list-item>
                <v-list-item-title>2. Выберите <strong>Данные и хранилище</strong> → <strong>Браузер</strong>.</v-list-item-title>
            </v-list-item>
            <v-list-item>
                <v-list-item-title>3. Выберите браузер <strong>Telegram</strong>.</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="isDialogOpen = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
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

interface KbzhuResult {
  calories: number;
  extraCalories: number;
  proteins: number;
  fats: number;
  carbs: number;
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

// Функция для разделения мышц, если они перечислены через запятую
function splitMuscles(muscles: string): string[] {
  return muscles.split(',').map(muscle => muscle.trim());
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

.rounded-lg {
  border-radius: 16px;
}

.cursor-pointer {
  cursor: pointer;
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
  .v-card {
    margin: 4px !important;
  }
}
</style>
