<!-- /training/TrainingOnWeek.vue -->
<template>
  <!-- Проверка роли (roleLoading) -->
  <div v-if="roleLoading">
    <v-skeleton-loader
        type="ossein"
        height="50px"
        class="mx-auto"
        style="border-radius: 16px"
    />
  </div>

  <div v-else>
    <!-- Если пользователь freeUser -->
    <div v-if="!canCreateTraining">
      <v-card class="mb-2 dark-background" variant="tonal">
        <v-card-text>
          Создание программ доступно только для подписанных на телеграм-канал.
          Перейдите на
          <nuxt-link to="/profile">
            страницу профиля <v-icon size="18px">mdi-account</v-icon>
          </nuxt-link>
          и подпишитесь.
        </v-card-text>
      </v-card>
    </div>

    <!-- Если пользователь admin или paidUser -->
    <div v-else>
      <!-- Компонент выбора пола, цели, типа сплита -->
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
          :isAnimating="isAnimating"
          @update:gender="gender = $event"
          @update:goal="goal = $event"
          @update:selectedSplitType="selectedSplitType = $event"
          @update:selectedSplitId="onSelectSplitId"
          @generateSplitWorkout="generateSplitWorkout"
      />

      <!-- Компонент результата (готовая «неделя») -->
      <TrainingOnWeekResult
          v-model:showBottomSheet="showBottomSheet"
          :selectedSplit="selectedSplit"
          :finalPlan="finalPlan"
          :isLoading="isLoading"
          :telegramUserId="telegramUserId"
          :refreshingDays="refreshingDays"
          @sendWorkoutPlan="sendWorkoutPlan($event)"
      @regenerateWholeSplit="regenerateWholeSplit"
      @refreshDayExercises="refreshDayExercises"
      @increaseRepsSplit="increaseRepsSplit"
      @decreaseRepsSplit="decreaseRepsSplit"
      @removeExerciseSplit="removeExerciseSplit"
      @regenerateExerciseSplit="regenerateExerciseSplit"
      :openExerciseInfo="openExerciseInfo"
      />
    </div>
  </div>

  <!-- Глобальный Snackbar -->
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
      <v-btn color="white" @click="snackbar.show = false">
        Закрыть
      </v-btn>
    </template>
  </v-snackbar>

  <!-- Компонент для подробностей упражнения (ExerciseInfo) -->
  <ExerciseInfo
      v-model="showExerciseInfo"
      :exercise="selectedExercise"
  />
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { retrieveLaunchParams } from '@telegram-apps/sdk'
import { useUserStore } from '../../stores/userStore'
import { useApi } from '../../composables/useApi'
import useSplitGenerator from '../../composables/useSplitGenerator'

// Импортируем компоненты
import TrainingOnWeekInputs from '../../components/training/week/TrainingOnWeekInputs.vue'
import TrainingOnWeekResult from '../../components/training/week/TrainingOnWeekResult.vue'
import ExerciseInfo from '../../components/training/ExerciseInfo.vue'

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
  difficultyLevelSplit: number
}
interface TelegramUserData {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
}

interface Exercise {
  _id: string
  name: string
  sets: number
  reps: number
  originalPattern?: string
}
interface DayPlan {
  dayName: string
  exercises: Exercise[]
  patternOrExercise?: string[]
}

