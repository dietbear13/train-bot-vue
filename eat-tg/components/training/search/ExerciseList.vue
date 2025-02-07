<template>
  <v-card class="ma-0 dark-background pa-2" variant="tonal">
    <template v-if="isLoading">
      <v-skeleton-loader type="list-item" class="my-2" v-for="n in 5" :key="n" />
    </template>
    <template v-else>
      <v-list-item v-for="exercise in exercises" :key="exercise._id" class="exercise-item">
        <v-list-item-title class="exercise-title">
          {{ formatExerciseName(exercise.name) }}
        </v-list-item-title>
        <v-list-item-action>
          <v-chip class="mr-2" small color="primary" text-color="white">
            {{ exercise.mainMuscle }}
          </v-chip>
          <v-chip class="mr-2" small color="gray" text-color="white">
            {{ exercise.typeExercise }}
          </v-chip>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                  icon
                  variant="plain"
                  v-bind="attrs"
                  v-on="on"
                  @click="$emit('add-to-workout', exercise)"
              >
                <v-icon color="green" v-if="!justAdded[exercise._id]">mdi-plus</v-icon>
                <v-icon color="green" v-else>mdi-check</v-icon>
              </v-btn>
            </template>
            <span>Добавить в тренировку</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="slotProps">
              <v-btn
                  variant="plain"
                  icon
                  @click="$emit('open-exercise-info', exercise)"
                  :title="'Информация о ' + formatExerciseName(exercise.name)"
                  aria-label="Информация об упражнении"
                  v-bind="slotProps.attrs"
                  v-on="slotProps.on"
              >
                <v-icon>mdi-information-outline</v-icon>
              </v-btn>
            </template>
            <span>Подробнее</span>
          </v-tooltip>
        </v-list-item-action>
      </v-list-item>
      <v-divider></v-divider>
    </template>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { Exercise } from '../../../composables/types';
export default defineComponent({
  name: 'ExerciseList',
  props: {
    exercises: {
      type: Array as () => Exercise[],
      required: true,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    justAdded: {
      type: Object as () => Record<string, boolean>,
      default: () => ({}),
    },
    formatExerciseName: {
      type: Function,
      required: true,
    },
  },
  emits: ['edit-exercise', 'confirm-delete-exercise', 'add-to-workout', 'open-exercise-info'],
});
</script>

<style scoped>
.exercise-title {
  font-weight: bold;
}
.admin-buttons {
  display: flex;
  align-items: center;
}
.admin-buttons .v-btn {
  margin-right: 4px;
}
.dark-background {
  background-color: #f5f5f5;
}
</style>
