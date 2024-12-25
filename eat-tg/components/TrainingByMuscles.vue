<!-- components/TrainingByMuscles.vue -->
<template>
  <v-form @submit.prevent="generateWorkout">
    <!-- Информационное сообщение -->
    <p>Все вводимые в калькулятор данные не сохраняются и не используются.</p>

    <!-- Выбор пола пользователя -->
    <v-card class="my-2 dark-background pa-1" variant="tonal">
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
        :disabled="isGenerating || timer > 0"
        @click="generateWorkout"
        color="success"
        class="mt-1"
        rounded="lg"
        width="100%"
    >
      <v-icon left>mdi-dumbbell</v-icon>
      {{ timer > 0 ? `Повторная генерация через ${timer} с` : 'Сгенерировать' }}
    </v-btn>

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

    <!-- Нижний лист с таблицей упражнений -->
    <v-bottom-sheet
        v-model="showBottomSheet"
        scrim
        :persistent="false"
        content-class="rounded-bottom-sheet"
    >
      <v-card>
        <v-card-title class="ml-4">Ваша тренировка</v-card-title>
        <v-card-text class="my-2">
          <!-- Таблица упражнений -->
          <v-data-table
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
                          class="mx-1"
                      >
                        <v-icon small class="ml-2">mdi-minus</v-icon>
                      </v-btn>
                      <span>{{ element.sets }} × {{ element.reps }}</span>
                      <v-btn
                          icon
                          small
                          @click="increaseReps(index)"
                          variant="plain"
                          class="mx-1"
                      >
                        <v-icon small class="ml-2">mdi-plus</v-icon>
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

          <!-- Кнопки действий -->
          <div class="text-center mt-2">
            <v-btn
                color="primary"
                @click="generateWorkout"
                :disabled="isGenerating || timer > 0"
                rounded="lg"
                class="mb-1"
            >
              <v-icon left>mdi-refresh</v-icon>
              Сгенерировать заново
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
            <v-btn @click="showBottomSheet = false" rounded="lg" variant="plain">
              Закрыть
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-bottom-sheet>

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

const primaryBaseURL = 'https://fit-server-bot.ru.tuna.am/api/'
const fallbackBaseURL = 'http://localhost:3002/api/'

// Функция для запросов с fallback
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
  difficultyLevel: string
  name: string
  equipment: string
}

interface PatternExercise {
  muscleGroup: string
  subcategory?: string
  mainMuscle: string
  repetitionLevel: string
  additionalColumn: string
  _id?: string
}

