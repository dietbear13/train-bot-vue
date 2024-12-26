<!-- components/AddExercise.vue -->
<template>
  <BottomSheetWithClose
      v-model="sheet"
      title="Добавить упражнение" <!-- Заголовок -->
  :max-width="'600px'"
  :persistent="false"
  >
  <v-card-text class="my-2">
    <!-- Строка поиска -->
    <v-text-field
        v-model="searchQuery"
        label="Начни вводить упражнение"
        append-icon="mdi-magnify"
        clearable
        variant="outlined"
        hide-details="auto"
    ></v-text-field>

    <!-- Список упражнений -->
    <v-list>
      <v-list-item
          v-for="exercise in finalExercises"
          :key="exercise._id"
          class="exercise-item"
      >
        <v-list-item-content>
          <v-list-item-title class="exercise-title">
            {{ exercise.name }}
          </v-list-item-title>
        </v-list-item-content>
        <v-list-item-action>
          <!-- Кнопка информации об упражнении через ExerciseInfo.vue -->
          <v-tooltip bottom>
            <template #activator="slotProps">
              <v-btn
                  variant="plain"
                  icon
                  @click="openExerciseInfoButton(exercise)"
                  :title="'Информация о ' + exercise.name"
                  aria-label="Информация об упражнении"
                  v-bind="slotProps.attrs"
                  v-on="slotProps.on"
              >
                <v-icon>mdi-information-outline</v-icon>
              </v-btn>
            </template>
            <span>Подробнее</span>
          </v-tooltip>

          <!-- Кнопка добавления упражнения -->
          <v-btn
              :disabled="isAdding[exercise._id]"
              @click="addExercise(exercise)"
              icon
              class="add-button pl-2"
              :color="isAdding[exercise._id] ? 'green' : 'primary'"
              :title="isAdding[exercise._id] ? 'Добавлено' : 'Добавить'"
              aria-label="Добавить упражнение"
          >
            <v-icon>
              <template v-if="isAdding[exercise._id]">
                mdi-check
              </template>
              <template v-else>
                mdi-plus
              </template>
            </v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </v-card-text>

  <!-- Использование компонента ExerciseInfo -->
  <ExerciseInfo
      :exercise="selectedExercise"
      v-model="showExerciseInfo"
  />
  </BottomSheetWithClose>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useExerciseFilter } from '~/composables/useExerciseFilter';
import type { Exercise, WorkoutResult, RepetitionLevels } from '~/composables/types';
import ExerciseInfo from '~/components/ExerciseInfo.vue'; // Импортируем компонент
import BottomSheetWithClose from '~/components/BottomSheetWithClose.vue'; // Импортируем универсальный компонент

