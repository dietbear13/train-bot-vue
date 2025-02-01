<!--/components/nutrition/TrainingByMuscles.vue-->
<template>
  <v-form
      @submit.prevent="generateWorkout"
      style="background-color: #121212;"
  >
    <!-- Выбор пола пользователя -->
    <v-card
        class="mb-2 dark-background"
        variant="tonal"
        style="background-color: #121212;"
    >
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
    <v-card
        class="my-2 dark-background pa-3"
        variant="tonal"
        style="background-color: #121212;"
    >
      <v-card-text class="pa-1">
        <template v-if="isDataLoading">
          <v-row>
            <v-col cols="6" v-for="n in 8" :key="'main-group-skeleton-' + n">
              <v-skeleton-loader height="16px" type="button" class="mb-0" />
            </v-col>
          </v-row>
        </template>
        <template v-else>
          <v-row>
            <v-col
                cols="6"
                class="px-2 py-0"
                v-for="(option, index) in muscleGroups"
                :key="option"
            >
              <v-btn
                  :value="option"
                  class="group-button mx-auto my-1 px-2 text-break"
                  style="min-width: 100%;"
                  :class="{ 'selected-button': muscleGroup === option }"
                  @click="selectMuscleGroup(option)"
                  rounded="lg"
                  block
                  variant="text"
              >
                {{ option }}
              </v-btn>
            </v-col>
          </v-row>
        </template>
      </v-card-text>
    </v-card>

    <!-- Выбор подгруппы мышц -->
    <template v-if="!isDataLoading && muscleSubgroups.length > 0">
      <v-card
          class="my-2 dark-background pa-3"
          variant="tonal"
          style="background-color: #121212;"
      >
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
                  class="group-button text-break mx-auto my-1 py-1 px-2"
                  style="min-width: 100%;"
                  :class="{ 'selected-button': muscleSubgroup === option }"
                  @click="selectMuscleSubgroup(option)"
                  rounded="lg"
                  block
                  variant="text"
              >
                {{ option }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </template>

    <!-- Кнопка для генерации тренировки или сообщение -->
    <template v-if="gender && muscleGroup && muscleSubgroup">
      <v-btn
          :disabled="isGenerating || false"
          @click="generateWorkout"
          color="success"
          class="mt-1"
          rounded="lg"
          width="100%"
      >
        <!-- Иконка, которая при загрузке вращается -->
        <span v-if="isLoading">Создаю.. </span>
        <span v-else>Создать </span>
        <v-icon right :class="{ rotatingDumbbell: isLoading }">
          mdi-dumbbell
        </v-icon>
      </v-btn>
    </template>

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
        :title="muscleGroup"
    >
      <v-card-text class="ma-0">
        <!-- Если идёт загрузка - показываем рыбное содержимое -->
        <div v-if="isLoading" class="mb-2" style="text-align:center;">
          <p>Создаю тренировку..</p>
          <v-progress-linear
              color="primary"
              indeterminate
              height="4"
              class="mt-3"
          ></v-progress-linear>
        </div>

        <!-- Если НЕ идёт загрузка - показываем реальный список упражнений -->
        <v-data-table
            v-else
            :items="workoutResults"
            class="rounded-bottom-sheet fixed-table-layout"
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
                <td class="action-handle" style="padding: 0 4px;">
                  <div
                      class="drag-handle"
                      style="display: flex; align-items: center;"
                  >
                    <v-icon class="mr-1">mdi-shuffle-variant</v-icon>
                  </div>
                </td>
                <td class="drag-handle" style="padding: 0 4px;">
                  {{ formatExerciseName(element.name) }}
                </td>
                <td
                    class="fixed-width sets-reps-column"
                    style="padding: 0 4px;"
                >
                  <div class="sets-reps-container">
                    <v-btn
                        icon
                        @click="decreaseReps(index)"
                        variant="plain"
                        class="mx-0"
                        size="24px"
                        color="#db5856"
                    >
                      <v-icon small>mdi-minus</v-icon>
                    </v-btn>
                    <span class="sets-reps-text">
                      {{ element.sets }} × {{ element.reps }}
                    </span>
                    <v-btn
                        icon
                        size="24px"
                        color="#77dd77"
                        @click="increaseReps(index)"
                        variant="plain"
                        class="mx-0"
                    >
                      <v-icon small>mdi-plus</v-icon>
                    </v-btn>
                  </div>
                </td>
                <td class="fixed-width action-column" style="padding: 0 4px;">
                  <div style="display: flex; flex-direction: column; align-items: center;">
                    <v-btn
                        icon
                        @click="regenerateExercise(index)"
                        variant="plain"
                        size="24px"
                        color="primary"
                        class="my-1"
                    >
                      <v-icon>mdi-refresh</v-icon>
                    </v-btn>
                    <v-btn
                        icon
                        @click="removeExercise(index)"
                        variant="plain"
                        size="24px"
                        color="#db5856"
                        class="my-1"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
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
              color="success"
              @click="generateWorkout"
              :disabled="isGenerating || false"
              rounded="lg"
              class="mb-1"
          >
            <v-icon left>mdi-refresh</v-icon>
            <span v-if="isLoading">Создаю другую..</span>
            <span v-else>Создать другую</span>
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
  </v-form>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { retrieveLaunchParams } from '@telegram-apps/sdk'
import AddExercise from './AddExercise.vue'
import BottomSheetWithClose from '~/components/shared/BottomSheetWithClose.vue'
import useWorkoutGenerator from '~/composables/useWorkoutGenerator'
import { useApi } from '~/composables/useApi' // Импортируем apiRequest

// --- Интерфейсы ---
interface RepetitionLevels {
  maleRepsLight: string
  maleRepsMedium: string
  maleRepsHeavy: string
  femaleRepsLight: string
  femaleRepsMedium: string
  femaleRepsHeavy: string
}

export interface Exercise extends RepetitionLevels {
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

export interface Pattern {
  _id: string
  gender: string
  complexNumber: string
  muscleGroup: string
  subcategory: string
  mainMuscle: string
  exercises: PatternExercise[]
  __v: number
}

export interface WorkoutResult {
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
    const { apiRequest } = useApi()
    const gender = ref<string>('')             // Пол
    const muscleGroup = ref<string>('')        // Основная группа
    const muscleSubgroup = ref<string>('')     // Подгруппа

    const date = ref<string>(new Date().toLocaleDateString('ru-RU'))

    const genders = ['Мужчина', 'Женщина']     // Поскольку это просто массив, оставим так
    const muscleGroups = ref<string[]>([])
    const muscleSubgroups = ref<string[]>([])
    const complexes = ref<string[]>([])

    // Результаты тренировки
    const workoutResults = ref<WorkoutResult[]>([])

    // Данные
    const exercises = ref<Exercise[]>([])
    const patterns = ref<Pattern[]>([])

    // Флаги и служебные переменные
    const isGenerating = ref<boolean>(false)
    const timer = ref<number>(0)

    // Вместо let intervalId: number | null = null
    // можно использовать ref, но автор кода хранит это в объекте:
    const intervalId = { value: null as number | null }

    const errorMessages = ref<string[]>([])

    // Управление нижними листами
    const showBottomSheet = ref<boolean>(false)
    const showAddExerciseSheet = ref<boolean>(false)
    const selectedPattern = ref<Pattern | null>(null)
    const usedExerciseIds = ref<Set<string>>(new Set())

    // Snackbar
    const snackbar = ref<SnackbarState>({
      show: false,
      message: '',
      color: 'info',
      timeout: 1500
    })
    const showSnackbar = (message: string, color: string = 'info'): void => {
      snackbar.value.message = message
      snackbar.value.color = color
      snackbar.value.show = true
    }

    // ----------------------------------------------------------
    //   НОВЫЕ ПОЛЯ ДЛЯ «ПЛАВНОЙ ЗАГРУЗКИ» (2.5–3.5 СЕК)
    // ----------------------------------------------------------
    const isLoading = ref<boolean>(false)      // Показывать ли плейсхолдер
    const isDataLoading = ref<boolean>(false)  // Флаг для загрузки данных из API

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

    const populateMuscleGroups = (): void => {
      const excludedCategories = ['йога', 'растяжка']
      const groups = new Set(
          exercises.value
              .map((e) => e.category.trim().toLowerCase())
              .filter((category) => !excludedCategories.includes(category))
      )
      muscleGroups.value = Array.from(groups).map((group) => capitalize(group))
    }

    const populateMuscleSubgroups = (): void => {
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

    const populateComplexes = (): void => {
      complexes.value = []
    }

    const selectGender = (option: string): void => {
      gender.value = option
      muscleGroup.value = ''
      muscleSubgroup.value = ''
      populateMuscleGroups()
      populateMuscleSubgroups()
      populateComplexes()
    }

    const selectMuscleGroup = (option: string): void => {
      muscleGroup.value = option
      muscleSubgroup.value = ''
      populateMuscleSubgroups()
      populateComplexes()
    }

    const selectMuscleSubgroup = (option: string): void => {
      muscleSubgroup.value = option
      populateComplexes()
    }

    // ---------------- Загрузка данных ----------------
    const loadExercises = async (): Promise<void> => {
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

    const loadPatterns = async (): Promise<void> => {
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
    const sendWorkout = async (): Promise<void> => {
      if (!telegramUserId.value || !workoutResults.value.length) {
        showSnackbar(
            'Не указан Telegram ID или отсутствуют результаты тренировки.',
            'error'
        )
        return
      }
      try {
        const workoutData = JSON.parse(JSON.stringify(workoutResults.value))
        await apiRequest('post', 'bot/send-workout', {
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
    const handleAddExercise = (newExercise: WorkoutResult): void => {
      workoutResults.value.push(newExercise)
      usedExerciseIds.value.add(newExercise._id)
    }

    // ---------------- Жизненный цикл ----------------
    onMounted(async () => {
      isDataLoading.value = true
      await loadExercises()
      await loadPatterns()
      populateMuscleGroups()
      populateMuscleSubgroups()
      populateComplexes()
      isDataLoading.value = false

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

    const openAddExerciseSheet = (): void => {
      showAddExerciseSheet.value = true
    }

    // ----------------------------------------------------------
    // Переопределяем generateWorkout, чтобы "обернуть" вызов
    // из хука в логику "имитации загрузки".
    // ----------------------------------------------------------
    const realGenerateWorkout = generateWorkout

    async function generateWorkoutWithLoading(): Promise<void> {
      // 1) Скрываем реальный список, показываем плейсхолдер
      isLoading.value = true
      workoutResults.value = []

      // 2) 1.5–2.5 секунды
      const loadTime = 2000 + Math.random() * 500
      await new Promise((resolve) => setTimeout(resolve, loadTime))

      await realGenerateWorkout()

      // 4) Прячем "загрузку"
      isLoading.value = false
    }

    /**
     * Новый метод: делает первый символ заглавным,
     * остальные символы остаются в исходном регистре.
     */
    const formatExerciseName = (rawName: string): string => {
      if (!rawName) return ''
      return rawName.charAt(0).toUpperCase() + rawName.slice(1)
    }

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

      // Поле isLoading, чтобы иконка крутилась и отображался плейсхолдер
      isLoading,

      // Новое поле для состояния загрузки данных
      isDataLoading,

      // Методы выбора
      selectGender,
      selectMuscleGroup,
      selectMuscleSubgroup,
      populateMuscleGroups,
      populateMuscleSubgroups,
      populateComplexes,

      // Методы для загрузки
      loadExercises,
      loadPatterns,

      // Из хука
      removeExercise,
      regenerateExercise,
      increaseReps,
      decreaseReps,

      // Обёртка
      generateWorkout: generateWorkoutWithLoading,

      // Прочие
      sendWorkout,
      openAddExerciseSheet,
      handleAddExercise,
      showSnackbar,

      // Метод для форматирования названия упражнения
      formatExerciseName
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

.group-button {
  min-width: 45%;
}

.selected-button {
  background-color: var(--v-primary-base);
  color: white;
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

/* Остальные стили остаются без изменений */
.rounded-bottom-sheet {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
}

/* Добавляем фиксированный расклад таблицы */
.fixed-table-layout {
  table-layout: fixed;
  width: 100%;
}

.sets-reps-column {
  width: 116px;
  text-align: right;
}

.action-column {
  width: 60px; /* Установите нужную ширину в пикселях */
  max-width: 60px;
  text-align: center; /* Или right, если предпочитаете */
  overflow: hidden;
  white-space: nowrap;
}

/* Перетаскиваемый хендл */
.action-handle {
  width: 40px; /* Ширина для хендла перетаскивания */
  text-align: center;
}

/* Убираем отступы и выравниваем кнопки */
.v-btn .v-icon {
  margin-right: 0;
}

/* Перетаскивание */
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

v-btn {
  border-radius: 14px;
}

.wrap-text {
  white-space: normal !important;
}


.sets-reps-container span {
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

/* Текст внутри контейнера подходов и повторений */
.sets-reps-text {
  font-weight: bold;
  min-width: 54px;
  text-align: center;
  color: #ececec;
  background-color: #444;
  border-radius: 14px;
  padding: 2px 6px;
  margin: 0 4px;
  box-shadow: inset 0 0 3px rgba(0,0,0,0.5);
}

/* Кнопка закрытия не перекрывается */
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
