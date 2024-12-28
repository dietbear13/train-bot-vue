<!-- components/TrainingBySplits.vue -->
<template>
  <v-form @submit.prevent="generateSplitWorkout">
    <!-- Выбор пола -->
    <v-card class="mb-2 dark-background" variant="tonal">
      <v-card-text class="pa-1">
        <v-slide-group
            v-model="gender"
            show-arrows
            class="flex-nowrap"
            center-active
            mandatory
        >
          <v-slide-group-item
              v-for="option in genders"
              :key="option"
              :value="option"
          >
            <v-btn
                variant="text"
                outlined
                class="group-button mx-auto"
                :class="{ 'selected-button': gender === option }"
                @click="selectGender(option)"
                rounded="lg"
            >
              {{ option }}
            </v-btn>
          </v-slide-group-item>
        </v-slide-group>
      </v-card-text>
    </v-card>

    <!-- Выбор сплита -->
    <v-card
        class="my-2 dark-background pa-3"
        variant="tonal"
        v-if="availableSplits.length > 0"
    >
      <v-card-text class="pa-1">
        <v-row>
          <v-col
              v-for="split in availableSplits"
              :key="split._id"
              cols="12"
              sm="6"
              md="4"
              class="px-2 py-1"
          >
            <v-btn
                block
                :value="split"
                :class="{ 'selected-button': selectedSplit?._id === split._id }"
                @click="selectSplit(split)"
                rounded="lg"
            >
              <strong>{{ split.split }}</strong>
              <div>ID: {{ split.splitId }}</div>
              <div>splitDays: {{ split.splitDays }}</div>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card
        v-else
        class="my-2 dark-background pa-3"
        variant="tonal"
    >
      <v-card-text>
        <p>Нет доступных сплитов для выбранного пола (или не загружены).</p>
      </v-card-text>
    </v-card>

    <!-- Кнопка "Сгенерировать" -->
    <v-btn
        color="success"
        class="mt-1"
        rounded="lg"
        width="100%"
        :disabled="isGenerating || !selectedSplit"
        @click="generateSplitWorkout"
    >
      <v-icon left>mdi-dumbbell</v-icon>
      <span v-if="isLoading">Генерируем...</span>
      <span v-else>Сгенерировать</span>
    </v-btn>

    <!-- Ошибки -->
    <v-alert
        v-if="errorMessages.length > 0"
        type="error"
        class="mt-2"
        dismissible
        @input="errorMessages = []"
    >
      <ul>
        <li v-for="(msg, index) in errorMessages" :key="index">{{ msg }}</li>
      </ul>
    </v-alert>

    <!-- BottomSheetWithClose для отображения плана -->
    <BottomSheetWithClose
        v-model="showBottomSheet"
        title="Сгенерированный сплит (7 дней)"
    >
      <v-card-text class="ma-0">
        <div v-if="isLoading" class="mb-2" style="text-align:center;">
          <p>Генерируем тренировку...</p>
          <v-progress-linear
              color="primary"
              indeterminate
              height="4"
              class="mt-3"
          ></v-progress-linear>
          <p style="margin-top: 1rem;">[ Рыбное содержимое ]</p>
        </div>
        <div v-else>
          <div
              v-for="(day, idx) in finalPlan"
              :key="idx"
              class="my-2"
          >
            <strong>
              День {{ idx + 1 }} ({{ dayName(idx) }})
            </strong>
            <div v-if="day.exercises.length === 0">
              отдых
            </div>
            <div v-else>
              <ul>
                <li v-for="(ex, i2) in day.exercises" :key="i2">
                  {{ ex.name }} ({{ ex.sets }}×{{ ex.reps }})
                </li>
              </ul>
            </div>
          </div>
        </div>
      </v-card-text>
      <!-- Кнопка для отправки плана через Telegram -->
      <div class="text-center mt-2">
        <v-btn
            color="primary"
            @click="sendWorkoutPlan"
            :disabled="!telegramUserId"
            rounded="lg"
        >
          <v-icon left>mdi-send</v-icon>
          Отправить себе
        </v-btn>
      </div>
    </BottomSheetWithClose>

    <!-- Snackbar для уведомлений -->
    <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="snackbar.timeout"
        top
        right
        multi-line
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn color="white" text @click="snackbar.show = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </v-form>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import axios, { AxiosRequestConfig, Method } from 'axios'
import { retrieveLaunchParams } from '@telegram-apps/sdk'
import BottomSheetWithClose from '~/components/BottomSheetWithClose.vue'
import useSplitGenerator from '~/composables/useSplitGenerator'

// Обёртка для запросов API с fallback
const primaryBaseURL = 'https://fit-server-bot.ru.tuna.am/api/'
const fallbackBaseURL = 'http://localhost:3002/api/'

const apiRequest = async <T>(
    method: Method,
    endpoint: string,
    data?: any,
    params?: any
): Promise<T> => {
  const config: AxiosRequestConfig = {
    method,
    url: primaryBaseURL + endpoint,
    data,
    params,
    timeout: 5000
  }
  try {
    const response = await axios(config)
    console.log(`Успешный ответ от основного сервера: ${endpoint}`, response.data)
    return response.data
  } catch (primaryError) {
    console.warn(
        `Основной сервер не доступен: ${primaryError}. Переключение на резервный сервер.`
    )
    const fallbackConfig: AxiosRequestConfig = {
      method,
      url: fallbackBaseURL + endpoint,
      data,
      params,
      timeout: 5000
    }
    try {
      const response = await axios(fallbackConfig)
      console.log(`Успешный ответ от резервного сервера: ${endpoint}`, response.data)
      return response.data
    } catch (fallbackError) {
      console.error(`Резервный сервер также не доступен: ${fallbackError}`)
      throw fallbackError
    }
  }
}

