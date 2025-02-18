<!--components\training\TrainingTabs.vue-->

<template>
  <v-container class="training-container">
    <!-- Табы -->
    <v-tabs
        v-model="activeTab"
        background-color="transparent"
        dark
        fixed-tabs
        grow
        align-tabs="center"
        hide-slider
        class="custom-tabs"
    >
      <v-tab
          class="custom-tab px-1"
          style="border-radius: 16px"
          :class="{ 'active-tab': activeTab === 0 }"
      >
        Прога на неделю
      </v-tab>

      <v-tab
          class="custom-tab px-1"
          style="border-radius: 16px"
          :class="{ 'active-tab': activeTab === 1 }"
      >
        На одну мышцу
      </v-tab>

      <v-tab
          class="custom-tab px-1"
          style="border-radius: 16px"
          :class="{ 'active-tab': activeTab === 2 }"
      >
        Вики
      </v-tab>
    </v-tabs>

<!--     Содержимое активной вкладки-->
    <div class="tab-content mt-2">
      <component :is="currentComponent" :tab="currentTab" />
    </div>
    </v-container>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Импорт компонентов вкладок
import TrainingOnWeek from './week/TrainingOnWeek.vue'
import TrainingByMuscles from './TrainingByMuscles.vue'
import ExerciseSearch from './ExerciseSearch.vue'

// Определяем тип для ключей вкладок
type TabKey = 'main' | 'workout-muscles' | 'exercise-search'

// Сопоставление параметров вкладок и их индексов
const tabMap: Record<TabKey, number> = {
  main: 0,
  'workout-muscles': 1,
  'exercise-search': 2
}

// Инициализация роутера и текущего маршрута

const route = useRoute()
const router = useRouter()

// Текущая вкладка из query-параметра или 'main' по умолчанию
const currentTab = computed<TabKey>(() => {
  // console.log('current tab',  route.query.tab)
  const currentTab = computed<TabKey>(() => {
    let queryTab = route.query.tab
    if (Array.isArray(queryTab)) {
      queryTab = queryTab[0]
    }
    return typeof queryTab === 'string' && queryTab in tabMap ? queryTab as TabKey : 'main'
  })
  return 'main'
})

// Активный индекс вкладки (без ошибки, так как currentTab.value имеет тип TabKey)
const activeTab = ref<number>(tabMap[currentTab.value])
// const activeTab = ref<number>(1)

// Функция переключения вкладок и установки query-параметра
function changeTab(tabName: TabKey) {
  if (currentTab.value !== tabName) {
    router.push({
      path: route.path, // или укажите '/' для главной страницы
      query: { tab: tabName }
    })
  }
}


// Определяем, какой компонент отображать на основе текущей вкладки

const currentComponent = computed(() => {
  console.log('currentTab', currentTab.value)
  switch (currentTab.value) {
    case 'main':
      return TrainingOnWeek
    case 'workout-muscles':
      return TrainingByMuscles
    case 'exercise-search':
      return ExerciseSearch
    default:
      console.log('currentTab def', currentTab.value)
      return TrainingOnWeek
  }
})


// Следим за изменением query-параметра tab
watch(
    () => route.query.tab,
    (newTab) => {
      if (Array.isArray(newTab)) {
        newTab = newTab[0]
      }
      if (typeof newTab === 'string' && newTab in tabMap) {
        activeTab.value = tabMap[newTab as TabKey]
      } else {
        router.replace({ path: route.path, query: { tab: 'main' } })
      }
    },
    { immediate: true }
)

// При монтировании проверяем наличие корректного параметра и, если его нет, перенаправляем на main
onMounted(() => {
  const queryTab = route.query.tab
  if (
      typeof queryTab !== 'string' ||
      !(queryTab === 'main' || queryTab === 'workout-muscles' || queryTab === 'exercise-search')
  ) {
    router.replace({ path: route.path, query: { tab: 'main' } })
  }
})
onMounted(() => {
  if (!route.query.tab || tabMap[route.query.tab as string] === undefined) {
    router.replace({ path: route.path, query: { tab: 'main' } })
  }
})
</script>

<style scoped>
.training-container {
  padding: 16px;
}

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
}

.tab-content {
  margin-top: 16px;
}
</style>
