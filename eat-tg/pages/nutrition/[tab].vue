<!-- pages/nutrition/[tab].vue -->
<template>
  <component :is="currentComponent" />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import KbzhuCalculator from '../../components/nutrition/KbzhuCalculator.vue'
import NutritionAdvice from '../../components/nutrition/NutritionAdvice.vue'

const route = useRoute()
const router = useRouter()

// Получаем параметр маршрута 'tab'
const currentTab = computed(() => route.params.tab as string)

// Определяем, какой компонент отображать
const currentComponent = computed(() => {
  switch (currentTab.value) {
    case 'kbzhu-calculator':
      return KbzhuCalculator
    case 'diets':
      return NutritionAdvice
    default:
      return null
  }
})

// Редирект на дефолтную вкладку, если параметр некорректен
onMounted(() => {
  if (!['kbzhu-calculator', 'diets'].includes(currentTab.value)) {
    router.replace('/nutrition/kbzhu-calculator')
  }
})
</script>

<style scoped>
/* Добавьте стили по необходимости */
</style>
