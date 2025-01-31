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

      <!-- Список упражнений в виде карточек -->
      <v-list v-else>
        <v-list-item
            v-for="exercise in finalExercises"
            :key="exercise._id"
            class="px-0"
        >
          <v-card class="mx-auto mb-4" outlined>
            <!-- Заголовок упражнения -->
            <v-card-title class="headline text-center" style="word-break: break-word;">
              {{ formatExerciseName(exercise.name) }}
            </v-card-title>

            <!-- Изображение GIF (если имеется) -->
            <v-img
                v-if="exercise.gifImage"
                :src="exercise.gifImage"
                aspect-ratio="16/9"
                class="my-2 rounded-lg"
                :alt="formatExerciseName(exercise.name)"
            />

            <!-- Информация об упражнении -->
            <v-card-text>
              <!-- Основная мышца -->
              <div v-if="exercise.mainMuscle">
                <v-chip color="primary" text-color="white" class="ma-1">
                  {{ exercise.mainMuscle }}
                </v-chip>
              </div>

              <!-- Дополнительные мышцы (если есть, ожидается, что они заданы через запятую) -->
              <div v-if="exercise.additionalMuscles">
                <v-chip
                    v-for="(muscle, index) in exercise.additionalMuscles.split(',')"
                    :key="'additional-muscle-' + index"
                    color="secondary"
                    text-color="white"
                    class="ma-1"
                >
                  {{ muscle.trim() }}
                </v-chip>
              </div>

              <!-- Оборудование -->
              <div v-if="exercise.equipment" class="mt-2">
                <v-chip color="success" text-color="white" class="ma-1">
                  {{ exercise.equipment }}
                </v-chip>
              </div>

              <!-- Техника выполнения (если есть) -->
              <div v-if="exercise.technique" class="mt-2">
                <p class="mb-0">{{ exercise.technique }}</p>
              </div>
            </v-card-text>

            <!-- Действия: кнопка подробной информации и кнопка добавления -->
            <v-card-actions class="justify-end">
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

              <v-btn
                  :disabled="isAdding[exercise._id]"
                  @click="addExercise(exercise)"
                  icon
                  class="pl-2"
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
            </v-card-actions>
          </v-card>
        </v-list-item>
      </v-list>
    </v-card-text>

    <!-- Модальное окно с подробной информацией об упражнении -->
    <ExerciseInfo
        :exercise="selectedExercise"
        v-model="showExerciseInfo"
    />
  </BottomSheetWithClose>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useExerciseFilter } from '../../composables/useExerciseFilter';
import { useApi } from '../../composables/useApi';
import type { Exercise, WorkoutResult, RepetitionLevels } from '../../composables/types';
import ExerciseInfo from '../../components/training/ExerciseInfo.vue';
import BottomSheetWithClose from '../../components/shared/BottomSheetWithClose.vue';

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
    const { apiRequest } = useApi();

    const searchQuery = ref('');
    const isAdding = ref<{ [key: string]: boolean }>({});
    const showExerciseInfo = ref(false);
    const selectedExercise = ref<Exercise | null>(null);
    const isLoading = ref(false);
    const isLoaded = ref(false); // Флаг для однократной загрузки

    // v-model для BottomSheet
    const sheet = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val),
    });

    const exercisesRef = ref<Exercise[]>(props.exercises);

    // Функция для загрузки упражнений
    const loadExercises = async () => {
      if (isLoaded.value) return;
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
      } finally {
        isLoading.value = false;
      }
    };

    // При открытии листа загружаем данные
    watch(sheet, (newVal) => {
      if (newVal) {
        loadExercises();
      }
    });

    // Используем фильтрацию упражнений
    const { filteredExercises, displayedExercises } = useExerciseFilter(exercisesRef, searchQuery);

    // Дополнительная фильтрация по повторениям и полу
    const finalExercises = computed(() => {
      const gender = props.gender;
      let repsKeys: (keyof RepetitionLevels)[] = [];
      if (gender === 'Мужчина') {
        repsKeys = ['maleRepsLight', 'maleRepsMedium', 'maleRepsHeavy'];
      } else if (gender === 'Женщина') {
        repsKeys = ['femaleRepsLight', 'femaleRepsMedium', 'femaleRepsHeavy'];
      } else {
        return displayedExercises.value.slice(0, 30);
      }
      const filtered = displayedExercises.value.filter((exercise) => {
        return repsKeys.some((key) => exercise[key] && exercise[key] !== '—');
      });
      return filtered.slice(0, 30);
    });

    // Метод добавления упражнения
    const addExercise = async (exercise: Exercise) => {
      if (isAdding.value[exercise._id]) return;
      isAdding.value[exercise._id] = true;
      try {
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
        emit('add-exercise', {
          _id: exercise._id,
          name: exercise.name,
          sets,
          reps,
        });
        setTimeout(() => {
          isAdding.value[exercise._id] = false;
        }, 2000);
      } catch (error) {
        console.error('Ошибка при добавлении упражнения:', error);
        isAdding.value[exercise._id] = false;
      }
    };

    const levelMapping: { [key: string]: string } = {
      'лёгкая': 'Light',
      'средняя': 'Medium',
      'тяжёлая': 'Heavy',
    };

    const getRandomLoadLevel = (): string => {
      const r = Math.random();
      if (r < 0.5) return 'средняя';
      else if (r < 0.75) return 'лёгкая';
      else return 'тяжёлая';
    };

    const getSets = (reps: number): number => {
      if (reps === 5) return 5;
      if (reps === 6 || reps === 8) return 4;
      if (reps === 10 || reps === 12 || reps === 15 || reps === 20) return 3;
      return 3;
    };

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

    // Открытие модального окна с информацией об упражнении
    const openExerciseInfoButton = (exercise: Exercise) => {
      selectedExercise.value = exercise;
      showExerciseInfo.value = true;
    };

    watch(finalExercises, (newVal) => {
      console.log('Final Exercises:', newVal);
    });

    // Форматирование названия упражнения (первая буква заглавная)
    const formatExerciseName = (rawName: string): string => {
      if (!rawName) return '';
      return rawName.charAt(0).toUpperCase() + rawName.slice(1);
    };

    return {
      searchQuery,
      finalExercises,
      addExercise,
      isAdding,
      sheet,
      showExerciseInfo,
      selectedExercise,
      openExerciseInfoButton,
      isLoading,
      formatExerciseName,
    };
  },
});
</script>

<style scoped>
.rounded-lg {
  border-radius: 16px;
}

.ma-1 {
  margin: 4px;
}

.headline {
  font-size: 1.2rem;
  font-weight: bold;
}

/* При необходимости можно добавить дополнительные стили для карточек */
</style>
