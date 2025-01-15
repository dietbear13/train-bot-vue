<!-- training/TrainingOnWeek.vue -->
<template>
  <div>
    <!-- Пока идёт проверка роли (roleLoading) — показываем skeleton -->
    <div v-if="roleLoading">
      <v-skeleton-loader type="ossein" height="60px" class="mx-auto" />
    </div>

    <!-- Когда проверка роли закончена — рендерим "реальный" контент -->
    <div v-else>
      <!-- Если пользователь freeUser: показываем карточку с сообщением -->
      <div v-if="!canCreateTraining">
        <v-card class="mb-2 dark-background" variant="tonal">
          <v-card-text>
            Создание программ доступно только для подписанных на телеграм-канал.
            Перейдите на
            <nuxt-link to="/profile">страницу профиля<v-icon size="18px">mdi-account</v-icon>
            </nuxt-link> и подпишитесь.
          </v-card-text>
        </v-card>
      </div>

      <!-- Если пользователь admin или paidUser: показываем форму выбора и кнопку "Создать" -->
      <div v-else>
        <!-- Компонент полей ввода (выбор пола, типа сплита и т.д.) -->
        <TrainingOnWeekInputs
            :genders="genders"
            :gender="gender"
            :uniqueSplitTypes="uniqueSplitTypes"
            :selectedSplitType="selectedSplitType"
            :splitsToShow="splitsToShow"
            :selectedSplitId="selectedSplitId"
            :selectedSplit="selectedSplit"
            :isLoading="isLoading"
            :isGenerating="isGenerating"
            :errorMessages="errorMessages"
            @update:gender="gender = $event"
            @update:selectedSplitType="selectedSplitType = $event"
            @update:selectedSplitId="onSelectSplitId"
            @generateSplitWorkout="generateSplitWorkout"
        />

        <!-- Компонент результата (сплит на неделю) -->
        <TrainingOnWeekResult
            v-model:showBottomSheet="showBottomSheet"
            :selectedSplit="selectedSplit"
            :finalPlan="finalPlan"
            :isLoading="isLoading"
            :telegramUserId="telegramUserId"
            :refreshingDays="refreshingDays"
            @sendWorkoutPlan="sendWorkoutPlan"
            @regenerateWholeSplit="regenerateWholeSplit"
            @refreshDayExercises="refreshDayExercises"
            @increaseRepsSplit="increaseRepsSplit"
            @decreaseRepsSplit="decreaseRepsSplit"
            @removeExerciseSplit="removeExerciseSplit"
            @regenerateExerciseSplit="regenerateExerciseSplit"
            @logExercises="logExercises"
            :openExerciseInfo="openExerciseInfo"
        />
      </div>
    </div>

    <!-- Глобальный Snackbar (для вывода сообщений) -->
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

    <!-- Компонент ExerciseInfo (BottomSheetWithClose) для показа подробностей упражнения -->
    <ExerciseInfo
        v-model="showExerciseInfo"
        :exercise="selectedExercise"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { retrieveLaunchParams } from '@telegram-apps/sdk'
import { useUserStore } from '~/stores/userStore'
import { useApi } from '~/composables/useApi'
import useSplitGenerator from '~/composables/useSplitGenerator'

