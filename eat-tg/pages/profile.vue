<!-- pages/profile.vue -->
<template>
  <v-container>
    <h2 class="my-4">Профиль</h2>
    <v-form ref="form" @submit.prevent="updateProfile">
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="formData.age"
            label="Возраст"
            type="number"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="formData.weight"
            label="Вес (кг)"
            type="number"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="formData.height"
            label="Рост (см)"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="formData.activityLevel"
            :items="activityLevels"
            label="Уровень активности"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="formData.goal"
            :items="goals"
            label="Цель"
          ></v-select>
        </v-col>
        <v-col cols="12">
          <v-btn type="submit" color="primary" class="mt-4">Сохранить</v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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

const fetchProfile = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/users/profile')
    Object.assign(formData.value, response.data)
  } catch (error) {
    console.error(error)
  }
}

const updateProfile = async () => {
  try {
    await axios.post('http://localhost:3001/api/users/profile', formData.value)
    alert('Данные обновлены')
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
/* Стили для страницы профиля */
</style>
