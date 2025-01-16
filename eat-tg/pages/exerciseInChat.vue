<!-- pages/exerciseInChat.vue -->
<template>
  <div>
    <!-- Информационная плашка -->
    <v-alert
        v-if="showBanner"
        type="warning"
        colored-border
        class="banner-alert"
    >
      <div class="d-flex justify-space-between align-center">
        <div
            class="flex-grow-1"
            @click="openInstructions"
            style="cursor: pointer;"
        >
          <strong>Гифка открылась не в Telegram?</strong> Узнай как
          включить встроенный браузер телеграм одной кнопкой!
        </div>
        <v-btn icon @click="closeBanner">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
    </v-alert>

    <v-card v-if="exercise" class="pa-4 mx-auto" max-width="600">
      <v-card-title>{{ exercise.name }}</v-card-title>

      <v-img
          v-if="exercise.gifImage"
          :src="getGifUrl(exercise.gifImage)"
          aspect-ratio="1.7777"
          class="my-4"
          style="border-radius: 16px;"
      />

      <!-- Контент упражнения -->
      <v-card-text>
        <div>
          <strong>Основная мышца:</strong> {{ exercise.mainMuscle }}
        </div>
        <div>
          <strong>Доп. мышцы:</strong> {{ exercise.additionalMuscles || '—' }}
        </div>
        <div>
          <strong>Оборудование:</strong> {{ exercise.equipment || '—' }}
        </div>
        <div>
          <strong>Техника:</strong>
          <p style="white-space: pre-wrap;">{{ exercise.technique || '—' }}</p>
        </div>
        <div class="mt-2">
          <strong>Ограничения:</strong>
          <ul>
            <li>
              Спина:
              <span>
                {{
                  exercise.spineRestrictions
                      ? 'не рекомендуется'
                      : 'можно'
                }}
              </span>
            </li>
            <li>
              Колени:
              <span>
                {{
                  exercise.kneeRestrictions
                      ? 'не рекомендуется'
                      : 'можно'
                }}
              </span>
            </li>
            <li>
              Плечи:
              <span>
                {{
                  exercise.shoulderRestrictions
                      ? 'не рекомендуется'
                      : 'можно'
                }}
              </span>
            </li>
          </ul>
        </div>
        <div style="color: gray; font-size: 0.8rem;">
          Не является медицинской рекомендацией, при травмах стоит обратиться к
          врачу.
        </div>
      </v-card-text>
    </v-card>

    <div v-else class="text-center my-10">
      <v-progress-circular
          indeterminate
          color="primary"
          size="48"
      />
    </div>

    <!-- Кнопка для перехода в полную версию бота -->
    <div v-if="exercise" class="mt-4 text-center">
      <v-btn color="primary" @click="redirectToTelegramBot">
        Перейти в телеграм бот
      </v-btn>
    </div>

    <!-- Модальное окно с инструкцией -->
    <v-dialog v-model="isDialogOpen" max-width="600">
      <v-card class="instruction-card">
        <v-card-title class="headline">
          Как включить встроенный браузер в Telegram
        </v-card-title>
        <v-card-text>
          <!-- Замена v-tabs и v-tab на v-window и v-window-item -->
          <v-window v-model="currentTab" class="instruction-window">
            <!-- Навигация между окнами -->
            <div class="d-flex justify-center mb-4">
              <v-btn
                  text
                  :color="currentTab === 'ios' ? 'primary' : 'default'"
                  @click="currentTab = 'ios'"
                  class="flex-grow-1 d-flex flex-column align-center"
              >
                <span>iOS</span>
                <v-icon>mdi-apple</v-icon>
              </v-btn>
              <v-btn
                  text
                  :color="currentTab === 'android' ? 'primary' : 'default'"
                  @click="currentTab = 'android'"
                  class="flex-grow-1 d-flex flex-column align-center"
              >
                <span>Android</span>
                <v-icon>mdi-android</v-icon>
              </v-btn>
            </div>

            <!-- Содержимое окон -->
            <v-window-item value="ios">
              <v-card-text>
                <ol>
                  <li>Откройте приложение Telegram на вашем iPhone.</li>
                  <li>Перейдите в <strong>Настройки</strong>.</li>
                  <li>Выберите <strong>Данные и хранилище</strong>.</li>
                  <li>Найдите раздел <strong>Браузер</strong>.</li>
                  <li>Выберите среди всех <strong>Telegram</strong>.</li>
                </ol>
              </v-card-text>
            </v-window-item>

            <v-window-item value="android">
              <v-card-text>
                <ol>
                  <li>
                    Откройте приложение Telegram на вашем устройстве Android.
                  </li>
                  <li>
                    Нажмите на три полоски (меню) в верхнем левом углу.
                  </li>
                  <li>Перейдите в <strong>Настройки</strong>.</li>
                  <li>
                    Выберите <strong>Данные и хранилище</strong>.
                  </li>
                  <li>Найдите раздел <strong>Браузер</strong>.</li>
                  <li>Выберите среди всех <strong>Telegram</strong>.</li>
                </ol>
              </v-card-text>
            </v-window-item>
          </v-window>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="closeDialog">Закрыть</v-btn>
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
const currentTab = ref('ios');

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
 * Метод для закрытия плашки
 */
function closeBanner() {
  showBanner.value = false;
  localStorage.setItem('bannerClosed', 'true');
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
  background-color: #fff3cd; /* Светло-желтый цвет */
  border-left: 4px solid #ffeeba; /* Темнее желтый для границы */
  margin-bottom: 16px;
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

@media (max-width: 600px) {
  .instruction-card {
    height: 80vh; /* Адаптивная высота для малых экранов */
  }
}
</style>
