<!-- components/training/search/ExerciseFilters.vue -->
<template>
  <div class="exercise-filters">
    <v-btn @click="toggleFilters">
      {{ showFilters ? 'Скрыть фильтры' : 'Показать фильтры' }}
      <v-icon right>{{ showFilters ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
    </v-btn>
    <v-expand-transition>
      <div v-show="showFilters" class="filters-container">
        <v-select
            v-model="filtersProxy.typeExercise"
            :items="typeExerciseOptions"
            label="Тип упражнения"
            multiple
            variant="outlined"
            clearable
            chips
            chip-color="primary"
        />
        <v-select
            v-model="filtersProxy.category"
            :items="categoryOptions"
            label="Категория"
            multiple
            variant="outlined"
            clearable
            chips
            chip-color="primary"
        />
        <v-select
            v-model="filtersProxy.equipment"
            :items="equipmentOptions"
            label="Оборудование"
            multiple
            variant="outlined"
            clearable
            chips
            chip-color="primary"
        />
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
    // Теперь v-model ожидает объект, где каждое поле – массив строк
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

    // Используем вычисляемое свойство как proxy для v-model
    const filtersProxy = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val),
    });

    // Функция для нормализации значения: удаляем пробелы, приводим к нижнему регистру
    const normalize = (str: string) => str.trim().toLowerCase();

    // Функция для приведения к виду с первой заглавной буквой (для отображения)
    const capitalize = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    // Вычисляем опции для типа упражнения с объединением значений, отличающихся только регистром
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

    // Аналогично для категорий
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

    // И для оборудования
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

    return {
      showFilters,
      toggleFilters,
      filtersProxy,
      typeExerciseOptions,
      categoryOptions,
      equipmentOptions,
    };
  },
});
</script>

<style scoped>
.exercise-filters {
  margin: 8px 0;
}
.filters-container {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 8px;
}
</style>
