<template>
  ...
  <ExerciseInfo
      v-model="showExerciseInfo"
      :exercise="selectedExercise"
  />
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import ExerciseInfo from '~/components/training/ExerciseInfo.vue'

export default defineComponent({
  name: 'TrainingOnWeekResult',
  components: { ExerciseInfo },
  setup() {
    const showExerciseInfo = ref(false)
    const selectedExercise = ref(null)

    const openInfo = (exercise) => {
      selectedExercise.value = exercise
      showExerciseInfo.value = true
    }

    return {
      showExerciseInfo,
      selectedExercise,
      openInfo
    }
  }
})
</script>