export default defineComponent({
  name: 'AddExercise',
  components: {
    ExerciseInfo,
    BottomSheetWithClose // Регистрируем универсальный компонент
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    gender: {
      type: String,
      required: true
    },
    muscleGroup: {
      type: String,
      required: true
    },
    muscleSubgroup: {
      type: String,
      required: true
    },
    exercises: {
      type: Array as () => Exercise[],
      required: true
    },
    usedExerciseIds: {
      type: Object as () => Set<string>,
      required: true
    }
  },
  emits: ['update:modelValue', 'add-exercise'],
  setup(props, { emit }) {
    const searchQuery = ref('');
    const isAdding = ref<{ [key: string]: boolean }>({});
    const showExerciseInfo = ref(false);
    const selectedExercise = ref<Exercise | null>(null); // Состояние для выбранного упражнения

    // Создаём вычисляемое свойство для v-model
    const sheet = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val)
    });

    // Преобразуем props.exercises в Ref<Exercise[]>
    const exercisesRef = computed(() => props.exercises);

    // Используем хук useExerciseFilter, передавая Ref<Exercise[]> и Ref<string>
    const { filteredExercises, displayedExercises } = useExerciseFilter(exercisesRef, searchQuery);

    // Дополнительная фильтрация по сложности и полу с ограничением до 30 результатов
    const finalExercises = computed(() => {
      const gender = props.gender;
      let repsKeys: (keyof RepetitionLevels)[] = [];

      if (gender === 'Мужчина') {
        repsKeys = ['maleRepsLight', 'maleRepsMedium', 'maleRepsHeavy'];
      } else if (gender === 'Женщина') {
        repsKeys = ['femaleRepsLight', 'femaleRepsMedium', 'femaleRepsHeavy'];
      } else {
        // Если есть другие гендеры, добавьте соответствующие ключи
        return displayedExercises.value.slice(0, 30); // Ограничение до 30
      }

      const filtered = displayedExercises.value.filter(exercise => {
        // Проверяем, что хотя бы одно поле повторений для текущего пола не равно '—'
        return repsKeys.some(key => exercise[key] && exercise[key] !== '—');
      });

      return filtered.slice(0, 30); // Ограничение до 30
    });

    // Метод добавления упражнения
    const addExercise = (exercise: Exercise) => {
      if (isAdding.value[exercise._id]) return;
      isAdding.value[exercise._id] = true;

      // Генерация повторений и подходов
      const loadLevel = getRandomLoadLevel();
      const repsOptions = getRepsOptions(exercise, props.gender, loadLevel);
      if (!repsOptions) {
        isAdding.value[exercise._id] = false;
        return;
      }
      const repsArray = repsOptions
          .split(',')
          .map((x) => parseInt(x, 10))
          .filter((n) => !isNaN(n));
      if (repsArray.length === 0) {
        isAdding.value[exercise._id] = false;
        return;
      }
      const reps = repsArray[Math.floor(Math.random() * repsArray.length)];
      const sets = getSets(reps);

      // Эмитирование события добавления упражнения
      emit('add-exercise', {
        _id: exercise._id,
        name: exercise.name,
        sets,
        reps
      });

      // Показать "Добавлено" на 2 секунды
      setTimeout(() => {
        isAdding.value[exercise._id] = false;
      }, 2000);
    };

    // Карта «лёгкая-средняя-тяжёлая» -> "Light"/"Medium"/"Heavy"
    const levelMapping: { [key: string]: string } = {
      'лёгкая': 'Light',
      'средняя': 'Medium',
      'тяжёлая': 'Heavy'
    };

    // Получение случайного уровня нагрузки
    const getRandomLoadLevel = (): string => {
      const r = Math.random();
      if (r < 0.5) return 'средняя';
      else if (r < 0.75) return 'лёгкая';
      else return 'тяжёлая';
    };

    // Получение количества подходов на основе повторений
    const getSets = (reps: number): number => {
      if (reps === 5) return 5;
      if (reps === 6 || reps === 8) return 4;
      if (reps === 10 || reps === 12 || reps === 15 || reps === 20) return 3;
      return 3;
    };

    // Получение вариантов повторений
    const getRepsOptions = (
        exercise: Exercise,
        genderStr: string,
        loadLevel: string
    ): string | null => {
      if (!loadLevel) return null;
      const mappedLevel = levelMapping[loadLevel.toLowerCase()];
      if (!mappedLevel) return null;
      const repsKey = `${genderStr === 'Мужчина' ? 'male' : 'female'}Reps${mappedLevel}` as keyof RepetitionLevels;
      const repsValue = exercise[repsKey];
      if (!repsValue || repsValue === '—') return null;
      return repsValue;
    };

    // Метод открытия информации об упражнении
    const openExerciseInfoButton = (exercise: Exercise) => {
      selectedExercise.value = exercise;
      showExerciseInfo.value = true;
    };

    return {
      searchQuery,
      finalExercises,     // Используем в шаблоне для отображения
      addExercise,
      isAdding,
      sheet, // Добавлено для v-model
      showExerciseInfo, // Добавлено для управления видимостью
      selectedExercise, // Добавлено для хранения выбранного упражнения
      openExerciseInfoButton // Добавлено для открытия информации
    }
  }
});
</script>

<style scoped>
.rounded-t-xl {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
.exercise-title {
  white-space: normal; /* Разрешаем перенос текста */
  overflow: hidden;
  text-overflow: ellipsis; /* Добавить многоточие при переполнении */
  word-break: break-word; /* Перенос слов при необходимости */
  overflow-wrap: break-word; /* Перенос длинных слов */
}
.add-button {
  width: 30px;
  height: 30px;
  min-width: 30px; /* Для иконок в Vuetify */
}

/* Заголовок внутри тела листа */
.headline {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
}

.headline.mb-4 {
  margin-bottom: 16px; /* Добавляем нижний отступ */
}

/* Фиксированная высота для AddExercise */
.fixed-height {
  height: 500px; /* Установите желаемую фиксированную высоту */
  overflow-y: auto; /* Добавляем вертикальную прокрутку при необходимости */
}
</style>
