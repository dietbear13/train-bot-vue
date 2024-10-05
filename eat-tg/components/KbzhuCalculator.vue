<!-- components/KbzhuCalculator.vue -->
<template>
  <v-form ref="form" @submit.prevent="calculateKbzhu" class="pt-4">
    <v-row>
      <v-col cols="12" sm="6">
        <v-text-field
            v-model="formData.age"
            label="Возраст"
            type="number"
            required
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
            v-model="formData.weight"
            label="Вес (кг)"
            type="number"
            required
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
            v-model="formData.height"
            label="Рост (см)"
            type="number"
            required
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
            v-model="formData.activityLevel"
            :items="activityLevels"
            label="Уровень активности"
            required
        ></v-select>
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
            v-model="formData.goal"
            :items="goals"
            label="Цель"
            required
        ></v-select>
      </v-col>
      <v-col cols="12" sm="6">
        <v-btn type="submit" color="primary" class="mt-4">Рассчитать</v-btn>
      </v-col>
    </v-row>
  </v-form>

  <v-alert
      v-if="kbzhuResult"
      type="info"
      class="mt-4"
  >
    <div>Калории: <strong>{{ kbzhuResult.calories }}</strong></div>
    <div>Белки: <strong>{{ kbzhuResult.proteins }} г</strong></div>
    <div>Жиры: <strong>{{ kbzhuResult.fats }} г</strong></div>
    <div>Углеводы: <strong>{{ kbzhuResult.carbs }} г</strong></div>
  </v-alert>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const formData = ref({
  age: '',
  weight: '',
  height: '',
  activityLevel: '',
  goal: '',
})

const activityLevels = [
  { text: 'Низкая', value: 'low' },
  { text: 'Средняя', value: 'medium' },
  { text: 'Высокая', value: 'high' },
]

const goals = [
  { text: 'Похудение', value: 'lose_weight' },
  { text: 'Поддержание', value: 'maintain' },
  { text: 'Набор массы', value: 'gain_weight' },
]

const kbzhuResult = ref(null)

const calculateKbzhu = async () => {
  try {
    const response = await axios.post('http://localhost:3001/api/nutrition/kbzhu', formData.value)
    kbzhuResult.value = response.data
  } catch (error) {
    console.error(error)
  }
}
</script>

<style scoped>
/* Стили для калькулятора КБЖУ */
</style>