interface SnackbarState {
  show: boolean
  message: string
  color: string
  timeout?: number
}

interface SplitDay {
  numberDay: number
  patternOrExercise: string[]
}

interface SplitItem {
  _id: string
  split: string
  splitId: number
  gender: string
  splitDays: string
  days: SplitDay[]
}

interface TelegramUserData {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
}

export default defineComponent({
  name: 'TrainingBySplits',
  components: { BottomSheetWithClose },
  setup() {
    // Полы для выбора
    const genders = ['Мужчина', 'Женщина']
    const gender = ref<string>('')

    // Список всех сплитов
    const allSplits = ref<SplitItem[]>([])

    // Выбранный сплит
    const selectedSplit = ref<SplitItem | null>(null)

    // Флаги состояния
    const isLoading = ref(false)
    const isGenerating = ref(false)

    // Вывод результатов (7 дней)
    const showBottomSheet = ref(false)

    // Ошибки и сообщения
    const errorMessages = ref<string[]>([])
    const snackbar = ref<SnackbarState>({
      show: false,
      message: '',
      color: 'info',
      timeout: 1500
    })

    // Telegram user data
    const userData = ref<TelegramUserData | null>(null)
    const telegramUserId = ref<number | null>(null)
    const initData = ref<any>(null)

    // Функция для отображения уведомлений
    const showSnackbar = (message: string, color: string = 'info') => {
      snackbar.value.message = message
      snackbar.value.color = color
      snackbar.value.show = true
      console.log(`Snackbar: ${message} (color: ${color})`)
    }

    // Выбор пола => сброс выбранного сплита
    const selectGender = (option: string) => {
      gender.value = option
      selectedSplit.value = null
      console.log('Выбран пол:', option)
    }

    // Выбор сплита
    const selectSplit = (split: SplitItem) => {
      selectedSplit.value = split
      console.log('Выбран сплит:', split)
    }

    // Доступные сплиты для выбранного пола
    const availableSplits = computed(() => {
      if (!gender.value) return []
      return allSplits.value.filter(split =>
          split.gender.toLowerCase().includes(gender.value.toLowerCase())
      )
    })

    // Используем хук для генерации плана
    const {
      finalPlan,
      generateSplitPlan,
      sendWorkoutPlan
    } = useSplitGenerator({
      isLoading,
      isGenerating,
      showBottomSheet,
      errorMessages,
      showSnackbar,
      telegramUserId
    })

    // Функция для генерации сплита
    const generateSplitWorkout = async () => {
      if (!selectedSplit.value || !gender.value) {
        errorMessages.value.push('Выберите пол и сплит.')
        showSnackbar('Выберите пол и сплит.', 'error')
        console.warn('Пользователь не выбрал пол или сплит.')
        return
      }

      console.log('Начало генерации сплита.')
      await generateSplitPlan(gender.value, selectedSplit.value)
      console.log('Генерация сплита завершена.')
    }

    // Функция для получения названия дня недели (по индексу)
    const dayName = (index: number): string => {
      const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
      return days[index % 7]
    }

    // Загрузка сплитов с API
    const loadSplits = async () => {
      try {
        console.log('Запрос к API для загрузки сплитов.')
        const data = await apiRequest<SplitItem[]>('get', 'splits')
        allSplits.value = Array.isArray(data) ? data : []
        console.log('Загруженные сплиты:', data)
      } catch (error: any) {
        console.error('Ошибка при загрузке сплитов:', error)
        showSnackbar('Ошибка при загрузке сплитов.', 'error')
      }
    }

    // Инициализация Telegram и загрузка сплитов
    onMounted(async () => {
      console.log('Компонент TrainingBySplits.vue смонтирован.')

      // Загрузка сплитов с API
      await loadSplits()

      // Инициализация Telegram
      if (process.client) {
        console.log('Инициализация данных Telegram.')
        const launchParams = retrieveLaunchParams()
        initData.value = launchParams.initData
        if (initData.value && initData.value.user) {
          userData.value = initData.value.user
          telegramUserId.value = userData.value.id
          console.log('Telegram user ID:', telegramUserId.value)
        } else {
          console.error('Не удалось получить данные пользователя (Telegram).')
          showSnackbar('Не удалось получить данные пользователя (Telegram).', 'error')
        }
      }
    })

    return {
      gender,
      genders,
      allSplits,
      selectedSplit,
      availableSplits,
      isLoading,
      isGenerating,
      errorMessages,
      showBottomSheet,
      finalPlan,
      snackbar,
      showSnackbar,
      selectGender,
      selectSplit,
      generateSplitWorkout,
      dayName
    }
  }
})
</script>

<style scoped>
.dark-background {
  background-color: #1E1E1E !important;
  color: #FFF;
}
.group-button {
  min-width: 100px;
}
.selected-button {
  background-color: var(--v-primary-base);
  color: white;
}
</style>
