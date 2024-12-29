<!-- components/TrainingOnWeek.vue -->
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
              <div> splitDays: {{ split.splitDays }}</div>
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
        <p>Выбери пол, потом число тренировок в неделю и сплит.</p>
      </v-card-text>
    </v-card>

    <!-- Кнопка "Сгенерировать" (с анимацией при загрузке) -->
    <v-btn
        color="success"
        class="mt-1"
        rounded="lg"
        width="100%"
        :disabled="isGenerating || !selectedSplit"
        @click="generateSplitWorkout"
    >
      <!-- При загрузке: "Создаю..", иначе: "Создать" -->
      <span v-if="isLoading">Создаю.. </span>
      <span v-else>Создать </span>
      <!-- Иконка справа, вращается, если isLoading === true -->
      <v-icon
          right
          :class="{ rotatingDumbbell: isLoading }"
      >
        mdi-dumbbell
      </v-icon>
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
        <li v-for="(msg, index) in errorMessages" :key="index">
          {{ msg }}
        </li>
      </ul>
    </v-alert>

    <!-- BottomSheetWithClose для отображения результата -->
    <BottomSheetWithClose
        v-model="showBottomSheet"
        title="Программа на неделю"
    >
      <v-card-text class="ma-0">
        <!-- Если идёт загрузка - показываем рыбное содержимое -->
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

        <!-- Если НЕ идёт загрузка - показываем реальный результат (7 дней) -->
        <div v-else>
          <!--
            Выводим 7 "блоков":
            каждый блок = заголовок "День N (dayName)" +
            список (таблица) упражнений.
            При отсутствии упражнений => "отдых".
          -->
          <div
              v-for="(day, idx) in finalPlan"
              :key="idx"
              class="day-block mb-3"
          >
            <!-- Заголовок дня -->
            <h3 class="day-heading">
              День {{ idx + 1 }} ({{ dayName(idx) }})
            </h3>

            <!-- Если нет упражнений => отдых -->
            <div v-if="day.exercises.length === 0" class="rest-label">
              отдых
            </div>

            <!-- Иначе => список упражнений -->
            <div v-else class="day-exercises-table">
              <div
                  v-for="(ex, i2) in day.exercises"
                  :key="i2"
                  class="exercise-row"
              >
                <!-- Название упражнения -->
                <div class="exercise-name">
                  {{ ex.name }}
                </div>

                <!-- Управляющий блок -->
                <div class="row-controls">
                  <!--
                    Левая часть: - reps +
                  -->
                  <div class="sets-reps-row">
                    <v-btn
                        icon
                        small
                        variant="plain"
                        class="mx-0"
                        size="24px"
                        @click="decreaseRepsSplit(day.exercises, i2)"
                    >
                      <v-icon small>mdi-minus</v-icon>
                    </v-btn>

                    <span class="sets-reps-text">
                      {{ ex.sets }} × {{ ex.reps }}
                    </span>

                    <v-btn
                        icon
                        variant="plain"
                        class="mx-0"
                        size="24px"
                        @click="increaseRepsSplit(day.exercises, i2)"
                    >
                      <v-icon small>mdi-plus</v-icon>
                    </v-btn>
                  </div>

                  <!-- Правая часть: refresh / delete (вертикально) -->
                  <div class="vertical-buttons">
                    <!-- refresh -->
                    <v-btn
                        icon
                        variant="plain"
                        class="mx-0"
                        size="24px"
                        @click="regenerateExerciseSplit(day.exercises, i2)"
                    >
                      <v-icon>mdi-refresh</v-icon>
                    </v-btn>
                    <!-- delete -->
                    <v-btn
                        icon
                        variant="plain"
                        class="mx-0"
                        size="24px"
                        @click="removeExerciseSplit(day.exercises, i2)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>

      <!-- Кнопка (рыбная) "Отправить себе" -->
      <div class="text-center mt-2">
        <v-btn
            color="primary"
            rounded="lg"
            icon
            :disabled="!telegramUserId"
        >
          <!-- Только иконка (нет реальной логики) -->
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </div>
    </BottomSheetWithClose>

    <!-- Snackbar -->
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
import axios, { type AxiosRequestConfig, type Method } from 'axios'
import { retrieveLaunchParams } from '@telegram-apps/sdk'
import BottomSheetWithClose from '~/components/BottomSheetWithClose.vue'
import useSplitGenerator from '~/composables/useSplitGenerator'

