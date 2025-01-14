<!-- /training/week/TrainingOnWeekResult.vue -->
<template>
  <!-- BottomSheetWithClose для отображения результата -->
  <BottomSheetWithClose
      v-model="localShowBottomSheet"
      :title="selectedSplit ? `${selectedSplit.split} на неделю` : 'Программа на неделю'"
  >
    <v-card-text class="ma-0">
      <!-- Комментарий к сплиту (если есть) -->
      <div v-if="selectedSplit?.splitComment" class="split-comment-area mb-3">
        <strong>{{ selectedSplit.splitComment }}</strong>
      </div>

      <!-- Кнопка для перегенерации всего сплита -->
      <v-btn
          block
          color="success"
          class="mb-2"
          rounded="xl"
          height="36px"
          :disabled="isLoading"
          @click="emitRegenerateWholeSplit"
      >
        <v-icon left :class="{ rotatingDumbbell: isLoading }">mdi-refresh</v-icon>
        пересоздать всю неделю
      </v-btn>

      <!-- Кнопка "Отправить себе" -->
      <v-btn
          block
          color="primary"
          rounded="xl"
          height="36px"
          :disabled="!telegramUserId"
          @click="emitSendWorkoutPlan"
      >
        <v-icon>mdi-send</v-icon>
        Отправить сообщением
      </v-btn>

      <!-- Выводим 7 «блоков» (дней) -->
      <div
          v-for="(day, idx) in finalPlan"
          :key="idx"
          class="day-block mt-2"
      >
        <!-- Заголовок дня + кнопка для обновления упражнений дня -->
        <h3 class="day-heading">
          День {{ idx + 1 }} ({{ dayName(idx) }})
          <v-btn
              v-if="day.exercises.length > 0"
              icon
              variant="text"
              class="mx-2"
              size="24px"
              @click="emitRefreshDayExercises(idx)"
              :disabled="refreshingDays[idx]"
              color="primary"
          >
            <v-icon :class="{ rotatingDumbbell: refreshingDays[idx] }">
              mdi-refresh
            </v-icon>
          </v-btn>
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
            <!-- Название упражнения (делаем кликабельным!) -->
            <div
                class="exercise-name"
                @click="openExerciseInfo(ex)"
                style="cursor: pointer; text-decoration: underline;"
            >
              {{ formatExerciseName(ex.name) }}
            </div>

            <!-- Блок с кнопками +/- и т.д. -->
            <div class="row-controls" style="display: flex; align-items: center; gap: 8px;">
              <!-- - reps + -->
              <div class="sets-reps-row">
                <v-btn
                    icon
                    small
                    variant="text"
                    class="mx-0"
                    size="24px"
                    @click="emitDecreaseRepsSplit(day.exercises, i2)"
                    color="#db5856"
                >
                  <v-icon small>mdi-minus</v-icon>
                </v-btn>

                <span class="sets-reps-text">
                  {{ ex.sets }} × {{ ex.reps }}
                </span>

                <v-btn
                    icon
                    variant="text"
                    class="mx-0"
                    size="24px"
                    @click="emitIncreaseRepsSplit(day.exercises, i2)"
                    color="#77dd77"
                >
                  <v-icon small>mdi-plus</v-icon>
                </v-btn>
              </div>

              <!-- refresh / delete -->
              <div class="vertical-buttons">
                <v-btn
                    icon
                    variant="text"
                    class="mx-0"
                    size="24px"
                    @click="emitRegenerateExerciseSplit(day.exercises, i2, idx)"
                    color="primary"
                >
                  <v-icon>mdi-refresh</v-icon>
                </v-btn>

                <v-btn
                    icon
                    variant="text"
                    class="mx-0"
                    size="24px"
                    @click="emitRemoveExerciseSplit(day.exercises, i2)"
                    color="#db5856"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Кнопка "Отправить себе" -->
      <v-btn
          block
          color="primary"
          rounded="xl"
          icon
          height="36px"
          :disabled="!telegramUserId"
          @click="emitSendWorkoutPlan"
      >
        <v-icon>mdi-send</v-icon>
        Отправить сообщением
      </v-btn>

    </v-card-text>
  </BottomSheetWithClose>

  <!-- ВОТ ЭТО ДОБАВЛЯЕМ: сам диалог/попап ExerciseGifViewer -->
  <ExerciseInfo
      v-model="showExerciseInfo"
      :exercise="selectedExerciseForGif"
  />
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from 'vue'
import BottomSheetWithClose from '~/components/shared/BottomSheetWithClose.vue'
import AdminExerciseButton from '~/components/userAndAdmin/AdminExerciseButton.vue'
import ExerciseInfo from '~/components/training/ExerciseInfo.vue';


