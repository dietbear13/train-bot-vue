<template>
  <BottomSheetWithClose v-model="showSavedWorkouts" title="Сохранённые тренировки">
    <v-list>
      <!-- перебираем готовые "выбранные" тренировки (только isSended = true) -->
      <v-list-item
          v-for="(workout, index) in savedWorkouts"
          :key="workout._id"
          @click="toggleWorkout(index)"
      >
        <v-list-item-title>{{ formatDate(workout.timestamp) }}</v-list-item-title>
      </v-list-item>

      <v-divider />

      <v-expand-transition>
        <v-card
            v-if="expandedWorkout !== null"
            class="pa-4"
        >
          <v-card-title>Детали тренировки</v-card-title>
          <v-card-subtitle>
            {{ formatDate(savedWorkouts[expandedWorkout].timestamp) }}
          </v-card-subtitle>

          <v-expansion-panels>
            <!--
              Отфильтровываем дни, у которых есть упражнения (exercises.length > 0)
            -->
            <v-expansion-panel
                v-for="(day, i) in savedWorkouts[expandedWorkout].plan?.filter(d => d.exercises.length > 0)"
                :key="i"

            >
              <v-expansion-panel-title
                  class="text-h6"
                  color="#2f4f4f"
              >
                {{ day.dayName }}
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list dense>
                  <v-list-item
                      v-for="exercise in day.exercises"
                      :key="exercise._id"
                  >
                    <v-list-item-title>{{ exercise.name }}</v-list-item-title>
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
    </v-list>
  </BottomSheetWithClose>
</template>
<script lang="ts">
import BottomSheetWithClose from "../shared/BottomSheetWithClose.vue";
import { useUserStore } from "../../stores/userStore";

export default {
  name: 'ProfileWorkouts',
  components: {BottomSheetWithClose}
}

// Описываем интерфейсы
interface Exercise {
  _id: string;
  name: string;
  sets: number;
  reps: number;
  originalPattern: string;
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

// Получаем store
const userStore = useUserStore();

// Локальные reactive переменные
const showSavedWorkouts = ref(false);
const expandedWorkout = ref<number | null>(null);

// Фильтруем только те тренировки, у которых isSended === true
const savedWorkouts = computed<Workout[]>(() => {
  const tid = userStore.telegramId;
  if (!tid) return [];

  // trainingHistory[tid] = массив
  const workouts = userStore.trainingHistory[tid] || [];

  // Возвращаем только isSended = true
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

</script>