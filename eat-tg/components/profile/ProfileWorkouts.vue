<template>
  <BottomSheetWithClose v-model="showSavedWorkouts" title="Сохранённые тренировки">
    <v-list>
      <v-list-item
          v-for="(workout, index) in userStore.savedWorkouts"
          :key="index"
      >
        <v-list-item-title @click="toggleWorkout(index)" style="cursor: pointer;">
          🏋️ День {{ index + 1 }}: {{ workout.dayName }}
        </v-list-item-title>
        <v-list-item v-if="expandedWorkout === index">
          <v-card class="pa-2 mt-2">
            <div v-for="(exercise, i) in workout.exercises" :key="i">
              <strong>{{ exercise.name }}</strong> - {{ exercise.sets }}x{{ exercise.reps }}
            </div>
          </v-card>
        </v-list-item>
      </v-list-item>
    </v-list>
  </BottomSheetWithClose>
</template>
<script lang="ts">
import BottomSheetWithClose from "../shared/BottomSheetWithClose.vue";

export default {
  name: 'ProfileWorkouts',
  components: {BottomSheetWithClose}
}
</script>