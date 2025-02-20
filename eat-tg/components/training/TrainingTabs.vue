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

     Содержимое активной вкладки
    <div class="tab-content mt-2">
      <component v-if="currentComponent" :is="currentComponent" :tab="currentTab" />
      <p v-else>Ошибка загрузки компонента</p>
    </div>
    </v-container>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { defineAsyncComponent } from 'vue';

const TrainingOnWeek = defineAsyncComponent(() => import('./week/TrainingOnWeek.vue'));
const TrainingByMuscles = defineAsyncComponent(() => import('./TrainingByMuscles.vue'));
const ExerciseSearch = defineAsyncComponent(() => import('./ExerciseSearch.vue'));

// Определяем тип для ключей вкладок
type TabKey = 'main' | 'workoutMuscles' | 'exerciseSearch'

// Сопоставление параметров вкладок и их индексов
const tabMap: Record<TabKey, number> = {
  main: 0,
  workoutMuscles: 1,
  exerciseSearch: 2
}



// Инициализация роутера и текущего маршрута

const route = useRoute()
const router = useRouter()


// Текущая вкладка из query-параметра или 'main' по умолчанию
const currentTab = computed<TabKey>(() => {
  let queryTab = route.query.tab
  if (Array.isArray(queryTab)) {
    queryTab = queryTab[0]
  }
  return typeof queryTab === 'string' && queryTab in tabMap ? queryTab as TabKey : 'main'
})
console.log('🚨 currentTab:', currentTab.value);


// Активный индекс вкладки (без ошибки, так как currentTab.value имеет тип TabKey)
const activeTab = ref<number>(0) // По умолчанию - первая вкладка

watch(activeTab, (newIndex) => {
  const newTab = Object.keys(tabMap).find((key) => tabMap[key as TabKey] === newIndex) as TabKey;
  if (newTab && newTab !== currentTab.value) {
    router.push({ path: route.path, query: { tab: newTab } });
  }
});


watch(currentTab, (newTab) => {
  activeTab.value = tabMap[newTab] ?? 0; // Если что-то пошло не так, дефолтное значение 0
});

// Функция переключения вкладок и установки query-параметра
function changeTab(tabName: TabKey) {
  if (!tabMap[tabName]) {
    console.warn(`Попытка переключиться на несуществующую вкладку: ${tabName}`);
    return;
  }
  if (currentTab.value !== tabName) {
    router.push({
      path: route.path,
      query: { tab: tabName }
    });
  }
}


// Определяем, какой компонент отображать на основе текущей вкладки

const currentComponent = computed(() => {
  if (!currentTab.value || !(currentTab.value in tabMap)) {
    console.warn(`Некорректный tab: ${currentTab.value}, устанавливаю по умолчанию.`);
    return TrainingOnWeek; // По умолчанию
  }
  return {
    main: TrainingOnWeek,
    workoutMuscles: TrainingByMuscles,
    exerciseSearch: ExerciseSearch
  }[currentTab.value] ?? TrainingOnWeek;
});
console.log('🚨 currentComponent:', currentComponent.value);


// Следим за изменением query-параметра tab
watch(
    () => route.query.tab,
    (newTab) => {
      newTab = Array.isArray(newTab) ? newTab[0] : newTab;
      activeTab.value = tabMap[newTab as TabKey] ?? 0;
    },
    { immediate: true }
);

// При монтировании проверяем наличие корректного параметра и, если его нет, перенаправляем на main
onMounted(() => {
  const queryTab = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab;

  if (!queryTab || !(queryTab in tabMap)) {
    console.warn(`Некорректный query параметр: ${queryTab}, устанавливаю "main"`);
    router.replace({ path: route.path, query: { tab: 'main' } });
  }
});
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