/** Обёртка для запросов (fallback). */
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
      return response.data
    } catch (fallbackError) {
      console.error(`Резервный сервер также не доступен: ${fallbackError}`)
      throw fallbackError
    }
  }
}

// Типы
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
  name: 'TrainingOnWeek',
  components: { BottomSheetWithClose },
  setup() {
    // Пол / сплиты
    const genders = ['Мужчина', 'Женщина']
    const gender = ref<string>('')
    const allSplits = ref<SplitItem[]>([])
    const selectedSplit = ref<SplitItem | null>(null)

    // Состояние
    const isLoading = ref(false)     // Показывает анимацию иконки и плейсхолдер
    const isGenerating = ref(false)  // Флаг из хука, не меняем
    const showBottomSheet = ref(false)
    const errorMessages = ref<string[]>([])

    // Snackbar
    const snackbar = ref<SnackbarState>({
      show: false,
      message: '',
      color: 'info',
      timeout: 1500
    })
    const showSnackbar = (msg: string, color: string = 'info') => {
      snackbar.value.message = msg
      snackbar.value.color = color
      snackbar.value.show = true
      console.log(`Snackbar: ${msg} (color: ${color})`)
    }

    // Telegram
    const userData = ref<TelegramUserData | null>(null)
    const telegramUserId = ref<number | null>(null)
    const initData = ref<any>(null)

    // Фильтруем сплиты
    const availableSplits = computed(() => {
      if (!gender.value) return []
      return allSplits.value.filter(split =>
          split.gender.toLowerCase().includes(gender.value.toLowerCase())
      )
    })

    // Выбор пола
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

    // Подключаем хук
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

    // «Реальный» метод генерации (не меняем логику внутри)
    async function realGenerateSplitWorkout() {
      if (!selectedSplit.value || !gender.value) {
        errorMessages.value.push('Выберите пол и сплит.')
        showSnackbar('Выберите пол и сплит.', 'error')
        console.warn('Не выбран пол или сплит.')
        return
      }
      console.log('Начало генерации сплита (реальный вызов).')
      await generateSplitPlan(gender.value, selectedSplit.value)
      console.log('Генерация сплита (реальный вызов) завершена.')
    }

    // Метод-обёртка с задержкой 1.5–2.5 сек
    async function generateSplitWorkout() {
      // Включаем флаг загрузки
      isLoading.value = true

      // Задержка 1.5–2.5 сек
      const delayTime = 1500 + Math.random() * 1000
      await new Promise((resolve) => setTimeout(resolve, delayTime))

      // Вызываем «реальный» метод
      await realGenerateSplitWorkout()

      // Отключаем флаг загрузки
      isLoading.value = false
    }

    // Функция для названия дня (0..6)
    const dayName = (index: number) => {
      const days = [
        'Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'
      ]
      return days[index % 7]
    }

    // Методы изменения повторений / удаления / перегенерации
    const standardRepsValues = [5, 6, 8, 10, 12, 15, 20]
    function getSets(reps: number): number {
      if (reps === 5) return 5
      if (reps === 6 || reps === 8) return 4
      if (reps === 10 || reps === 12 || reps === 15 || reps === 20) return 3
      return 3
    }
    const increaseRepsSplit = (exercisesArr: any, index: number) => {
      const ex = exercisesArr[index]
      const current = ex.reps
      const idx = standardRepsValues.indexOf(current)
      let newReps
      if (idx !== -1 && idx < standardRepsValues.length - 1) {
        newReps = standardRepsValues[idx + 1]
      } else {
        newReps = current + 1
      }
      ex.reps = newReps
      ex.sets = getSets(ex.reps)
    }
    const decreaseRepsSplit = (exercisesArr: any, index: number) => {
      const ex = exercisesArr[index]
      const current = ex.reps
      const idx = standardRepsValues.indexOf(current)
      let newReps
      if (idx > 0) {
        newReps = standardRepsValues[idx - 1]
      } else if (idx === 0) {
        newReps = current - 1
      } else {
        newReps = current - 1
      }
      if (newReps >= 1) {
        ex.reps = newReps
        ex.sets = getSets(ex.reps)
      }
    }
    const removeExerciseSplit = (exercisesArr: any, index: number) => {
      exercisesArr.splice(index, 1)
    }
    const regenerateExerciseSplit = (exercisesArr: any, index: number) => {
      const ex = exercisesArr[index]
      ex.name = ex.name
      console.log(`Упражнение перегенерировано: ${ex.name}`)
    }

    // Загрузка сплитов при монтировании
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

    onMounted(async () => {
      console.log('Компонент TrainingOnWeek.vue смонтирован.')
      await loadSplits()

      // Инициализация Telegram
      if (process.client) {
        console.log('Инициализация Telegram.')
        const launchParams = retrieveLaunchParams()
        initData.value = launchParams.initData
        if (initData.value && initData.value.user) {
          userData.value = initData.value.user
          telegramUserId.value = userData.value.id
          console.log('Telegram user ID:', telegramUserId.value)
        } else {
          console.error('Нет данных пользователя (Telegram).')
          showSnackbar('Нет данных пользователя (Telegram).', 'error')
        }
      }
    })

    return {
      // Пол и массивы
      genders,
      gender,
      allSplits,
      selectedSplit,
      availableSplits,

      // Флаги
      isLoading,
      isGenerating,
      showBottomSheet,
      errorMessages,
      snackbar,

      // Telegram
      userData,
      telegramUserId,
      initData,

      // Методы выбора
      selectGender,
      selectSplit,

      // Метод-обёртка (с задержкой)
      generateSplitWorkout,

      // «Реальный» метод (не вызывается из шаблона напрямую)
      realGenerateSplitWorkout,

      // Вспомогательный метод
      dayName,

      // Из хука
      finalPlan,
      generateSplitPlan,
      sendWorkoutPlan,

      // Методы по работе с упражнениями (reps, remove, regenerate)
      increaseRepsSplit,
      decreaseRepsSplit,
      removeExerciseSplit,
      regenerateExerciseSplit
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

/* Блок под каждый день (7 штук). */
.day-block {
  margin-bottom: 16px; /* Сохраняем заданный отступ между днями */
  background-color: rgba(55, 55, 55, 0.15);
  border-radius: 8px;
  padding: 8px;
}

/* Заголовок дня */
.day-heading {
  font-size: 1.1rem;
  color: #fff;
  margin-bottom: 4px;
  text-shadow: 0 0 3px #111;
  border-bottom: 1px solid #444;
  padding-bottom: 2px;
}

/* Подпись дня недели */
.day-name {
  color: #ccc;
  font-size: 0.9rem;
  margin-top: 2px;
}

/* «Отдых» */
.rest-label {
  color: #f2f2f2;
  font-style: italic;
  margin-left: 4px;
}

/* «Таблица» (список) упражнений */
.day-exercises-table {
  padding-left: 8px;
  margin-top: 4px;
  border-left: 2px dashed #666;
}

/* Каждая строка упражнения */
.exercise-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  background-color: rgba(68,68,68,0.2);
  border-radius: 6px;
  padding: 4px;
  margin-left: 4px;
}

/* Название упражнения */
.exercise-name {
  flex: 1;
  font-weight: 600;
  color: #fafafa;
  margin-right: 4px;
  text-shadow: 0 0 2px #000;
}

/* Общий контейнер для +/- и refresh/delete */
.row-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Левый блок (минус, reps, плюс) */
.sets-reps-row {
  display: flex;
  align-items: center;
  gap: 0;
}

/* sets×reps */
.sets-reps-text {
  font-weight: bold;
  min-width: 50px;
  text-align: center;
  color: #ececec;
  background-color: #444;
  border-radius: 14px;
  padding: 2px 6px;
  margin: 0 4px;
  box-shadow: inset 0 0 3px rgba(0,0,0,0.5);
}

/* Правый блок (refresh / delete) — по вертикали */
.vertical-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

/* Вращение иконки */
.rotatingDumbbell {
  animation: rotate-dumbbell 1s linear infinite;
}

@keyframes rotate-dumbbell {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
