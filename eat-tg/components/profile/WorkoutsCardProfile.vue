<template>
  <BottomSheetWithClose
      v-model="dialogLocal"
      title="Сохранённые тренировки"
      :min-height="'95%'"
  >
    <v-list lines="two">
      <!-- Перебираем тренировки -->
      <div
          v-for="(workout, index) in savedWorkouts"
          :key="workout._id"
      >
        <v-list-item
            @click="toggleWorkout(index)"
            class="py-2"
        >
          <v-list-item-title>
            <v-icon color="primary" class="me-2">mdi-calendar</v-icon>
            {{ formatDate(workout.timestamp) }}
          </v-list-item-title>
        </v-list-item>

        <!-- Разделитель между элементами списка -->
        <v-divider></v-divider>

        <!-- Раскрываем детальную информацию по выбранной тренировке -->
        <v-expand-transition>
          <v-card
              v-if="expandedWorkout === index"
              class="mx-2 my-1 pa-2"
              elevation="1"
              style="border-radius: 16px"
          >
            <v-card-title>
              Детали тренировки
            </v-card-title>
            <v-card-subtitle>
              {{ formatDate(savedWorkouts[expandedWorkout].timestamp) }}
            </v-card-subtitle>

            <!-- Новые поля: goal и splitType, выводим под подзаголовком -->
            <v-card-text class="mt-2">
              <strong>Цель:</strong> {{ savedWorkouts[expandedWorkout].formData?.goal }}<br>
              <strong>Тип сплита:</strong> {{ savedWorkouts[expandedWorkout].formData?.splitType }}
            </v-card-text>

            <!-- Прозрачные панели без видимых границ -->
            <v-card variant="tonal" style="border-radius: 16px">
              <v-expansion-panels>
                <!-- Перебираем дни, у которых есть упражнения -->
                <v-expansion-panel
                    v-for="(day, i) in savedWorkouts[expandedWorkout].plan?.filter(d => d.exercises.length > 0)"
                    :key="i"
                >
                  <template #title>
                    <v-card elevation="0" class="transparent-panel">
                      <v-card-text class="text-h6 text-primary d-flex align-center my-1">
                        <v-icon color="primary" class="me-2">mdi-calendar-edit</v-icon>
                        {{ day.dayName }}
                      </v-card-text>
                    </v-card>
                  </template>

                  <v-expansion-panel-text>
                    <v-list density="compact" lines="two">
                      <v-list-item
                          v-for="exercise in day.exercises"
                          :key="exercise._id"
                          @click="openExerciseInfo(exercise)"
                      >
                        <v-list-item-title>
                          <v-icon color="secondary" class="me-2">mdi-dumbbell</v-icon>
                          {{ exercise.name }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          {{ exercise.sets }}×{{ exercise.reps }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card>
          </v-card>
        </v-expand-transition>
      </div>
    </v-list>

    <!-- Компонент с подробной информацией об упражнении -->
    <ExerciseInfo
        :exercise="selectedExercise"
        v-model="showExerciseInfoSheet"
    />
  </BottomSheetWithClose>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BottomSheetWithClose from '../shared/BottomSheetWithClose.vue';
import ExerciseInfo from '../training/ExerciseInfo.vue';
import { useUserStore } from '../../stores/userStore';

interface Exercise {
  _id: string;
  name: string;
  sets: number;
  reps: number;
  originalPattern?: string;
  // Если есть другие поля (gifImage, technique и т.д.) — дописывайте
}

interface WorkoutDay {
  dayName: string;
  exercises: Exercise[];
}

interface Workout {
  _id: string;
  timestamp: number;
  isSended: boolean;
  plan?: WorkoutDay[];
  // Добавляем formData с goal, splitType (и любыми другими полями)
  formData?: {
    goal?: string;
    splitType?: string;
    [key: string]: any;
  };
}

// Принимаем prop modelValue (чтобы управлять видимостью шторки через v-model)
const props = defineProps<{
  modelValue: boolean;
}>();

const emits = defineEmits(['update:modelValue']);

// Локальная переменная "dialogLocal", чтобы связать её с внутренним BottomSheet
const dialogLocal = ref(props.modelValue);

// Следим за изменениями из родителя (Admin.vue)
watch(
    () => props.modelValue,
    (val) => {
      dialogLocal.value = val;
    }
);

// И если внутри WorkoutsCardProfile человек закроет/откроет BottomSheet
// — уведомляем родителя (emit).
watch(dialogLocal, (val) => {
  emits('update:modelValue', val);
});

// Получаем данные из Pinia-хранилища
const userStore = useUserStore();

// Индекс текущей «раскрытой» тренировки
const expandedWorkout = ref<number | null>(null);

// Для открытия информации об упражнении
const showExerciseInfoSheet = ref(false);
const selectedExercise = ref<Exercise | null>(null);

// Фильтруем только те тренировки, у которых isSended = true
const savedWorkouts = computed<Workout[]>(() => {
  const tid = userStore.telegramId;
  if (!tid) return [];
  const workouts = userStore.trainingHistory[tid] || [];
  return workouts.filter((w: Workout) => w.isSended === true);
});

function toggleWorkout(index: number) {
  expandedWorkout.value = expandedWorkout.value === index ? null : index;
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * При клике по упражнению:
 * 1) Ищем в userStore.exercises полное описание (gifImage, technique и т.п.).
 * 2) Если нашли — объединяем данные (включая sets/reps).
 * 3) Открываем шторку (ExerciseInfo).
 */
function openExerciseInfo(exercise: Exercise) {
  const foundExercise = userStore.exercises.find(e => e._id === exercise._id);

  if (foundExercise) {
    selectedExercise.value = {
      ...foundExercise,
      sets: exercise.sets,
      reps: exercise.reps
    };
  } else {
    selectedExercise.value = exercise;
  }

  showExerciseInfoSheet.value = true;
}
</script>

<style scoped>
/* Убираем фоновый цвет и границы у панели */
.transparent-panel {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
</style>
