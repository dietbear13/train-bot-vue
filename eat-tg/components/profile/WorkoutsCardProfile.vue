<template>
  <BottomSheetWithClose
      v-model="dialogLocal"
      title="Сохранённые тренировки"
      :min-height="'100%'"
  >
    <v-list lines="two">
      <!-- Перебираем тренировки, у которых isSended = true -->
      <div
          v-for="(workout, index) in savedWorkouts"
          :key="workout._id"
      >
        <v-list-item
            @click="toggleWorkout(index)"
            class="py-2"
        >
          <v-icon color="primary" class="me-2">mdi-calendar</v-icon>
          {{ formatDate(workout.timestamp) }}
        </v-list-item>

        <!-- Разделитель между элементами списка -->
        <v-divider></v-divider>

        <!-- Раскрываем детальную информацию по выбранной тренировке -->
        <v-expand-transition>
          <v-card
              v-if="expandedWorkout === index"
              class="mx-2 px-2"
              elevation="1"
              style="border-radius: 16px"
          >
            <v-card-title>
              {{ currentSplit?.split }}
            </v-card-title>
            <v-card-subtitle>
              {{ formatDate(currentWorkout?.timestamp || 0) }}
            </v-card-subtitle>

            <!-- Отображаем goal, splitType -->
            <v-card-text class="mt-2">
              <strong>Цель:</strong> {{ currentWorkout?.formData?.goal }}<br>
              {{ currentSplit?.splitComment }}
              <v-btn color="primary" rounded="xl">
                поделиться тренировкой
              </v-btn>
              <v-btn color="primary" rounded="xl">
                редактировать тренировку
              </v-btn>
            </v-card-text>

            <!-- Прозрачные панели без видимых границ -->
            <v-card style="border-radius: 16px">
              <v-expansion-panels>
                <!-- Перебираем дни, у которых есть упражнения -->
                <v-expansion-panel
                    v-for="(day, i) in currentWorkout?.plan?.filter(d => d.exercises.length > 0)"
                    :key="i"
                >
                  <template #title>
                    <v-card elevation="0" class="transparent-panel">
                      <v-card-text class="text-h6 text-primary d-flex align-center pa-0">
                        <v-icon color="primary" class="me-2">mdi-calendar-edit</v-icon>
                        {{ day.dayName }}
                      </v-card-text>
                    </v-card>
                  </template>

                  <v-expansion-panel-text>
                    <!-- Вот здесь обёрнут список упражнений в карточку variant="tonal" -->
                    <v-card variant="tonal" style="border-radius:16px;">
                      <v-list density="compact" lines="two" class="py-0">
                        <v-list-item
                            v-for="exercise in day.exercises"
                            :key="exercise._id"
                            @click="openExerciseInfo(exercise)"
                            class="py-0"
                        >
                          <!-- Левая вертикальная колонка (иконка и число повторений), справа текст упражнения -->
                          <v-list-item-content class="d-flex align-center py-0">
                            <div class="d-flex flex-column align-center me-3">
                              <v-icon color="secondary" class="mb-1">mdi-dumbbell</v-icon>
                              <span class="text-caption">{{ exercise.sets }}×{{ exercise.reps }}</span>
                            </div>
                            <v-card-text class="text-break">
                              {{ exercise.name }}
                            </v-card-text>
                          </v-list-item-content>
                        </v-list-item>
                      </v-list>
                    </v-card>
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
import { ref, computed, watch, onMounted } from 'vue';
import BottomSheetWithClose from '../shared/BottomSheetWithClose.vue';
import ExerciseInfo from '../training/ExerciseInfo.vue';
import { useUserStore } from '../../stores/userStore';
import { useApi } from '../../composables/useApi';

// Типы
interface Exercise {
  _id: string;
  name: string;
  sets: number;
  reps: number;
  originalPattern?: string;
  category: string;
  subcategory: string;
  mainMuscle: string;
  additionalMuscles: string[];
  difficultyLevel: string;
  equipment: string;
  typeExercise?: string;
  isWarnGif?: boolean;
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
  formData?: {
    goal?: string;
    splitType?: string;
    splitId?: string;
    [key: string]: any;
  };
}