// Дочерние компоненты
import TrainingOnWeekInputs from '~/components/training/week/TrainingOnWeekInputs.vue'
import TrainingOnWeekResult from '~/components/training/week/TrainingOnWeekResult.vue'
import ExerciseInfo from '~/components/training/ExerciseInfo.vue'

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
  splitComment?: string
  splitId: number
  gender: string
  splitDays: string
  days: SplitDay[]
  difficultyLevelSplit: number // Убедитесь, что это поле присутствует
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
  components: {
    TrainingOnWeekInputs,
    TrainingOnWeekResult,
    ExerciseInfo
  },
  setup() {
    // ========== Pinia: проверяем роль пользователя ==========
    const userStore = useUserStore()
    // Флаг, указывающий, что роль ещё не загружена
    const roleLoading = ref(true)

    // Можно ли создавать тренировку
    const canCreateTraining = computed(
        () => userStore.role === 'admin' || userStore.role === 'paidUser'
    )

    const { apiRequest } = useApi()

    // Пол / сплиты
    const genders = ['Мужчина', 'Женщина']
    const gender = ref<string>('')

    const allSplits = ref<SplitItem[]>([])
    const selectedSplit = ref<SplitItem | null>(null)
    const selectedSplitId = ref<string | null>(null)
    const selectedSplitType = ref<string | null>(null)

    // Состояния загрузки/ошибок
    const isLoading = ref(false)
    const isGenerating = ref(false)
    const showBottomSheet = ref(false)
    const errorMessages = ref<string[]>([])
    const refreshingDays = ref<Record<number, boolean>>({})

    // Telegram
    const userData = ref<TelegramUserData | null>(null)
    const telegramUserId = ref<number | null>(null)
    const initData = ref<any>(null)

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

    // Выбранный комментарий сплита (при необходимости)
    const selectedSplitComment = ref<string | null>(null)

    // Вычисляемые списки
    const availableSplits = computed(() => {
      if (!gender.value) return []
      return allSplits.value.filter(split =>
          split.gender.toLowerCase().includes(gender.value.toLowerCase())
      )
    })
    const uniqueSplitTypes = computed(() => {
      const types = availableSplits.value.map(split => split.split)
      return Array.from(new Set(types))
    })
    const splitsToShow = computed(() => {
      if (!selectedSplitType.value) return []
      const splits = availableSplits.value.filter(
          split => split.split === selectedSplitType.value && split.splitComment
      )
      const uniqueComments = Array.from(new Set(splits.map(s => s.splitComment)))
      return uniqueComments.map(comment => {
        const eligibleSplits = splits.filter(s => s.splitComment === comment)
        const randomSplit = eligibleSplits[Math.floor(Math.random() * eligibleSplits.length)]
        return {
          _id: randomSplit._id,
          split: randomSplit.split,
          splitComment: randomSplit.splitComment,
          difficultyLevelSplit: randomSplit.difficultyLevelSplit // Добавлено
        }
      })
    })

    // Следим за изменением выбранных значений
    watch(selectedSplitId, (newId) => {
      const split = availableSplits.value.find(s => s._id === newId)
      if (split) {
        selectedSplit.value = split
        selectedSplitComment.value = split.splitComment ?? null
        console.log('selectedSplit обновлён:', split)
      } else {
        selectedSplit.value = null
        if (newId) {
          console.warn(`Сплит с _id=${newId} не найден среди доступных.`)
        }
      }
    })
    watch(splitsToShow, (newSplits) => {
      if (newSplits.length > 0 && !selectedSplitId.value) {
        selectedSplitId.value = newSplits[0]._id
      }
    })

    // Логика генерации
    const {
      finalPlan,
      generateSplitPlan,
      sendWorkoutPlan,
      regenerateExercise
    } = useSplitGenerator({
      isLoading,
      isGenerating,
      showBottomSheet,
      errorMessages,
      showSnackbar,
      telegramUserId,
      selectedSplitRef: selectedSplit
    })

    // Методы
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

    async function generateSplitWorkout() {
      isLoading.value = true
      const delayTime = 1500 + Math.random() * 1000
      await new Promise((resolve) => setTimeout(resolve, delayTime))

      await realGenerateSplitWorkout()

      isLoading.value = false
    }

    // Загрузка сплитов
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

    // onMounted
    onMounted(async () => {
      // 1. Эмулируем получение роли (или делаем реальный запрос)
      //    Если роль изначально уже доступна, можно снять комментарий
      //    и сразу установить roleLoading.value = false.
      //    Либо, если есть реальный запрос, делаем await userStore.fetchRole() и т.п.
      await loadSplits()

      if (process.client) {
        console.log('Инициализация Telegram SDK.')
        const launchParams = retrieveLaunchParams()
        initData.value = launchParams.initData
        if (initData.value && initData.value.user) {
          userData.value = initData.value.user
          telegramUserId.value = userData.value.id
          console.log('Telegram userAndAdmin ID:', telegramUserId.value)
        } else {
          console.error('Нет данных пользователя (Telegram).')
          showSnackbar('Нет данных пользователя (Telegram).', 'error')
        }
      }

      // Допустим, тут ваша логика определения userStore.role
      // Для демонстрации — просто делаем небольшую паузу
      // (уберите, если не нужно)
      await new Promise((resolve) => setTimeout(resolve, 800))

      // 2. Когда мы точно знаем, что role уже определена, снимаем "loading"
      roleLoading.value = false
    })

    // Обновление упражнений одного дня
    const refreshDayExercises = async (dayIndex: number) => {
      if (!finalPlan.value[dayIndex]) return
      refreshingDays.value[dayIndex] = true

      await new Promise((resolve) => setTimeout(resolve, 600))

      for (let exIndex = 0; exIndex < finalPlan.value[dayIndex].exercises.length; exIndex++) {
        await regenerateExercise(dayIndex, exIndex, gender.value)
        console.log(`Упражнение #${exIndex} в дне #${dayIndex + 1} перегенерировано.`)
      }

      refreshingDays.value[dayIndex] = false
      console.log(`Все упражнения дня #${dayIndex + 1} перегенерированы.`)
    }

    // Перегенерация всего сплита
    const regenerateWholeSplit = async () => {
      if (!selectedSplitType.value || !selectedSplitComment.value) {
        console.warn('Нет типа или комментария, нечего перегенерировать.')
        return
      }
      const matching = availableSplits.value.filter(s =>
          s.split === selectedSplitType.value &&
          s.splitComment === selectedSplitComment.value
      )
      if (matching.length === 0) {
        console.warn('Не найдено сплитов для выбранного типа/комментария.')
        return
      }
      const randomIndex = Math.floor(Math.random() * matching.length)
      const randomSplit = matching[randomIndex]

      selectedSplitId.value = randomSplit._id
      await generateSplitWorkout()
      console.log('Весь сплит был перегенерирован заново с новым случайным splitId.')
    }

    // Логирование упражнения (только для admin)
    const logExercises = async (exercise: any) => {
      if (userStore.role !== 'admin') {
        console.warn('Только администратор может отправлять логи.')
        showSnackbar('Доступ запрещён.', 'error')
        return
      }
      console.log('Получено упражнение для логирования:', exercise)
      console.log('telegramUserId:', userStore.telegramId)

      const requestData = {
        userId: userStore.telegramId,
        exercise: {
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps
        }
      }
      try {
        const response = await apiRequest('post', 'admin/log-exercises', requestData)
        showSnackbar('Сообщение успешно отправлено!', 'success')
        console.log(`Сообщение "${exercise.name}" отправлено админу. Ответ:`, response.data)
      } catch (err: any) {
        if (err.response) {
          console.error('Ошибка при отправке сообщения:', err.response.data)
          showSnackbar(
              `Ошибка: ${err.response.data.message || 'Не удалось отправить сообщение.'}`,
              'error'
          )
        } else {
          console.error('Ошибка при отправке сообщения:', err.message)
          showSnackbar('Не удалось отправить сообщение.', 'error')
        }
      }
    }

    // Логика изменения повторений
    const standardRepsValues = [5, 6, 8, 10, 12, 15, 20, 24, 30, 45, 60, 75, 90, 105, 120]
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

    // Удалить упражнение
    const removeExerciseSplit = (exercisesArr: any, index: number) => {
      exercisesArr.splice(index, 1)
    }

    // Перегенерировать одно упражнение
    const regenerateExerciseSplit = (exercisesArr: any, index: number, dayIndex: number) => {
      regenerateExercise(dayIndex, index, gender.value)
      console.log(`Упражнение #${index} в дне #${dayIndex + 1} перегенерировано.`)
    }

    // Обёртка для изменения selectedSplitId (из TrainingOnWeekInputs)
    const onSelectSplitId = (newVal: string) => {
      selectedSplitId.value = newVal
    }

    // Модалка с подробностями упражнения
    const showExerciseInfo = ref(false)
    const selectedExercise = ref<any>(null)
    const openExerciseInfo = (exercise: any) => {
      selectedExercise.value = exercise
      showExerciseInfo.value = true
    }

    return {
      // Данные
      genders,
      gender,
      allSplits,
      selectedSplit,
      selectedSplitId,
      selectedSplitType,
      uniqueSplitTypes,
      splitsToShow,

      isLoading,
      isGenerating,
      showBottomSheet,
      errorMessages,
      snackbar,
      refreshingDays,

      userData,
      telegramUserId,
      initData,

      // Методы
      generateSplitWorkout,
      realGenerateSplitWorkout,
      loadSplits,
      refreshDayExercises,
      regenerateWholeSplit,
      increaseRepsSplit,
      decreaseRepsSplit,
      removeExerciseSplit,
      regenerateExerciseSplit,
      logExercises,
      showSnackbar,
      onSelectSplitId,

      finalPlan,
      sendWorkoutPlan,

      showExerciseInfo,
      selectedExercise,
      openExerciseInfo,

      // Роль из Pinia и флаг загрузки
      userStore,
      canCreateTraining,
      roleLoading
    }
  }
})
</script>

<style scoped>
.dark-background {
  background-color: #1E1E1E !important;
  color: #FFF;
}

/* Пример анимации при ожидании */
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
