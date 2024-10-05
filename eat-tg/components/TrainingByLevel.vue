<!-- components/TrainingByLevel.vue -->
<template>
  <v-form ref="form" @submit.prevent="generateProgram" class="pt-4">
    <v-select
        v-model="formData.level"
        :items="levels"
        label="Уровень сложности"
        required
    ></v-select>
    <v-btn type="submit" color="primary" class="mt-4">Сгенерировать программу</v-btn>
  </v-form>

  <div v-if="trainingProgram">
    <h3 class="mt-4">Сгенерированная программа:</h3>
    <v-list two-line>
      <v-list-item
          v-for="(exercise, index) in trainingProgram.exercises"
          :key="index"
      >
        <v-list-item-content>
          <v-list-item-title>{{ exercise.name }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ exercise.sets }} подходов по {{ exercise.reps }} повторений
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const formData = ref({
  level: '',
})

const levels = [
  { text: 'Начальный', value: 'beginner' },
  { text: 'Средний', value: 'intermediate' },
  { text: 'Продвинутый', value: 'advanced' },
]

const trainingProgram = ref(null)

const generateProgram = async () => {
  try {
    const response = await axios.post('http://localhost:3001/api/training/generate', {
      level: formData.value.level,
    })
    trainingProgram.value = response.data
  } catch (error) {
    console.error(error)
  }
}
</script>

<style scoped>
/* Стили для компонента */
</style>
