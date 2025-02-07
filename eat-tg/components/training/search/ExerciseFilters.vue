<!-- components/training/search/ExerciseFilters.vue -->
<template>
  <div class="exercise-filters">
    <v-btn @click="toggleFilters">
      {{ showFilters ? 'Скрыть фильтры' : 'Показать фильтры' }}
      <v-icon right>{{ showFilters ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
    </v-btn>
    <v-expand-transition>
      <div v-show="showFilters" class="filters-container">
        <!-- Первая строка: селект для "Виды нагрузок" -->
        <v-row>
          <v-col cols="12">
            <v-select
                inputmode="none"
                v-model="displayTypeExercise"
                :items="typeExerciseOptions"
                label="Виды нагрузок"
                multiple
                variant="outlined"
                chips
                closable-chips
                chip-color="primary"
            />
          </v-col>
        </v-row>
        <!-- Вторая строка: селекты для "Мышцы" и "Инвентарь" -->
        <v-row class="mt-0">
          <v-col cols="6">
            <v-select
                inputmode="none"
                v-model="displayCategory"
                :items="categoryOptions"
                label="Мышцы"
                multiple
                variant="outlined"
                chips
                closable-chips
                chip-color="primary"
            />
          </v-col>
          <v-col cols="6">
            <v-select
                inputmode="none"
                v-model="displayEquipment"
                :items="equipmentOptions"
                label="Инвентарь"
                multiple
                variant="outlined"
                chips
                closable-chips
                chip-color="primary"
            />
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import type { Exercise } from '../../../composables/types';

export default defineComponent({
  name: 'ExerciseFilters',
  props: {
    // v-model ожидает объект с массивами строк для каждого фильтра
    modelValue: {
      type: Object as () => { typeExercise: string[]; category: string[]; equipment: string[] },
      required: true,
    },
    exercises: {
      type: Array as () => Exercise[],
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const showFilters = ref(false);
    const toggleFilters = () => {
      showFilters.value = !showFilters.value;
    };

    // Прокси для v-model
    const filtersProxy = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val),
    });

    // Функции нормализации и форматирования строк
    const normalize = (str: string) => str.trim().toLowerCase();
    const capitalize = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    // Опции для "Виды нагрузок" (ранее типа упражнения)
    const typeExerciseOptions = computed(() => {
      const map = new Map<string, string>();
      props.exercises.forEach((ex) => {
        if (ex.typeExercise) {
          const norm = normalize(ex.typeExercise);
          if (!map.has(norm)) {
            map.set(norm, capitalize(ex.typeExercise));
          }
        }
      });
      return Array.from(map.values());
    });

    // Опции для "Мышцы" (категория)
    const categoryOptions = computed(() => {
      const map = new Map<string, string>();
      props.exercises.forEach((ex) => {
        if (ex.category) {
          const norm = normalize(ex.category);
          if (!map.has(norm)) {
            map.set(norm, capitalize(ex.category));
          }
        }
      });
      return Array.from(map.values());
    });

    // Опции для "Инвентарь" (оборудование)
    const equipmentOptions = computed(() => {
      const map = new Map<string, string>();
      props.exercises.forEach((ex) => {
        if (ex.equipment) {
          const norm = normalize(ex.equipment);
          if (!map.has(norm)) {
            map.set(norm, capitalize(ex.equipment));
          }
        }
      });
      return Array.from(map.values());
    });

    // computed для отображения дефолтного значения "Все", если массив пустой
    const displayTypeExercise = computed<string[]>({
      get: () =>
          filtersProxy.value.typeExercise.length
              ? filtersProxy.value.typeExercise
              : ['Все'],
      set: (val: string[]) => {
        // Если единственный выбранный элемент – "Все", интерпретируем как отсутствие фильтра
        filtersProxy.value.typeExercise = (val.length === 1 && val[0] === 'Все') ? [] : val;
      },
    });

    const displayCategory = computed<string[]>({
      get: () =>
          filtersProxy.value.category.length
              ? filtersProxy.value.category
              : ['Все'],
      set: (val: string[]) => {
        filtersProxy.value.category = (val.length === 1 && val[0] === 'Все') ? [] : val;
      },
    });

    const displayEquipment = computed<string[]>({
      get: () =>
          filtersProxy.value.equipment.length
              ? filtersProxy.value.equipment
              : ['Все'],
      set: (val: string[]) => {
        filtersProxy.value.equipment = (val.length === 1 && val[0] === 'Все') ? [] : val;
      },
    });

    return {
      showFilters,
      toggleFilters,
      filtersProxy,
      typeExerciseOptions,
      categoryOptions,
      equipmentOptions,
      displayTypeExercise,
      displayCategory,
      displayEquipment,
    };
  },
});
</script>

<style scoped>
.exercise-filters {
  margin: 8px 0;
}

.filters-container {
  margin-top: 12px;
}

/* Если потребуется дополнительное оформление для отступов внутри строк,
   можно воспользоваться классами Vuetify или добавить свои стили */
</style>
