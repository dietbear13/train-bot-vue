<!-- components/AddExercise.vue -->
<template>
  <BottomSheetWithClose
      v-model="sheet"
      title="Добавить упражнение"
      :persistent="false"
      :min-height="'95%'"
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

      <!-- Индикатор загрузки -->
      <v-progress-circular
          v-if="isLoading"
          indeterminate
          color="primary"
          class="ma-4"
      ></v-progress-circular>

      <!-- Список упражнений -->
      <v-list v-else>
        <v-list-item
            v-for="exercise in finalExercises"
            :key="exercise._id"
            class="exercise-item px-0"
            :width="'98%'"

        >
          <v-list-item class="mx-0">
            <v-list-item-title class="exercise-title">
              {{ formatExerciseName(exercise.name) }}
            </v-list-item-title>
            <v-list-item-subtitle class="exercise-subtitle">
              {{ exercise.mainMuscle }}
            </v-list-item-subtitle>
          </v-list-item>
          <v-list-item-action>
            <!-- Кнопка информации об упражнении через ExerciseInfo.vue -->
            <v-tooltip bottom>
              <template #activator="slotProps">
                <v-btn
                    variant="plain"
                    icon
                    @click="openExerciseInfoButton(exercise)"
                    :title="'Информация о ' + formatExerciseName(exercise.name)"
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
import { defineComponent, ref, computed, watch } from 'vue';
import { useExerciseFilter } from '~/composables/useExerciseFilter';
import { useApi } from '~/composables/useApi'; // Импортируем общий API-сервис
import type { Exercise, WorkoutResult, RepetitionLevels } from '~/composables/types';
import ExerciseInfo from '~/components/training/ExerciseInfo.vue';
import BottomSheetWithClose from '~/components/shared/BottomSheetWithClose.vue';

export default defineComponent({
  name: 'AddExercise',
  components: {
    ExerciseInfo,
    BottomSheetWithClose,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    muscleGroup: {
      type: String,
      required: true,
    },
    muscleSubgroup: {
      type: String,
      required: true,
    },
    exercises: {
      type: Array as () => Exercise[],
      required: false,
      default: () => [],
    },
    usedExerciseIds: {
      type: Object as () => Set<string>,
      required: true,
    },
  },
  emits: ['update:modelValue', 'add-exercise'],
  setup(props, { emit }) {
    const { apiRequest } = useApi(); // Используем общий API-сервис

    const searchQuery = ref('');
    const isAdding = ref<{ [key: string]: boolean }>({});
    const showExerciseInfo = ref(false);
    const selectedExercise = ref<Exercise | null>(null);
    const isLoading = ref(false);
    const isLoaded = ref(false); // Флаг для загрузки только один раз

    // Создаём вычисляемое свойство для v-model
    const sheet = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val),
    });

    const exercisesRef = ref<Exercise[]>(props.exercises);

    // Функция для загрузки упражнений
    const loadExercises = async () => {
      if (isLoaded.value) return; // Не загружать повторно
      isLoading.value = true;
      try {
        const fetchedExercises = await apiRequest<Exercise[]>('get', 'exercises', null, {
          gender: props.gender,
          muscleGroup: props.muscleGroup,
          muscleSubgroup: props.muscleSubgroup,
        });
        exercisesRef.value = fetchedExercises;
        isLoaded.value = true;
      } catch (error) {
        console.error('Ошибка при загрузке упражнений:', error);
        // Вы можете добавить уведомление пользователю о неудачной загрузке
      } finally {
        isLoading.value = false;
      }
    };

    // Watcher для открытия листа
    watch(sheet, (newVal) => {
      if (newVal) {
        loadExercises();
      }
    });

    // Используем хук useExerciseFilter, передавая Ref<Exercise[]> и Ref<string>
    const { filteredExercises, displayedExercises } = useExerciseFilter(exercisesRef, searchQuery);

    // Дополнительная фильтрация по сложности и полу с ограничением до 30 результатов
    const finalExercises = computed(() => {
      const gender = props.gender;
      let repsKeys: (keyof RepetitionLevels)[] = {};

      if (gender === 'Мужчина') {
        repsKeys = ['maleRepsLight', 'maleRepsMedium', 'maleRepsHeavy'];
      } else if (gender === 'Женщина') {
        repsKeys = ['femaleRepsLight', 'femaleRepsMedium', 'femaleRepsHeavy'];
      } else {
        // Если есть другие гендеры, добавьте соответствующие ключи
        return displayedExercises.value.slice(0, 30);
      }

      const filtered = displayedExercises.value.filter((exercise) => {
        // Проверяем, что хотя бы одно поле повторений для текущего пола не равно '—'
        return repsKeys.some((key) => exercise[key] && exercise[key] !== '—');
      });

      return filtered.slice(0, 30);
    });

    // Метод добавления упражнения
    const addExercise = async (exercise: Exercise) => {
      if (isAdding.value[exercise._id]) return;
      isAdding.value[exercise._id] = true;

      try {
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
          reps,
        });

        // Показать "Добавлено" на 2 секунды
        setTimeout(() => {
          isAdding.value[exercise._id] = false;
        }, 2000);
      } catch (error) {
        console.error('Ошибка при добавлении упражнения:', error);
        isAdding.value[exercise._id] = false;
      }
    };

    // Карта «лёгкая-средняя-тяжёлая» -> "Light"/"Medium"/"Heavy"
    const levelMapping: { [key: string]: string } = {
      'лёгкая': 'Light',
      'средняя': 'Medium',
      'тяжёлая': 'Heavy',
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

    // Отладочные выводы (по желанию)
    watch(finalExercises, (newVal) => {
      console.log('Final Exercises:', newVal);
    });

    /**
     * Новый метод: делает первый символ заглавным,
     * остальные символы остаются в исходном регистре.
     */
    const formatExerciseName = (rawName: string): string => {
      if (!rawName) return '';
      return rawName.charAt(0).toUpperCase() + rawName.slice(1);
    };

    return {
      searchQuery,
      finalExercises, // Используем в шаблоне для отображения
      addExercise,
      isAdding,
      sheet, // Добавлено для v-model
      showExerciseInfo, // Добавлено для управления видимостью
      selectedExercise, // Добавлено для хранения выбранного упражнения
      openExerciseInfoButton, // Добавлено для открытия информации
      isLoading,
      formatExerciseName // Добавлено для форматирования названия упражнения
    };
  },
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

.exercise-subtitle {
  font-size: 0.9rem;
  color: #959595;
}

.add-button {
  width: 30px;
  height: 30px;
  min-width: 30px; /* Для иконок в Vuetify */
}

/* Заголовок внутри тела листа */
.headline {
  font-size: 1.2rem;
  font-weight: bold;
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