// Типы упражнений и плана
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
  name: 'TrainingOnWeekResult',
  components: {
    BottomSheetWithClose,
    AdminExerciseButton,
    ExerciseInfo,
  },
  props: {
    showBottomSheet: {
      type: Boolean,
      default: false
    },
    selectedSplit: {
      type: Object as PropType<any>,
      default: null
    },
    finalPlan: {
      type: Array as PropType<DayPlan[]>,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    telegramUserId: {
      type: Number,
      default: null
    },
    refreshingDays: {
      type: Object as PropType<Record<number, boolean>>,
      default: () => ({})
    }
  },
  emits: [
    'update:showBottomSheet',
    'sendWorkoutPlan',
    'regenerateWholeSplit',
    'refreshDayExercises',
    'increaseRepsSplit',
    'decreaseRepsSplit',
    'removeExerciseSplit',
    'regenerateExerciseSplit'
  ],
  setup(props, { emit }) {
    // Локальное showBottomSheet, чтобы работал v-model
    const localShowBottomSheet = ref(props.showBottomSheet)

    // При изменении localShowBottomSheet => отправляем наверх
    const syncShowBottomSheet = () => {
      emit('update:showBottomSheet', localShowBottomSheet.value)
    }

    // Локальные стейты для открытия ExerciseGifViewer
    const showExerciseInfo = ref(false)
    const selectedExerciseForGif = ref<Exercise | null>(null)

    // Функция, вызываемая при клике на название упражнения
    const openExerciseInfo = (exercise: Exercise) => {
      selectedExerciseForGif.value = exercise
      showExerciseInfo.value = true
    }

    // dayName — название дня недели
    const dayName = (index: number) => {
      const days = [
        'Понедельник', 'Вторник', 'Среда',
        'Четверг', 'Пятница', 'Суббота', 'Воскресенье'
      ]
      return days[index % 7]
    }

    // Форматирование имени упражнения
    const formatExerciseName = (rawName: string): string => {
      if (!rawName) return ''
      return rawName.charAt(0).toUpperCase() + rawName.slice(1)
    }

    // Эмиты
    const emitRegenerateWholeSplit = () => emit('regenerateWholeSplit')
    const emitSendWorkoutPlan = () => emit('sendWorkoutPlan')
    const emitRefreshDayExercises = (dayIndex: number) => {
      emit('refreshDayExercises', dayIndex)
    }
    const emitIncreaseRepsSplit = (exercisesArr: Exercise[], index: number) => {
      emit('increaseRepsSplit', exercisesArr, index)
    }
    const emitDecreaseRepsSplit = (exercisesArr: Exercise[], index: number) => {
      emit('decreaseRepsSplit', exercisesArr, index)
    }
    const emitRemoveExerciseSplit = (exercisesArr: Exercise[], index: number) => {
      emit('removeExerciseSplit', exercisesArr, index)
    }
    const emitRegenerateExerciseSplit = (exercisesArr: Exercise[], index: number, dayIndex: number) => {
      emit('regenerateExerciseSplit', exercisesArr, index, dayIndex)
    }

    return {
      localShowBottomSheet,
      syncShowBottomSheet,

      // новые reactive-поля и метод
      showExerciseInfo,
      selectedExerciseForGif,
      openExerciseInfo,

      dayName,
      formatExerciseName,

      emitRegenerateWholeSplit,
      emitSendWorkoutPlan,
      emitRefreshDayExercises,
      emitIncreaseRepsSplit,
      emitDecreaseRepsSplit,
      emitRemoveExerciseSplit,
      emitRegenerateExerciseSplit
    }
  },
  watch: {
    localShowBottomSheet(newVal) {
      this.syncShowBottomSheet()
    },
    showBottomSheet(newVal) {
      this.localShowBottomSheet = newVal
    }
  }
})
</script>

<style scoped>
/* Блок под каждый день */
.day-block {
  margin-bottom: 16px;
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

/* «Отдых» */
.rest-label {
  color: #f2f2f2;
  font-style: italic;
  margin-left: 4px;
}

/* Список упражнений (таблица) */
.day-exercises-table {
  padding-left: 4px;
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
  border-radius: 14px;
  padding: 4px;
}

/* Название упражнения */
.exercise-name {
  flex: 1;
  font-weight: 600;
  color: #fafafa;
  margin-left: 4px;
  text-shadow: 0 0 2px #000;
}

/* Надпись «sets × reps» */
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

/* Блок с кнопками refresh/delete/admin (вертикально) */
.vertical-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

/* Комментарий сплита */
.split-comment-area {
  font-size: 1rem;
  color: #ccc;
}

/* Анимация вращения иконки (при refreshDayExercises или при isLoading) */
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
