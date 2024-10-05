<!-- pages/nutrition.vue -->
<template>
  <v-container>
    <h2 class="my-4">Питание</h2>
    <v-tabs v-model="activeTab" background-color="primary" dark>
      <v-tab>Советы</v-tab>
      <v-tab>Калькулятор КБЖУ</v-tab>
    </v-tabs>

    <v-tabs-items v-model="activeTab">
      <v-tab-item>
        <NutritionAdvice />
      </v-tab-item>
      <v-tab-item>
        <KbzhuCalculator />
      </v-tab-item>
    </v-tabs-items>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import NutritionAdvice from '~/components/NutritionAdvice.vue'
import KbzhuCalculator from '~/components/KbzhuCalculator.vue'

const activeTab = ref(0)
</script>

<style scoped>
/* Стили для страницы питания */
</style>
