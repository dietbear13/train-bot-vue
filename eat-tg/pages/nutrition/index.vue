<!-- pages/nutrition/index.vue -->
<template>
  <v-container>
    <v-tabs v-model="tab" background-color="primary" dark>
      <v-tab to="/nutrition/diets">Диеты</v-tab>
      <v-tab to="/nutrition/kbzhu-calculator">КБЖУ Калькулятор</v-tab>
    </v-tabs>
    <!-- Место для рендеринга дочерних маршрутов -->
    <router-view />
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Основные ссылки на текущий маршрут и роутер
const route = useRoute()
const router = useRouter()

// Храним номер текущей вкладки
const tab = ref(0)

// Следим за изменением URL, чтобы корректно выставлять вкладку
watch(
    () => route.path,
    (path) => {
      if (path.includes('diets')) {
        tab.value = 0
      } else if (path.includes('kbzhu-calculator')) {
        tab.value = 1
      }
    },
    { immediate: true }
)

// Следим за изменением вкладок, чтобы менять маршрут
watch(tab, (val) => {
  if (val === 0) {
    router.push('/nutrition/diets')
  } else if (val === 1) {
    router.push('/nutrition/kbzhu-calculator')
  }
})
</script>
