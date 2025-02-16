<!-- components/nutrition/NutritionTabs.vue -->
<template>
  <v-container class="nutrition-container">
    <!-- Настройка v-tabs с дополнительными пропсами для улучшенной адаптивности -->
    <v-tabs
        v-model="activeTab"
        background-color="transparent"
        dark
        fixed-tabs
        grow
        mobile-breakpoint="md"
        direction="horizontal"
        align-tabs="center"
        hide-slider
        class="custom-tabs"
    >
      <!-- Вкладка: Калькулятор КБЖУ -->
      <v-tab
          class="custom-tab"
          style="border-radius: 16px"
          :class="{ 'active-tab': activeTab === 0 }"
          @click="changeTab('kbzhu-calculator')"
      >
        Калькулятор КБЖУ
      </v-tab>

      <!-- Вкладка: Советы -->
      <v-tab
          class="custom-tab"
          style="border-radius: 16px"
          :class="{ 'active-tab': activeTab === 1 }"
          @click="changeTab('diets')"
      >
        Рационы
      </v-tab>
    </v-tabs>

    <!-- Область для отображения содержимого вкладок -->
    <div class="tab-content">
      <component :is="currentComponent" :tab="currentTab" />
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import KbzhuCalculator from './KbzhuCalculator.vue'
import NutritionAdvice from './NutritionAdvice.vue'

// Инициализация роутера и текущего маршрута
const route = useRoute()
const router = useRouter()

// Определение соответствия вкладок и параметров
const tabMap = {
  'kbzhu-calculator': 0,
  'diets': 1
}

const indexMap = ['kbzhu-calculator', 'diets']

// Получение текущего параметра tab из query
const currentTab = computed(() => route.query.tab as string || 'kbzhu-calculator')

// Установка активной вкладки на основе параметра
const activeTab = ref<number>(tabMap[currentTab.value] !== undefined ? tabMap[currentTab.value] : 0)

// Функция для изменения вкладки и обновления query-параметра
function changeTab(tabName: string) {
  if (currentTab.value !== tabName) {
    router.push({ path: '/nutrition', query: { tab: tabName } })
  }
}

// Определяем, какой компонент отображать на основе текущей вкладки
const currentComponent = computed(() => {
  switch (currentTab.value) {
    case 'kbzhu-calculator':
      return KbzhuCalculator
    case 'diets':
      return NutritionAdvice
    default:
      return KbzhuCalculator
  }
})

// Наблюдение за изменением маршрута для обновления активной вкладки
watch(
    () => route.query.tab,
    (newTab) => {
      if (tabMap.hasOwnProperty(newTab)) {
        activeTab.value = tabMap[newTab]
      } else {
        // Если параметр некорректен, переадресуем на дефолтную вкладку
        router.replace({ path: '/nutrition', query: { tab: 'kbzhu-calculator' } })
      }
    },
    { immediate: true }
)

// Обработка перехода на дефолтную вкладку при заходе на /nutrition
onMounted(() => {
  if (!route.query.tab || !tabMap.hasOwnProperty(route.query.tab as string)) {
    router.replace({ path: '/nutrition', query: { tab: 'kbzhu-calculator' } })
  }
})
</script>

<style scoped>
.active-tab {
  color: #ffffff !important; /* Белый цвет текста активной вкладки */
  background-color: #43a047; /* Цвет фона активной вкладки */
}

.custom-tabs {
  border-radius: 16px;
  background-color: darkslategray;
}

.custom-tab {
  border-radius: 16px;
  padding: 8px 16px;
  margin: 0 4px;
}

.nutrition-container {
  padding: 16px;
}

.tab-content {
  margin-top: 16px;
}
</style>
