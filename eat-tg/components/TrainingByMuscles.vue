<!-- components/TrainingByMuscles.vue -->
<template>
  <v-form @submit.prevent="generateWorkout">
    <!-- Выбор пола пользователя -->
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

    <!-- Выбор основной мышечной группы -->
    <v-card class="my-2 dark-background pa-3" variant="tonal">
      <v-card-text class="pa-1">
        <v-row>
          <v-col
              cols="6"
              class="px-2 py-0"
              v-for="(option, index) in muscleGroups"
              :key="option"
          >
            <v-btn
                :value="option"
                class="group-button mx-auto my-1 px-2"
                style="min-width: 100%;"
                :class="{ 'selected-button': muscleGroup === option }"
                @click="selectMuscleGroup(option)"
                rounded="lg"
                block
            >
              {{ option }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Выбор подгруппы мышц -->
    <v-card class="my-2 dark-background pa-3" variant="tonal">
      <v-card-text class="pa-1">
        <v-row>
          <v-col
              cols="6"
              class="px-2 py-0"
              v-for="(option) in muscleSubgroups"
              :key="option"
          >
            <v-btn
                :value="option"
                class="group-button mx-auto my-1 py-1 px-2"
                style="min-width: 100%;"
                :class="{ 'selected-button': muscleSubgroup === option }"
                @click="selectMuscleSubgroup(option)"
                rounded="lg"
                block
            >
              {{ option }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Кнопка для генерации тренировки -->
    <v-btn
        :disabled="isGenerating || /* timer > 0 */ false"
        @click="generateWorkout"
        color="success"
        class="mt-1"
        rounded="lg"
        width="100%"
    >
      <v-icon left>mdi-dumbbell</v-icon>
      <!--
        СТАРЫЙ ВАРИАНТ (не удаляем, лишь закомментировали):
        {{ timer > 0 ? `Повторная генерация через ${timer} с` : 'Сгенерировать' }}
      -->
      <!-- НОВЫЙ ВАРИАНТ -->
      <span v-if="isLoading">Генерируем...</span>
      <span v-else>Сгенерировать</span>
    </v-btn>
    <!-- Информационное сообщение -->
    <p class="mt-2 ml-2" style="color: #858585">Данные не хранятся и не используются.</p>

    <!-- Сообщение об ошибке -->
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

    <!-- Нижний лист с таблицей упражнений, используя BottomSheetWithClose -->
    <BottomSheetWithClose
        v-model="showBottomSheet"
        icon="mdi-dumbbell"
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
          <!-- Можно показать любой "рыбный" контент -->
          <p style="margin-top: 1rem;">[ Рыбное (плейсхолдер) содержимое ]</p>
        </div>

        <!-- Если НЕ идёт загрузка - показываем реальный список упражнений -->
        <v-data-table
            v-else
            :items="workoutResults"
            class="rounded-bottom-sheet"
            hide-default-header
            hide-default-footer
        >
          <!-- Перетаскиваемые строки таблицы -->
          <draggable
              tag="tbody"
              v-model="workoutResults"
              handle=".drag-handle"
              animation="200"
              item-key="_id"
          >
            <template #item="{ element, index }">
              <tr>
                <td style="cursor: move; padding: 0 4px;">
                  <div
                      class="drag-handle"
                      style="display: flex; align-items: center;"
                  >
                    <v-icon class="mr-1">mdi-shuffle-variant</v-icon>
                  </div>
                </td>
                <td class="drag-handle" style="padding: 0 4px;">
                  {{ element.name }}
                </td>
                <td class="fixed-width sets-reps-column" style="padding: 0 4px;">
                  <div class="sets-reps-container">
                    <v-btn
                        icon
                        small
                        @click="decreaseReps(index)"
                        variant="plain"
                        class="mx-0"
                    >
                      <v-icon small>mdi-minus</v-icon>
                    </v-btn>
                    <span>{{ element.sets }} × {{ element.reps }}</span>
                    <v-btn
                        icon
                        max-width="30px"
                        max-height="30px"
                        @click="increaseReps(index)"
                        variant="plain"
                        class="mx-0"
                    >
                      <v-icon small>mdi-plus</v-icon>
                    </v-btn>
                  </div>
                </td>
                <td class="fixed-width action-column" style="padding: 0 4px;">
                  <v-btn icon @click="regenerateExercise(index)" variant="plain">
                    <v-icon>mdi-refresh</v-icon>
                  </v-btn>
                  <v-btn icon @click="removeExercise(index)" variant="plain">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>
              </tr>
            </template>
          </draggable>
        </v-data-table>

        <!-- Кнопка для добавления упражнения -->
        <div class="text-center mt-1">
          <v-btn
              color="secondary"
              @click="openAddExerciseSheet"
              rounded="lg"
              icon
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>

        <!-- Кнопки действий -->
        <div class="text-center mt-2">
          <v-btn
              color="primary"
              @click="generateWorkout"
              :disabled="isGenerating || /* timer > 0 */ false"
              rounded="lg"
              class="mb-1"
          >
            <v-icon left>mdi-refresh</v-icon>
            <!-- СТАРЫЙ ВАРИАНТ (не удаляем): {{ timer > 0 ? `Повторная генерация через ${timer} с` : 'Сгенерировать заново' }} -->
            <span v-if="isLoading">Генерируем заново...</span>
            <span v-else>Сгенерировать заново</span>
          </v-btn>
          <v-btn
              color="primary"
              @click="sendWorkout"
              :disabled="!telegramUserId"
              rounded="lg"
          >
            <v-icon left>mdi-send</v-icon>
            Отправить себе
          </v-btn>
        </div>
      </v-card-text>

      <!-- Компонент AddExercise -->
      <AddExercise
          v-model="showAddExerciseSheet"
          :gender="gender"
          :muscleGroup="muscleGroup"
          :muscleSubgroup="muscleSubgroup"
          :exercises="exercises"
          :usedExerciseIds="usedExerciseIds"
          @add-exercise="handleAddExercise"
      />
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
      <template #action="{ attrs }">
        <v-btn color="white" text v-bind="attrs" @click="snackbar.show = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </v-form>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import axios, { type AxiosRequestConfig, type Method } from 'axios'
import draggable from 'vuedraggable'
import { retrieveLaunchParams } from '@telegram-apps/sdk'
import AddExercise from './AddExercise.vue'
import BottomSheetWithClose from '~/components/BottomSheetWithClose.vue'

// 1) Импортируем ваш хук:
import useWorkoutGenerator from '~/composables/useWorkoutGenerator'

// --- Интерфейсы ---
interface RepetitionLevels {
  maleRepsLight: string
  maleRepsMedium: string
  maleRepsHeavy: string
  femaleRepsLight: string
  femaleRepsMedium: string
  femaleRepsHeavy: string
}

interface Exercise extends RepetitionLevels {
  _id: string
  category: string
  subcategory: string
  mainMuscle: string
  additionalMuscles: string
  typeExercise: string
  difficultyLevel: string
  difficultyLevelOld: string
  name: string
  equipment: string
  isWarnGif: boolean
  technique: string
  gifImage: string
  spineRestrictions: boolean
  kneeRestrictions: boolean
  shoulderRestrictions: boolean
  __v: number
}

interface PatternExercise {
  exerciseLevel: string
  repetitionLevel: string
}

interface Pattern {
  _id: string
  gender: string
  complexNumber: string
  muscleGroup: string
  subcategory: string
  mainMuscle: string
  exercises: PatternExercise[]
  __v: number
}

interface WorkoutResult {
  _id: string
  name: string
  sets: number
  reps: number
}

interface TelegramUserData {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
}

interface SnackbarState {
  show: boolean
  message: string
  color: string
  timeout?: number
}

// Функция для запросов с fallback
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
    // Пробуем резервный сервер
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

export default defineComponent({
  name: 'TrainingByMuscles',
  components: {
    draggable,
    AddExercise,
    BottomSheetWithClose,
  },
  setup() {
    // ---------------- Основные ссылки ----------------
    const userData = ref<TelegramUserData | null>(null)
    const telegramUserId = ref<number | null>(null)
    const initData = ref<any>(null)

    const gender = ref<string>('')
    const muscleGroup = ref<string>('')
    const muscleSubgroup = ref<string>('')

    const date = ref<string>(new Date().toLocaleDateString('ru-RU'))

    const genders = ['Мужчина', 'Женщина']
    const muscleGroups = ref<string[]>([])
    const muscleSubgroups = ref<string[]>([])
    const complexes = ref<string[]>([])

    // Результаты тренировки
    const workoutResults = ref<WorkoutResult[]>([])

    // Данные
    const exercises = ref<Exercise[]>([])
    const patterns = ref<Pattern[]>([])

    // Флаги и служебные переменные
    const isGenerating = ref(false)
    const timer = ref(0)
    // Вместо let intervalId: number | null = null,
    // можно обернуть в объект, чтобы передавать это в хук
    const intervalId = { value: null as number | null }

    const errorMessages = ref<string[]>([])

    // Управление нижними листами
    const showBottomSheet = ref(false)
    const showAddExerciseSheet = ref(false)
    const selectedPattern = ref<Pattern | null>(null)
    const usedExerciseIds = ref<Set<string>>(new Set())

    // Snackbar
    const snackbar = ref<SnackbarState>({
      show: false,
      message: '',
      color: 'info',
      timeout: 1500
    })
    const showSnackbar = (message: string, color: string = 'info') => {
      snackbar.value.message = message
      snackbar.value.color = color
      snackbar.value.show = true
    }

    // ----------------------------------------------------------
    //   НОВЫЕ ПОЛЯ ДЛЯ «ПЛАВНОЙ ЗАГРУЗКИ» (2.5–3.5 СЕК)
    // ----------------------------------------------------------
    // Используем isLoading, чтобы понимать, показывать ли плейсхолдер.
    const isLoading = ref(false)

    // ----------------------------------------------------------
    //   Подключаем наш хук (generateWorkout, etc.)
    // ----------------------------------------------------------
    const {
      generateWorkout,
      removeExercise,
      regenerateExercise,
      increaseReps,
      decreaseReps
    } = useWorkoutGenerator({
      gender,
      muscleGroup,
      muscleSubgroup,
      patterns,
      exercises,
      usedExerciseIds,
      workoutResults,
      selectedPattern,
      isGenerating,
      timer,
      errorMessages,
      intervalId,
      showBottomSheet,
      showSnackbar
    })

    // ---------------- Методы для выбора группы/подгруппы мышц ----------------
    const capitalize = (str: string): string =>
        str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

    const populateMuscleGroups = () => {
      const excludedCategories = ['йога', 'растяжка']
      const groups = new Set(
          exercises.value
              .map((e) => e.category.trim().toLowerCase())
              .filter((category) => !excludedCategories.includes(category))
      )
      muscleGroups.value = Array.from(groups).map((group) => capitalize(group))
    }

    const populateMuscleSubgroups = () => {
      if (!muscleGroup.value || !gender.value) {
        muscleSubgroups.value = []
        console.log('Мышечная группа или пол не выбраны. Очищаем подгруппы.')
        return
      }

      const mg = muscleGroup.value.trim().toLowerCase()
      const genderLower = gender.value.trim().toLowerCase()
      console.log(
          `Выбранная основная мышечная группа: "${mg}" и пол: "${genderLower}"`
      )

      // 1. Фильтруем паттерны
      const relevantPatterns = patterns.value.filter((p) => {
        const genderMatch = p.gender.toLowerCase().includes(genderLower)
        const muscleGroupMatch = p.muscleGroup.toLowerCase() === mg
        return genderMatch && muscleGroupMatch
      })

      console.log('Соответствующие паттерны:', relevantPatterns)

      // 2. Уникальные подкатегории
      const subcategoriesSet = new Set(
          relevantPatterns
              .map((p) => p.subcategory.trim())
              .filter((subcat) => subcat !== '—' && subcat !== '')
      )

      console.log(
          'Найденные субкатегории из паттернов:',
          Array.from(subcategoriesSet)
      )

      muscleSubgroups.value = Array.from(subcategoriesSet)
          .map((subcat) => capitalize(subcat.toLowerCase()))
          .filter((subcat) => subcat !== '—' && subcat !== '')
          .sort()

      console.log(
          'Отфильтрованные и капитализированные подгруппы мышц:',
          muscleSubgroups.value
      )
    }

    const populateComplexes = () => {
      complexes.value = []
    }

    const selectGender = (option: string) => {
      gender.value = option
      muscleGroup.value = ''
      muscleSubgroup.value = ''
      populateMuscleGroups()
      populateMuscleSubgroups()
      populateComplexes()
    }

    const selectMuscleGroup = (option: string) => {
      muscleGroup.value = option
      muscleSubgroup.value = ''
      populateMuscleSubgroups()
      populateComplexes()
    }

    const selectMuscleSubgroup = (option: string) => {
      muscleSubgroup.value = option
      populateComplexes()
    }

    // ---------------- Загрузка данных ----------------
    const loadExercises = async () => {
      try {
        const data = await apiRequest<Exercise[]>('get', 'exercises')
        exercises.value = data.map((exercise) => ({
          ...exercise,
          _id: typeof exercise._id === 'string' ? exercise._id : exercise._id.$oid
        }))
        console.log('Упражнения загружены:', exercises.value)
      } catch (error: any) {
        console.error('Ошибка при загрузке упражнений:', error.message)
        showSnackbar('Не удалось загрузить упражнения. Попробуйте позже.', 'error')
      }
    }

    const loadPatterns = async () => {
      try {
        const data = await apiRequest<Pattern[]>('get', 'patterns')
        patterns.value = data.map((pattern) => ({
          ...pattern,
          _id: typeof pattern._id === 'string' ? pattern._id : pattern._id.$oid
        }))
        console.log('Загруженные паттерны:', patterns.value)
      } catch (error: any) {
        console.error('Ошибка при загрузке паттернов:', error.message)
        showSnackbar('Не удалось загрузить паттерны. Попробуйте позже.', 'error')
      }
    }

    // ---------------- Отправка в Telegram ----------------
    const sendWorkout = async () => {
      if (!telegramUserId.value || !workoutResults.value.length) {
        showSnackbar(
            'Не указан Telegram ID или отсутствуют результаты тренировки.',
            'error'
        )
        return
      }
      try {
        const workoutData = JSON.parse(JSON.stringify(workoutResults.value))
        await apiRequest('post', 'send-workout', {
          userId: telegramUserId.value,
          muscleGroup: muscleSubgroup.value,
          date: date.value,
          workout: workoutData
        })
        showSnackbar('Тренировка успешно отправлена!', 'success')
      } catch (error) {
        console.error('Ошибка при отправке тренировки:', error)
        showSnackbar('Не удалось отправить тренировку. Попробуйте позже.', 'error')
      }
    }

    // ---------------- Обработка добавления упражнения ----------------
    const handleAddExercise = (newExercise: WorkoutResult) => {
      workoutResults.value.push(newExercise)
      usedExerciseIds.value.add(newExercise._id)
    }

    // ---------------- Жизненный цикл ----------------
    onMounted(async () => {
      await loadExercises()
      await loadPatterns()
      populateMuscleGroups()
      populateMuscleSubgroups()
      populateComplexes()

      // Инициализация Telegram
      if (process.client) {
        const launchParams = retrieveLaunchParams()
        initData.value = launchParams.initData
        if (initData.value && initData.value.user) {
          userData.value = initData.value.user
          telegramUserId.value = userData.value.id
        } else {
          console.error('Не удалось получить данные пользователя.')
          showSnackbar(
              'Не удалось получить данные пользователя. Запустите внутри Telegram.',
              'error'
          )
        }
      }
    })

    const openAddExerciseSheet = () => {
      showAddExerciseSheet.value = true
    }

    // ----------------------------------------------------------
    // Переопределяем generateWorkout, чтобы "обернуть" вызов
    // из хука в нашу логику "имитации загрузки".
    // Аналогично при "Сгенерировать заново".
    // ----------------------------------------------------------
    // Исходный generateWorkout взят из хука,
    // мы создаём дополнительный метод-обёртку:
    const realGenerateWorkout = generateWorkout

    async function generateWorkoutWithLoading() {
      // 1) Скрываем реальный список, показываем "рыбный" плейсхолдер
      isLoading.value = true
      // Очищаем текущие результаты, чтобы не мерцали
      // (либо можно хранить, но скрывать)
      workoutResults.value = []

      // 2) Задаём время имитации 2.5-3.5 секунд
      const loadTime = 2500 + Math.random() * 1000

      // 3) Ждём loadTime
      await new Promise((resolve) => setTimeout(resolve, loadTime))

      // 4) Теперь вызываем "настоящую" логику генерации
      //    (она заполнит workoutResults, set isGenerating.value, etc.)
      realGenerateWorkout()

      // 5) Как только realGenerateWorkout выполнится — скрываем "загрузку"
      //    Но в хуке generateWorkout уже ставится isGenerating.value = false
      //    Поэтому вручную можем просто:
      isLoading.value = false
    }

    // Теперь в шаблоне вместо @click="generateWorkout"
    // мы будем звать generateWorkoutWithLoading
    // Но *ничего не удаляя* — пусть старая ссылка указывает
    // всё же на generateWorkoutWithLoading.
    //
    // Так при "Сгенерировать заново" тоже вызовется
    // generateWorkoutWithLoading().
    //
    // При перегенерации одного упражнения (кнопка @click="regenerateExercise")
    // мы ничего не меняем, всё остаётся как есть.

    return {
      // Состояние
      gender,
      muscleGroup,
      muscleSubgroup,
      genders,
      muscleGroups,
      muscleSubgroups,
      complexes,
      workoutResults,
      exercises,
      patterns,
      isGenerating,
      timer,
      errorMessages,
      showBottomSheet,
      showAddExerciseSheet,
      selectedPattern,
      usedExerciseIds,
      date,
      snackbar,
      telegramUserId,
      initData,

      // Новое состояние
      isLoading, // чтобы в шаблоне показывать/скрывать плейсхолдер

      // Методы выбора
      selectGender,
      selectMuscleGroup,
      selectMuscleSubgroup,
      populateMuscleGroups,
      populateMuscleSubgroups,
      populateComplexes,

      // Методы по работе с хранилищем (запросы)
      loadExercises,
      loadPatterns,

      // Из хука (не меняем, но в шаблоне заменяем использование)
      // generateWorkout, // <-- Оригинал
      removeExercise,
      regenerateExercise,
      increaseReps,
      decreaseReps,

      // Обёртка c задержкой
      generateWorkout: generateWorkoutWithLoading,

      // Прочие методы
      sendWorkout,
      openAddExerciseSheet,
      handleAddExercise,
      showSnackbar
    }
  }
})
</script>

<style scoped>
.headline {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
}

.headline.mb-4 {
  margin-bottom: 16px; /* Добавляем нижний отступ */
}

/* Остальные стили остаются без изменений */
.group-button {
  min-width: 100px;
}
.selected-button {
  background-color: var(--v-primary-base);
  color: white;
}

/* Нижний лист (BottomSheetWithClose.vue) */
.rounded-bottom-sheet {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
}

/* Колонки в таблице */
.sets-reps-column {
  width: 80px;
  text-align: right;
}
.action-column {
  width: 50px;
  text-align: right;
}

.v-btn .v-icon {
  margin-right: 0;
}
/* Эффект при перетаскивании */
.dragging {
  opacity: 0.5;
}

/* Контейнер с подходами и повторениями */
.sets-reps-container {
  display: flex;
  align-items: center;
  justify-content: center;
}
.sets-reps-container .v-btn {
  min-width: 24px;
  width: 24px;
  height: 24px;
  margin: 0 4px;
}

.v-btn {
  border-radius: 14px;
}

.sets-reps-container span {
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

/* Обеспечиваем, что кнопка закрытия всегда видна и не перекрывается */
.v-card-title {
  position: relative;
}

.v-btn[aria-label="Закрыть"] {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
}
</style>
