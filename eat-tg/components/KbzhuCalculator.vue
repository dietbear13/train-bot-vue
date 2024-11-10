<!-- components/KbzhuCalculator.vue -->
<template>
  <v-form ref="form" @submit.prevent="calculateKbzhu" class="pt-4">
    <v-row>
      <p>Все вводимые в калькулятор данные не сохраняются и не используются.</p>
      <v-col cols="12" sm="6">
        <v-select
            v-model="formData.gender"
            :items="genders"
            item-title="text"
            item-value="value"
            label="Пол"
            required
            variant="solo-filled"
        ></v-select>
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
            v-model="formData.weight"
            label="Вес (кг)"
            type="number"
            required
            variant="solo-filled"
        ></v-text-field>
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
    <div>Калории: <strong>{{ kbzhuResult.calories }}</strong> ккал</div>
    <div>Белки: <strong>{{ kbzhuResult.proteins }} г</strong></div>
    <div>Жиры: <strong>{{ kbzhuResult.fats }} г</strong></div>
    <div>Углеводы: <strong>{{ kbzhuResult.carbs }} г</strong></div>
  </v-alert>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface FormData {
  gender: 'male' | 'female' | ''
  weight: number | ''
}

interface Option {
  text: string
  value: string
}

interface KbzhuResult {
  calories: number
  proteins: number
  fats: number
  carbs: number
}

const formData = ref<FormData>({
  gender: '',
  weight: '',
})

const genders: Option[] = [
  { text: 'Мужчина', value: 'male' },
  { text: 'Женщина', value: 'female' },
]

const kbzhuResult = ref<KbzhuResult | null>(null)

const calculateKbzhu = () => {
  const gender = formData.value.gender
  const weight =
      typeof formData.value.weight === 'number'
          ? formData.value.weight
          : parseFloat(formData.value.weight)

  let proteinsPerKg = 0
  let fatsPerKg = 0
  let caloriesPerKg = 0

  if (gender === 'male') {
    proteinsPerKg = 1.8
    fatsPerKg = 1.5
    caloriesPerKg = 30
  } else if (gender === 'female') {
    proteinsPerKg = 1.5
    fatsPerKg = 1.2
    caloriesPerKg = 25
  } else {
    // Если пол не выбран, выходим из функции
    return
  }

  const proteins = proteinsPerKg * weight // в граммах
  const fats = fatsPerKg * weight // в граммах
  const calories = caloriesPerKg * weight // в ккал

  // Калории из белков и жиров
  const proteinCalories = proteins * 4
  const fatCalories = fats * 9

  // Остаток калорий на углеводы
  const carbCalories = calories - (proteinCalories + fatCalories)
  const carbs = carbCalories / 4 // в граммах

  // Округление результатов
  kbzhuResult.value = {
    calories: Math.round(calories),
    proteins: Math.round(proteins),
    fats: Math.round(fats),
    carbs: Math.round(carbs),
  }
}
</script>

<style scoped>
/* Стили для калькулятора КБЖУ */
</style>
