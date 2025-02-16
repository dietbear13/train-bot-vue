<template>
  <v-card style="border-radius: 16px" flat class="my-2">
    <KbzhuCardProfile :kbzhu="latestKbzhuResult" :timestamp="latestKbzhuTimestamp" />
  </v-card>

  <!-- Кнопка для перехода к сохранённым тренировкам -->
  <v-btn
      block
      color="primary"
      class="my-3"
      size="large"
      elevation="1"
      rounded="pills"
      @click="showSavedWorkouts = true"
  >
    <v-icon start class="me-2">mdi-clipboard-list</v-icon>
    Сохранённые тренировки
  </v-btn>

  <!-- Низовая шторка (BottomSheet) -->
  <BottomSheetWithClose
      v-model="showSavedWorkouts"
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

            <!-- Прозрачные панели без видимых границ -->
            <v-expansion-panels>
              <!-- Перебираем дни, у которых есть упражнения -->
              <v-expansion-panel
                  v-for="(day, i) in savedWorkouts[expandedWorkout].plan?.filter(d => d.exercises.length > 0)"
                  :key="i"
                  variant="text"
              >
                <!-- Заменяем v-expansion-panel-title на слот #title -->
                <template #title>
                  <v-card
                      elevation="0"
                      class="transparent-panel"
                  >
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
        </v-expand-transition>
      </div>
    </v-list>
  </BottomSheetWithClose>

  <!-- Подключаем компонент с подробной информацией об упражнении -->
  <ExerciseInfo
      :exercise="selectedExercise"
      v-model="showExerciseInfoSheet"
  />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import KbzhuCardProfile from "../nutrition/KbzhuCardProfile.vue";
import BottomSheetWithClose from "../shared/BottomSheetWithClose.vue";
import ExerciseInfo from "../training/ExerciseInfo.vue";
import { useUserStore } from "../../stores/userStore";

interface Exercise {
  _id: string;
  name: string;
  sets: number;
  reps: number;
  originalPattern?: string;
  // Дополнительно, если в ExerciseInfo есть поля gifImage, etc.
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
}

const userStore = useUserStore();

const showSavedWorkouts = ref(false);
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
  return new Date(timestamp).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function openExerciseInfo(exercise: Exercise) {
  // Находим полное описание упражнения по _id из userStore
  const foundExercise = userStore.exercises.find(e => e._id === exercise._id);

  // Если нашли – объединяем данные
  // (чтобы при желании сохранить sets/reps, которые пришли из "exercise")
  if (foundExercise) {
    selectedExercise.value = {
      ...foundExercise,
      // Дополнительно перенесём параметры сетов и повторений
      sets: exercise.sets,
      reps: exercise.reps,
      // Если в savedWorkouts есть ещё поля, которые нужно подтянуть — тоже добавляем
    };
  } else {
    // На случай, если в userStore нет такого упражнения
    // просто используем объект, который кликаем
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
