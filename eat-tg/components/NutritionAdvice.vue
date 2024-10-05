<!-- components/NutritionAdvice.vue -->
<template>
  <v-list two-line>
    <v-list-item
        v-for="(advice, index) in advices"
        :key="index"
        @click="viewAdvice(advice)"
    >
      <v-list-item-content>
        <v-list-item-title>{{ advice.title }}</v-list-item-title>
        <v-list-item-subtitle>{{ advice.summary }}</v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-icon>
        <v-icon>mdi-chevron-right</v-icon>
      </v-list-item-icon>
    </v-list-item>
  </v-list>

  <v-dialog v-model="dialog" max-width="600px">
    <v-card>
      <v-card-title>{{ selectedAdvice.title }}</v-card-title>
      <v-card-text>{{ selectedAdvice.content }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="dialog = false">Закрыть</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const advices = ref([])
const dialog = ref(false)
const selectedAdvice = ref({})

const fetchAdvices = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/nutrition/advices')
    advices.value = response.data
  } catch (error) {
    console.error(error)
  }
}

const viewAdvice = (advice) => {
  selectedAdvice.value = advice
  dialog.value = true
}

onMounted(() => {
  fetchAdvices()
})
</script>

<style scoped>
/* Стили для компонента советов по питанию */
</style>