interface Pattern {
  _id: string
  gender: string
  complexNumber: string
  exerciseLevel?: string
  exercises: PatternExercise[]
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

export default defineComponent({
  name: 'TrainingByMuscles',
  components: {
    draggable
  },
  setup() {
    // ---------------- Основные ссылки из предыдущего ответа ----------------
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

    const workoutResults = ref<WorkoutResult[]>([])

    const exercises = ref<Exercise[]>([])
    const patterns = ref<Pattern[]>([])

    const isGenerating = ref(false)
    const timer = ref(0)
    let intervalId: number | null = null
    const errorMessages = ref<string[]>([])

    const showBottomSheet = ref(false)
    const selectedPattern = ref<Pattern | null>(null)
    const usedExerciseIds = ref<Set<string>>(new Set())

    const snackbar = ref<SnackbarState>({
      show: false,
      message: '',
      color: 'info',
      timeout: 3000
    })

    // ---------------- Утилиты ----------------

    const showSnackbar = (message: string, color: string = 'info') => {
      snackbar.value.message = message
      snackbar.value.color = color
      snackbar.value.show = true
    }

    const capitalize = (str: string): string =>
        str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

    // Уровни нагрузки -> английские ключи
    const levelMapping: { [key: string]: string } = {
      'лёгкая': 'Light',
      'средняя': 'Medium',
      'тяжёлая': 'Heavy'
    }

    const standardRepsValues = [5, 6, 8, 10, 12, 15, 20]

    // Генерация случайного уровня (25% лёгкая, 50% средняя, 25% тяжёлая)
    const getRandomLoadLevel = (): string => {
      const r = Math.random()
      if (r < 0.5) return 'средняя'
      else if (r < 0.75) return 'лёгкая'
      else return 'тяжёлая'
    }

    // Количество подходов
    const getSets = (reps: number): number => {
      if (reps === 5) return 5
      if (reps === 6 || reps === 8) return 4
      if (reps === 10 || reps === 12 || reps === 15 || reps === 20) return 3
      return 3
    }

    // Возвращаем строку вида "5,8,10" или null
    const getRepsOptions = (
        exercise: Exercise,
        repetitionLevel: string,
        genderStr: string,
        loadLevel: string
    ): string | null => {
      if (!loadLevel) {
        console.warn('loadLevel is undefined or empty')
        return null
      }
      const mappedLevel = levelMapping[loadLevel.toLowerCase()]
      if (!mappedLevel) {
        console.warn(`Неизвестный уровень нагрузки: ${loadLevel}`)
        return null
      }
      const repsKey = `${genderStr === 'Мужчина' ? 'male' : 'female'}Reps${capitalize(
          mappedLevel
      )}` as keyof RepetitionLevels

      const repsValue = exercise[repsKey]
      if (!repsValue || repsValue === '—') {
        return null
      }
      return repsValue
    }

    // ---------------- Загрузка данных ----------------
    const loadExercises = async () => {
      try {
        const data = await apiRequest<Exercise[]>('get', 'exercises')
        exercises.value = data
        console.log('Упражнения загружены:', exercises.value)
      } catch (error: any) {
        console.error('Ошибка при загрузке упражнений:', error.message)
        showSnackbar('Не удалось загрузить упражнения. Попробуйте позже.', 'error')
      }
    }
    const loadPatterns = async () => {
      try {
        const data = await apiRequest<Pattern[]>('get', 'patterns')
        patterns.value = data
        console.log('Загруженные паттерны:', patterns.value)
      } catch (error: any) {
        console.error('Ошибка при загрузке паттернов:', error.message)
        showSnackbar('Не удалось загрузить паттерны. Попробуйте позже.', 'error')
      }
    }

    // ---------------- Заполнение списков ----------------
    const populateMuscleGroups = () => {
      const groups = new Set(
          exercises.value.map((e) => e.category.trim().toLowerCase())
      )
      muscleGroups.value = Array.from(groups).map((group) => capitalize(group))
    }

    const populateMuscleSubgroups = () => {
      if (!muscleGroup.value) {
        muscleSubgroups.value = []
        return
      }
      const mg = muscleGroup.value.trim().toLowerCase()
      const subgroups = new Set(
          exercises.value
              .filter((e) => e.category.trim().toLowerCase() === mg)
              .map((e) => e.subcategory.trim().toLowerCase())
      )
      muscleSubgroups.value = Array.from(subgroups).map((sub) => capitalize(sub))
    }

    const populateComplexes = () => {
      complexes.value = []
    }

    // ---------------- Методы выбора ----------------
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

    // ---------------- Генерация ----------------

    /**
     * Пытаемся найти (до N попыток) подходящее упражнение + уровень нагрузки,
     * чтобы getRepsOptions не вернул null.
     *
     * @param matchingExercises   Упражнения, соответствующие muscleGroup/mainMuscle/subcategory
     * @param repetitionLevel     patternExercise.repetitionLevel
     * @param genderStr           текущий gender
     * @param usedIds             Set уже использованных _id
     * @param maxTries            сколько раз пробуем
     * @returns                   Объект { exercise, reps, sets } или null, если не получилось
     */
    const tryFindExercise = (
        matchingExercises: Exercise[],
        repetitionLevel: string,
        genderStr: string,
        usedIds: Set<string>,
        maxTries: number = 5
    ): { exercise: Exercise; reps: number; sets: number } | null => {
      let attempt = 0
      while (attempt < maxTries) {
        attempt++

        // случайное упражнение
        const selectedExercise =
            matchingExercises[Math.floor(Math.random() * matchingExercises.length)]

        // случайный уровень нагрузки (additionalColumn)
        const randomLoad = getRandomLoadLevel()

        // получаем возможные повторы
        const repsOptions = getRepsOptions(
            selectedExercise,
            repetitionLevel,
            genderStr,
            randomLoad
        )
        if (!repsOptions) {
          // console.log('Попытка', attempt, 'не подходит', selectedExercise.name, randomLoad)
          continue // пробуем заново
        }

        // парсим строку "5,8,10"
        const repsArray = repsOptions
            .split(',')
            .map((n) => parseInt(n, 10))
            .filter((x) => !isNaN(x))

        if (repsArray.length === 0) {
          continue
        }
        // выбираем случайный reps
        const reps = repsArray[Math.floor(Math.random() * repsArray.length)]
        const sets = getSets(reps)

        // всё успешно, возвращаем результат
        return {
          exercise: selectedExercise,
          reps,
          sets
        }
      }
      return null // если не нашли за maxTries
    }

    /**
     * Генерация тренировки
     */
    const generateWorkout = () => {
      if (isGenerating.value || timer.value > 0) return
      if (!gender.value || !muscleGroup.value || !muscleSubgroup.value) {
        showSnackbar('Пожалуйста, заполните все поля.', 'error')
        return
      }

      isGenerating.value = true
      errorMessages.value = []
      workoutResults.value = []

      // Фильтруем паттерны
      const filteredPatterns = patterns.value.filter((p) => {
        const gMatch = p.gender.toLowerCase().includes(gender.value.toLowerCase())
        if (!gMatch) return false
        // проверяем, есть ли хоть одно упражнение, совпадающее по muscleGroup/subcategory
        const hasNeeded = p.exercises.some(
            (ex) =>
                ex.muscleGroup.toLowerCase() === muscleGroup.value.toLowerCase() &&
                (ex.subcategory || '').toLowerCase() === muscleSubgroup.value.toLowerCase()
        )
        return hasNeeded
      })

      if (filteredPatterns.length === 0) {
        showSnackbar('Подходящий паттерн не найден.', 'error')
        isGenerating.value = false
        return
      }

      // случайно выбираем паттерн
      const pattern =
          filteredPatterns[Math.floor(Math.random() * filteredPatterns.length)]
      selectedPattern.value = pattern
      usedExerciseIds.value = new Set()

      const workout: WorkoutResult[] = []

      for (const patternExercise of pattern.exercises) {
        const mg = patternExercise.muscleGroup.toLowerCase()
        const subcat = (patternExercise.subcategory || '').toLowerCase()
        const mm = patternExercise.mainMuscle.toLowerCase()

        // Подбираем список упражнений
        const matchingExercises = exercises.value.filter((e) => {
          if (!e.category || !e.mainMuscle) return false
          const catMatch = e.category.toLowerCase() === mg
          const subMatch = e.subcategory.toLowerCase() === subcat
          const mmMatch = e.mainMuscle.toLowerCase() === mm
          const notUsed = !usedExerciseIds.value.has(e._id)
          return catMatch && subMatch && mmMatch && notUsed
        })

        if (matchingExercises.length === 0) {
          console.warn('Нет доступных упражнений для:', patternExercise)
          continue
        }

        // Пытаемся найти подходящее упражнение + loadLevel
        const found = tryFindExercise(
            matchingExercises,
            patternExercise.repetitionLevel,
            gender.value,
            usedExerciseIds.value,
            5 // 5 попыток, можно увеличить
        )

        if (!found) {
          // Не нашли подходящее за 5 попыток
          console.warn('Не удалось подобрать упражнение для:', patternExercise)
          continue
        }

        // Добавляем в results
        usedExerciseIds.value.add(found.exercise._id)
        workout.push({
          _id: found.exercise._id,
          name: found.exercise.name,
          sets: found.sets,
          reps: found.reps
        })
      }

      // Проверка, есть ли хоть одно упражнение
      if (workout.length === 0) {
        showSnackbar('Тренировка не сгенерирована. Попробуйте другие параметры.', 'error')
      }

      workoutResults.value = workout
      console.log('Результаты тренировки:', workoutResults.value)

      // Запускаем 3-секундный таймер
      timer.value = 3
      intervalId = window.setInterval(() => {
        timer.value--
        if (timer.value <= 0 && intervalId !== null) {
          window.clearInterval(intervalId)
          intervalId = null
        }
      }, 1000)

      isGenerating.value = false
      showBottomSheet.value = true
    }

    // Удаление упражнения
    const removeExercise = (index: number) => {
      const ex = workoutResults.value[index]
      if (ex && ex._id) {
        usedExerciseIds.value.delete(ex._id)
      }
      workoutResults.value.splice(index, 1)
    }

    /**
     * Перегенерация одного упражнения (аналогично, но уже с retry).
     * Здесь мы не перебираем patternExercise, а берём selectedPattern.value.exercises[index].
     */
    const regenerateExercise = (index: number) => {
      if (!selectedPattern.value) {
        console.warn('Паттерн не выбран.')
        return
      }
      const patternExercise = selectedPattern.value.exercises[index]
      const old = workoutResults.value[index]
      if (old && old._id) {
        usedExerciseIds.value.delete(old._id)
      }

      // Составляем список подходящих
      const mg = patternExercise.muscleGroup.toLowerCase()
      const subcat = (patternExercise.subcategory || '').toLowerCase()
      const mm = patternExercise.mainMuscle.toLowerCase()

      const matchingExercises = exercises.value.filter((e) => {
        if (!e.category || !e.mainMuscle) return false
        const catMatch = e.category.toLowerCase() === mg
        const subMatch = e.subcategory.toLowerCase() === subcat
        const mmMatch = e.mainMuscle.toLowerCase() === mm
        const notUsed = !usedExerciseIds.value.has(e._id)
        return catMatch && subMatch && mmMatch && notUsed
      })

      if (matchingExercises.length === 0) {
        console.warn('Нет доступных упражнений для:', patternExercise)
        return
      }

      // Пытаемся найти подходящее
      const found = tryFindExercise(
          matchingExercises,
          patternExercise.repetitionLevel,
          gender.value,
          usedExerciseIds.value,
          5
      )

      if (!found) {
        console.warn('Не удалось подобрать новое упражнение')
        return
      }

      usedExerciseIds.value.add(found.exercise._id)

      workoutResults.value[index] = {
        _id: found.exercise._id,
        name: found.exercise.name,
        sets: found.sets,
        reps: found.reps
      }
    }

    // Увеличение/уменьшение повторений
    const increaseReps = (index: number) => {
      const ex = workoutResults.value[index]
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
    const decreaseReps = (index: number) => {
      const ex = workoutResults.value[index]
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

    // Отправка в Telegram
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

    // ---------------- Возвращаем ----------------
    return {
      gender,
      muscleGroup,
      muscleSubgroup,
      genders,
      muscleGroups,
      muscleSubgroups,
      complexes,
      workoutResults,
      telegramUserId,
      initData,
      isGenerating,
      timer,
      errorMessages,
      showBottomSheet,
      date,
      snackbar,

      // Методы
      generateWorkout,
      sendWorkout,
      selectGender,
      selectMuscleGroup,
      selectMuscleSubgroup,
      populateMuscleGroups,
      populateMuscleSubgroups,
      populateComplexes,
      removeExercise,
      regenerateExercise,
      increaseReps,
      decreaseReps,
      showSnackbar
    }
  }
})
</script>

<style scoped>
.group-button {
  min-width: 100px;
}
.selected-button {
  background-color: var(--v-primary-base);
  color: white;
}

/* Нижний лист (v-bottom-sheet) */
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
.sets-reps-container span {
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}
</style>