export default defineComponent({
  name: 'TrainingOnWeek',
  components: {
    TrainingOnWeekInputs,
    TrainingOnWeekResult,
    ExerciseInfo
  },
  setup() {
    const userStore = useUserStore()
    const roleLoading = ref(true)
    const canCreateTraining = computed(
        () => userStore.role === 'admin' || userStore.role === 'paidUser'
    )
    const { apiRequest } = useApi()

    // Состояния и параметры компонента
    const goal = ref<string>('')
    const genders = ['Мужчина', 'Женщина']
    const gender = ref<string>('')

    const allSplits = ref<SplitItem[]>([])
    const selectedSplit = ref<SplitItem | null>(null)
    const selectedSplitId = ref<string | undefined>(undefined)
    const selectedSplitType = ref<string | undefined>(undefined)

    const isLoading = ref(false)
    const isGenerating = ref(false)
    const isAnimating = ref(false)
    const showBottomSheet = ref(false)
    const errorMessages = ref<string[]>([])
    const refreshingDays = ref<Record<number, boolean>>({})

    const userData = ref<TelegramUserData | null>(null)
    const telegramUserId = ref<number | undefined>(undefined)
    const initData = ref<any>(null)

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

    const selectedSplitComment = ref<string | null>(null)

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
      const sameTypeSplits = availableSplits.value.filter(
          s => s.split === selectedSplitType.value && s.splitComment
      )
      const uniqueComments = Array.from(new Set(sameTypeSplits.map(s => s.splitComment)))
      return uniqueComments.map(comment => {
        const sameCommentSplits = sameTypeSplits.filter(s => s.splitComment === comment)
        const randomSplit = sameCommentSplits[Math.floor(Math.random() * sameCommentSplits.length)]
        return {
          _id: randomSplit._id,
          split: randomSplit.split,
          splitComment: randomSplit.splitComment,
          difficultyLevelSplit: randomSplit.difficultyLevelSplit
        }
      })
    })

    watch(selectedSplitId, (newId) => {
      const split = availableSplits.value.find(s => s._id === newId)
      if (split) {
        selectedSplit.value = split
        selectedSplitComment.value = split.splitComment ?? null
      } else {
        selectedSplit.value = null
      }
    })

    watch(splitsToShow, (newSplits) => {
      if (newSplits.length > 0 && !selectedSplitId.value) {
        selectedSplitId.value = newSplits[0]._id
      }
    })

    // Сюда складываем сгенерированный план (7 дней)
    const finalPlan = ref<DayPlan[]>([])

    // Подключаем composable для генерации и отправки плана
    const {
      generateSplitPlan,
      regenerateExercise,
      sendWorkoutPlan: sendDetailedWorkoutPlan,
    } = useSplitGenerator({
      isLoading,
      isGenerating,
      showBottomSheet,
      errorMessages,
      showSnackbar,
      telegramUserId,
      selectedSplitRef: selectedSplit
    })

    /**
     * Функция отправки данных в аналитику (/analytics/save-sended-workout)
     * Дополнена: теперь передаём и сам план (finalPlan).
     */
    const sendAnalyticsWorkoutPlan = async (plan: DayPlan[]) => {
      if (!telegramUserId.value) {
        showSnackbar('Нет telegramUserId — не можем сохранить.', 'error')
        return
      }
      if (!selectedSplit.value) {
        showSnackbar('Сплит не выбран — не можем отправить тренировку.', 'error')
        return
      }
      const payload = {
        userId: telegramUserId.value,
        gender: selectedSplit.value.gender,
        goal: goal.value,
        splitType: selectedSplit.value.split,
        splitId: selectedSplit.value._id,
        timestamp: Date.now(),
        plan // <-- ВАЖНО: Передаём полный план
      }
      try {
        const response = await apiRequest<any>('POST', '/analytics/save-sended-workout', payload)
        console.log('Ответ от /analytics/save-sended-workout:', response)
        showSnackbar('Тренировка отправлена и сохранена!', 'success')
      } catch (err) {
        console.error('Ошибка при сохранении отправленной тренировки:', err)
        errorMessages.value.push('Ошибка при сохранении отправленной тренировки на сервере.')
        showSnackbar('Не удалось отправить тренировку на сервер.', 'error')
      }
    }

    /**
     * Получаем план из дочернего компонента и делаем две вещи:
     * 1. Отправляем данные в аналитику (включая план).
     * 2. Отправляем подробный план пользователю (функция `sendDetailedWorkoutPlan` из composable).
     */
    const sendWorkoutPlan = async (plan: DayPlan[]) => {
      // 1. Аналитика
      await sendAnalyticsWorkoutPlan(plan)

      // 2. Отправляем пользователю в чат
      await sendDetailedWorkoutPlan()

      // 3. Отправляем админу подробный лог упражнений
      try {
        if (!telegramUserId.value) {
          showSnackbar('Нет telegramUserId — не можем логировать.', 'error')
          return
        }
        const response = await apiRequest('post', 'bot/admin/log-exercises', {
          userId: telegramUserId.value,
          plan
        })
        showSnackbar('Лог плана успешно отправлен админу!', 'success')
        console.log('Ответ от /bot/admin/log-exercises:', response)
      } catch (err: any) {
        if (err.response) {
          showSnackbar(
              `Ошибка: ${err.response.data.message || 'Не удалось отправить лог.'}`,
              'error'
          )
        } else {
          showSnackbar('Не удалось отправить лог.', 'error')
        }
      }
    }

    async function realGenerateSplitWorkout() {
      if (!selectedSplit.value || !gender.value) {
        errorMessages.value.push('Выберите пол и сплит.')
        showSnackbar('Выберите пол и сплит.', 'error')
        return
      }
      console.log('Начало генерации сплита (реальный вызов).')
      // Именно в composable генерируется объект finalPlan
      await generateSplitPlan(gender.value, selectedSplit.value, goal.value, finalPlan)
      console.log('Генерация сплита (реальный вызов) завершена.')
    }

    async function generateSplitWorkout() {
      console.log('Родитель: включаем анимацию.')
      isAnimating.value = true
      isLoading.value = true
      const delayTime = 1500 + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delayTime))
      await realGenerateSplitWorkout()
      console.log('Родитель: выключаем анимацию.')
      isAnimating.value = false
      isLoading.value = false
    }

    const loadSplits = async () => {
      try {
        const data = await apiRequest<SplitItem[]>('get', 'splits')
        allSplits.value = Array.isArray(data) ? data : []
      } catch (error: any) {
        console.error('Ошибка при загрузке сплитов:', error)
      }
    }

    onMounted(async () => {
      await loadSplits()
      if (process.client) {
        const launchParams = retrieveLaunchParams()
        initData.value = launchParams.initData
        if (initData.value && initData.value.user) {
          const user = initData.value.user
          userData.value = user
          telegramUserId.value = user.id
        } else {
          console.error('Нет данных пользователя (Telegram).')
          showSnackbar('Нет данных пользователя (Telegram).', 'error')
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 800))
      roleLoading.value = false
    })

    const refreshDayExercises = async (dayIndex: number) => {
      if (!finalPlan.value[dayIndex]) return
      refreshingDays.value[dayIndex] = true
      await new Promise(resolve => setTimeout(resolve, 600))
      for (let exIndex = 0; exIndex < finalPlan.value[dayIndex].exercises.length; exIndex++) {
        await regenerateExercise(dayIndex, exIndex, gender.value, finalPlan)
      }
      refreshingDays.value[dayIndex] = false
    }

    const regenerateWholeSplit = async () => {
      if (!selectedSplitType.value || !selectedSplitComment.value) return
      const matching = availableSplits.value.filter(
          s => s.split === selectedSplitType.value && s.splitComment === selectedSplitComment.value
      )
      if (matching.length === 0) return
      const randomSplit = matching[Math.floor(Math.random() * matching.length)]
      selectedSplitId.value = randomSplit._id
      await generateSplitWorkout()
    }

    // Для изменения повторений (увеличение/уменьшение)
    const standardRepsValues = [4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180]
    function getSets(reps: number): number {
      if (reps === 4) return 6
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
      ex.sets = getSets(newReps)
    }

    const decreaseRepsSplit = (exercisesArr: any, index: number) => {
      const ex = exercisesArr[index]
      const current = ex.reps
      const idx = standardRepsValues.indexOf(current)
      let newReps
      if (idx > 0) {
        newReps = standardRepsValues[idx - 1]
      } else {
        newReps = current - 1
      }
      if (newReps >= 1) {
        ex.reps = newReps
        ex.sets = getSets(newReps)
      }
    }

    const removeExerciseSplit = (exercisesArr: any, index: number) => {
      exercisesArr.splice(index, 1)
    }

    const regenerateExerciseSplit = (exercisesArr: any, index: number, dayIndex: number) => {
      regenerateExercise(dayIndex, index, gender.value, finalPlan)
    }

    const onSelectSplitId = (newVal: string) => {
      selectedSplitId.value = newVal
    }

    // Для просмотра GIF или описания упражнения
    const showExerciseInfo = ref(false)
    const selectedExercise = ref<any>(null)
    const openExerciseInfo = (exercise: any) => {
      selectedExercise.value = exercise
      showExerciseInfo.value = true
    }

    return {
      userStore,
      roleLoading,
      canCreateTraining,
      genders,
      gender,
      allSplits,
      selectedSplit,
      selectedSplitId,
      selectedSplitType,
      uniqueSplitTypes,
      splitsToShow,
      goal,
      isLoading,
      isGenerating,
      isAnimating,
      showBottomSheet,
      errorMessages,
      refreshingDays,
      userData,
      telegramUserId,
      initData,
      snackbar,
      finalPlan,
      generateSplitPlan,
      regenerateExercise,
      sendWorkoutPlan,
      generateSplitWorkout,
      loadSplits,
      refreshDayExercises,
      regenerateWholeSplit,
      increaseRepsSplit,
      decreaseRepsSplit,
      removeExerciseSplit,
      regenerateExerciseSplit,
      showSnackbar,
      onSelectSplitId,
      showExerciseInfo,
      selectedExercise,
      openExerciseInfo
    }
  }
})
</script>

<style scoped>
.dark-background {
  background-color: #1E1E1E !important;
  color: #FFF;
}

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