interface SplitData {
  _id: string;
  split: string;
  splitComment: string;
  [key: string]: any;
}

// Принимаем prop modelValue (для управления BottomSheet через v-model)
const props = defineProps<{
  modelValue: boolean;
}>();

const emits = defineEmits(['update:modelValue']);

// Для управления видимостью шторки (BottomSheet)
const dialogLocal = ref(props.modelValue);

watch(
    () => props.modelValue,
    (val) => {
      dialogLocal.value = val;
    }
);

watch(dialogLocal, (val) => {
  emits('update:modelValue', val);
});

const userStore = useUserStore();
const { apiRequest } = useApi();

// Индекс «раскрытой» тренировки
const expandedWorkout = ref<number | null>(null);

// Для ExerciseInfo
const showExerciseInfoSheet = ref(false);
const selectedExercise = ref<Exercise | null>(null);

/**
 * Все тренировки (isSended = true)
 */
const savedWorkouts = computed<Workout[]>(() => {
  const tid = userStore.telegramId;
  if (!tid) return [];
  // Берём массив, соответствующий этому telegramId
  const workouts = userStore.trainingHistory[tid] || [];
  // Фильтруем по isSended === true
  return workouts.filter((w: Workout) => w.isSended === true);
});

/**
 * Текущая раскрытая тренировка
 */
const currentWorkout = computed<Workout | null>(() => {
  if (expandedWorkout.value === null) {
    return null;
  }
  return savedWorkouts.value[expandedWorkout.value] || null;
});

/**
 * Ищем нужный объект сплита из userStore.splits
 */
const currentSplit = computed<SplitData | null>(() => {
  const splitId = currentWorkout.value?.formData?.splitId;
  if (!splitId) return null;
  return userStore.splits.data.find((s: SplitData) => s._id === splitId) || null;
});

/**
 * Развернуть / свернуть выбранный индекс
 */
function toggleWorkout(index: number) {
  expandedWorkout.value = expandedWorkout.value === index ? null : index;
}

/**
 * Форматировать дату
 */
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
 * При клике по упражнению открываем ExerciseInfo
 */
function openExerciseInfo(exercise: Exercise) {
  const found = userStore.exercises.data.find((e) => e._id === exercise._id);

  selectedExercise.value = {
    _id: exercise._id,
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    originalPattern: exercise.originalPattern ?? '',
    category: found?.category ?? 'unknown',
    subcategory: found?.subcategory ?? 'unknown',
    mainMuscle: found?.mainMuscle ?? 'unknown',
    additionalMuscles: found?.additionalMuscles ?? [],
    difficultyLevel: found?.difficultyLevel ?? 'unknown',
    equipment: found?.equipment ?? 'unknown',
    typeExercise: found?.typeExercise ?? '',
    isWarnGif: found?.isWarnGif ?? false
  };

  showExerciseInfoSheet.value = true;
}

/**
 * onMounted: соберём все splitId из тренировок,
 * сразу загрузим данные о сплитах (если ещё не загружены).
 */
onMounted(async () => {
  try {
    // Загружаем сплиты, если их ещё нет
    if (userStore.splits.data.length === 0) {
      await apiRequest<any[]>('get', 'splits');
    }

    // Собираем все splitId из тренировок
    const neededSplitIds = new Set<string>();
    for (const w of savedWorkouts.value) {
      if (w.formData?.splitId) {
        neededSplitIds.add(w.formData.splitId);
      }
    }
    console.log('Нужные splitIds:', Array.from(neededSplitIds));

    // Если какие-то не найдены - можно сделать отдельный запрос
  } catch (error) {
    console.error('Ошибка при загрузке сплитов:', error);
  }
});
</script>

<style scoped>
.transparent-panel {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
</style>
