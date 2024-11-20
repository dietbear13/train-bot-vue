<!-- components/TrainingByMuscles.vue -->

<template>
  <v-form @submit.prevent="generateWorkout">
    <!-- Выбор пола -->
    <p>Все вводимые в калькулятор данные не сохраняются и не используются.</p>
    <v-card class="my-2 dark-background pa-1" variant="tonal">
      <v-card-text class="pa-1">
        <v-slide-group
            v-model="gender"
            show-arrows
            class="flex-nowrap"
            center-active
            mandatory
        >
          <v-slide-group-item
              v-for="option in genders"
              :key="option"
              :value="option"
          >
            <v-btn
                variant="text"
                outlined
                class="group-button mx-auto"
                :class="{ 'selected-button': gender === option }"
                @click="selectGender(option)"
                rounded="lg"
            >
              {{ option }}
            </v-btn>
          </v-slide-group-item>
        </v-slide-group>
      </v-card-text>
    </v-card>

    <!-- Выбор мышечной группы -->
    <v-card class="my-2 dark-background pa-3" variant="tonal">
      <v-card-text class="pa-1">
        <v-row>
          <v-col cols="6" class="px-2 py-0" v-for="(option, index) in muscleGroups" :key="option">
            <v-btn
                :value="option"
                class="group-button mx-auto my-1 px-2"
                style="min-width: 100%;"
                :class="{ 'selected-button': muscleGroup === option }"
                @click="selectMuscleGroup(option)"
                rounded="lg"
                block
            >
              {{ option }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Выбор мышечной подгруппы -->
    <v-card class="my-2 dark-background pa-3" variant="tonal">
      <v-card-text class="pa-1">
        <v-row>
          <v-col cols="6" class="px-2 py-0" v-for="(option, index) in muscleSubgroups" :key="option">
            <v-btn
                :value="option"
                class="group-button mx-auto my-1 py-1 px-2"
                style="min-width: 100%;"
                :class="{ 'selected-button': muscleSubgroup === option }"
                @click="selectMuscleSubgroup(option)"
                rounded="lg"
                block
            >
              {{ option }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Кнопка для генерации тренировки -->
    <v-btn
        :disabled="isGenerating || timer > 0"
        @click="generateWorkout"
        color="success"
        class="mt-1"
        rounded="lg"
        width="100%"
    >
      <v-icon left>mdi-dumbbell</v-icon>
      {{ timer > 0 ? `Повторная генерация через ${timer} с` : 'Сгенерировать' }}
    </v-btn>
    <!-- Сообщение об ошибке -->
    <v-alert
        v-if="errorMessages.length > 0"
        type="error"
        class="mt-2"
        dismissible
        @input="errorMessages = []"
    >
      <ul>
        <li v-for="(msg, index) in errorMessages" :key="index">{{ msg }}</li>
      </ul>
    </v-alert>

    <!-- v-bottom-sheet с таблицей упражнений -->
    <v-bottom-sheet
        v-model="showBottomSheet"
        scrim
        :persistent="false"
        content-class="rounded-bottom-sheet"
    >
      <v-card>
        <v-card-title class="ml-4">Ваша тренировка</v-card-title>
        <v-card-text class="my-2">
          <!-- Используем стандартную таблицу -->
          <v-data-table
              :items="workoutResults"
              class="rounded-bottom-sheet"

              hide-default-header
              hide-default-footer
              >
            <!-- Оборачиваем tbody в draggable -->
            <draggable
                tag="tbody"
                v-model="workoutResults"
                handle=".drag-handle"
                animation="200"
                item-key="_id"
            >
              <!-- Используем слот item для рендеринга элементов -->
              <template #item="{ element, index }">
                <tr>
                  <td style="cursor: move; padding: 0 4px;">

                    <div class="drag-handle" style="display: flex; align-items: center;">
                      <v-icon class="mr-1">mdi-shuffle-variant
                      </v-icon>
                    </div>
                  </td>
                  <td class="drag-handle" style="padding: 0 4px;">{{ element.name }}</td>
                  <td class="fixed-width sets-reps-column" style="padding: 0 4px;">
                    <div class="sets-reps-container ">
                      <v-btn
                          icon small
                          @click="decreaseReps(index)"
                          variant="plain"
                          class="mx-1"
                      >
                        <v-icon small class="ml-2">mdi-minus</v-icon>
                      </v-btn>
                      <span>{{ element.sets }} × {{ element.reps }}</span>
                      <v-btn
                          icon small
                          @click="increaseReps(index)"
                          variant="plain"
                          class="mx-1"
                      >
                        <v-icon small class="ml-2">mdi-plus</v-icon>
                      </v-btn>
                    </div>
                  </td>
                  <td class="fixed-width action-column" style="padding: 0 4px;">
                    <v-btn icon @click="regenerateExercise(index)" variant="plain">
                      <v-icon >mdi-refresh</v-icon>
                    </v-btn>
                    <v-btn icon @click="removeExercise(index)" variant="plain">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </template>
            </draggable>
          </v-data-table>

          <!-- Остальной код остаётся без изменений -->
          <div class="text-center mt-2">
            <v-btn
                color="primary"
                @click="generateWorkout"
                :disabled="isGenerating || timer > 0"
                rounded="lg"
                class="mb-1"
            >
              <v-icon left>mdi-refresh</v-icon>
              Сгенерировать заново
            </v-btn>
            <v-btn
                color="primary"
                @click="sendWorkout"
                :disabled="!telegramUserId"
                rounded="lg"
            >
              <v-icon left>mdi-send</v-icon>
              Отправить себе
            </v-btn>
            <v-btn
                @click="showBottomSheet = false"
                rounded="lg"
                variant="plain"
            >
              Закрыть
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-bottom-sheet>
  </v-form>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import axios, { type AxiosRequestConfig, type Method } from 'axios';
import draggable from 'vuedraggable';

// Определение базовых URL-адресов
const primaryBaseURL = 'https://fit-server-bot.ru.tuna.am/api/';
const fallbackBaseURL = 'http://localhost:3002/api/';

// Вспомогательная функция для выполнения API-запросов с приоритетом
const apiRequest = async <T>(
    method: Method,
    endpoint: string,
    data?: any,
    params?: any
): Promise<T> => {
  const config: AxiosRequestConfig = {
    method,
    url: primaryBaseURL + endpoint,
    data,
    params,
    timeout: 5000, // Установите тайм-аут по необходимости
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (primaryError) {
    console.warn(
        `Основной сервер не доступен: ${primaryError}. Переключение на резервный сервер.`
    );
    // Попытка с резервным сервером
    const fallbackConfig: AxiosRequestConfig = {
      method,
      url: fallbackBaseURL + endpoint,
      data,
      params,
      timeout: 5000, // Установите тайм-аут по необходимости
    };
    try {
      const response = await axios(fallbackConfig);
      return response.data;
    } catch (fallbackError) {
      console.error(`Резервный сервер также не доступен: ${fallbackError}`);
      throw fallbackError;
    }
  }
};

// Интерфейсы
interface RepetitionLevels {
  maleRepsLight: string;
  maleRepsMedium: string;
  maleRepsHeavy: string;
  femaleRepsLight: string;
  femaleRepsMedium: string;
  femaleRepsHeavy: string;
}

interface Exercise extends RepetitionLevels {
  _id: string;
  category: string;
  subcategory: string;
  mainMuscle: string;
  additionalMuscles: string;
  difficultyLevel: string;
  name: string;
  equipment: string;
}

interface PatternExercise {
  muscleGroup: string;
  mainMuscle: string;
  repetitionLevel: string;
  additionalColumn: string;
  _id?: string;
}

interface Pattern {
  _id: string;
  gender: string;
  complexNumber: string;
  exerciseLevel?: string;
  exercises: PatternExercise[];
}

interface WorkoutResult {
  _id: string;
  name: string;
  sets: number;
  reps: number;
}

interface TelegramUserData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

import { retrieveLaunchParams } from '@telegram-apps/sdk';

export default defineComponent({
  name: 'TrainingByMuscles',
  components: {
    draggable,
  },
  setup() {
    // Переменные для данных пользователя и initData
    const userData = ref<TelegramUserData | null>(null);
    const telegramUserId = ref<number | null>(null);
    const initData = ref<any>(null);

    // Переменные формы
    const gender = ref<string>('');
    const muscleGroup = ref<string>('');
    const muscleSubgroup = ref<string>('');

    const genders = ['Мужчина', 'Женщина'];
    const muscleGroups = ref<string[]>([]);
    const muscleSubgroups = ref<string[]>([]);
    const complexes = ref<string[]>([]);
    const workoutResults = ref<WorkoutResult[]>([]);

    const exercises = ref<Exercise[]>([]);
    const patterns = ref<Pattern[]>([]);

    const isGenerating = ref(false);
    const timer = ref(0);
    let intervalId: number | null = null;

    const errorMessages = ref<string[]>([]);

    // Новые переменные
    const showBottomSheet = ref(false);
    const selectedPattern = ref<Pattern | null>(null);
    const usedExerciseIds = ref<Set<string>>(new Set());

    const onDragStart = (event) => {
      console.log('Drag started', event);
    };

    const onDragEnd = (event) => {
      console.log('Drag ended', event);
    };

    // Методы загрузки данных
    const loadExercises = async () => {
      try {
        const data = await apiRequest<Exercise[]>('get', 'exercises');
        exercises.value = data;
        console.log('Упражнения загружены:', exercises.value);
      } catch (error: any) {
        console.error('Ошибка при загрузке упражнений:', error.message);
        errorMessages.value.push('Не удалось загрузить упражнения. Попробуйте позже.');
      }
    };

    const loadPatterns = async () => {
      try {
        const data = await apiRequest<Pattern[]>('get', 'patterns');
        patterns.value = data;
        console.log('Загруженные паттерны:', patterns.value);
      } catch (error: any) {
        console.error('Ошибка при загрузке паттернов:', error.message);
        errorMessages.value.push('Не удалось загрузить паттерны. Попробуйте позже.');
      }
    };

    const populateMuscleGroups = () => {
      const groups = new Set(
          exercises.value.map((e) => e.category.trim().toLowerCase())
      );
      muscleGroups.value = Array.from(groups).map((group) => capitalize(group));
    };

    const populateMuscleSubgroups = () => {
      if (!muscleGroup.value) {
        muscleSubgroups.value = [];
        return;
      }
      const selectedMuscleGroupLower = muscleGroup.value.trim().toLowerCase();
      const subgroups = new Set(
          exercises.value
              .filter(
                  (e) => e.category.trim().toLowerCase() === selectedMuscleGroupLower
              )
              .map((e) => e.subcategory.trim().toLowerCase())
      );
      muscleSubgroups.value = Array.from(subgroups).map((subgroup) =>
          capitalize(subgroup)
      );
    };

    const populateComplexes = () => {
      if (!muscleSubgroup.value || !gender.value) {
        complexes.value = [];
        return;
      }

      const selectedGenderLower = gender.value.trim().toLowerCase();
      const selectedMuscleSubgroupLower = muscleSubgroup.value
          .trim()
          .toLowerCase();

      const availableComplexes = patterns.value.filter(
          (p) =>
              p.gender.trim().toLowerCase() === selectedGenderLower &&
              p.complexNumber.trim().toLowerCase() ===
              selectedMuscleSubgroupLower
      );

      complexes.value = availableComplexes.map((p) => p.complexNumber);
      console.log('Доступные комплексы после фильтрации:', complexes.value);
    };

    const capitalize = (str: string): string => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const levelMapping: { [key: string]: string } = {
      легкая: 'Light',
      средняя: 'Medium',
      тяжелая: 'Heavy',
    };

    const standardRepsValues = [5, 6, 8, 10, 12, 15, 20];

    const increaseReps = (index: number) => {
      const exercise = workoutResults.value[index];
      const currentReps = exercise.reps;
      let newReps;

      const currentIndex = standardRepsValues.indexOf(currentReps);

      if (currentIndex !== -1 && currentIndex < standardRepsValues.length - 1) {
        newReps = standardRepsValues[currentIndex + 1];
      } else {
        newReps = currentReps + 1;
      }

      exercise.reps = newReps;
      exercise.sets = getSets(exercise.reps);
    };

    const decreaseReps = (index: number) => {
      const exercise = workoutResults.value[index];
      const currentReps = exercise.reps;
      let newReps;

      const currentIndex = standardRepsValues.indexOf(currentReps);

      if (currentIndex > 0) {
        newReps = standardRepsValues[currentIndex - 1];
      } else if (currentIndex === 0) {
        newReps = currentReps - 1;
      } else {
        newReps = currentReps - 1;
      }

      if (newReps >= 1) {
        exercise.reps = newReps;
        exercise.sets = getSets(exercise.reps);
      }
    };

    const getRepsOptions = (
        exercise: Exercise,
        repetitionLevel: string,
        gender: string,
        loadLevel: string
    ): string | null => {
      if (!loadLevel) {
        console.warn('loadLevel is undefined or empty');
        return null;
      }
      const mappedLevel = levelMapping[loadLevel.toLowerCase()];
      if (!mappedLevel) {
        console.warn(`Неизвестный уровень нагрузки: ${loadLevel}`);
        return null;
      }
      const repsKey = `${gender === 'Мужчина' ? 'male' : 'female'}Reps${capitalize(
          mappedLevel
      )}` as keyof RepetitionLevels;
      return exercise[repsKey] || null;
    };

    const getSets = (reps: number): number => {
      if (reps === 5) return 5;
      if (reps === 6 || reps === 8) return 4;
      if (reps === 10 || reps === 12 || reps === 15 || reps === 20) return 3;
      if (reps < 5 || reps > 20) return 3;
      return 3; // Для всех остальных случаев
    };

    const generateWorkout = () => {
      if (isGenerating.value || timer.value > 0) {
        return;
      }

      if (!gender.value || !muscleGroup.value || !muscleSubgroup.value) {
        errorMessages.value.push('Пожалуйста, заполните все поля.');
        return;
      }

      isGenerating.value = true;
      errorMessages.value = [];
      workoutResults.value = [];

      const filteredPatterns = patterns.value.filter(
          (p) =>
              p.gender.trim().toLowerCase() === gender.value.trim().toLowerCase() &&
              p.complexNumber.trim().toLowerCase() ===
              muscleSubgroup.value.trim().toLowerCase()
      );

      if (filteredPatterns.length === 0) {
        errorMessages.value.push('Подходящий паттерн не найден.');
        isGenerating.value = false;
        return;
      }

      const pattern =
          filteredPatterns[Math.floor(Math.random() * filteredPatterns.length)];
      selectedPattern.value = pattern;
      console.log('Выбранный паттерн:', pattern);

      const workout: WorkoutResult[] = [];
      usedExerciseIds.value = new Set();

      for (const patternExercise of pattern.exercises) {
        if (!patternExercise.muscleGroup || !patternExercise.mainMuscle) {
          console.warn(
              'Pattern exercise is missing muscleGroup or mainMuscle'
          );
          continue;
        }

        const matchingExercises = exercises.value.filter((e) => {
          if (!e.category || !e.mainMuscle) {
            console.log('e.category', e.category)
            console.log('e.mainMuscle', e.mainMuscle)
            console.warn(
                `Exercise ${e._id} is missing category or mainMuscle`
            );
            return false;
          }

          return (
              e.category.toLowerCase() ===
              patternExercise.muscleGroup.toLowerCase() &&
              e.mainMuscle.toLowerCase() ===
              patternExercise.mainMuscle.toLowerCase() &&
              !usedExerciseIds.value.has(e._id)
          );
        });

        if (matchingExercises.length === 0) {
          console.warn('Нет доступных упражнений для заданных критериев');
          continue;
        }

        const selectedExercise =
            matchingExercises[
                Math.floor(Math.random() * matchingExercises.length)
                ];
        usedExerciseIds.value.add(selectedExercise._id);
        console.log('Выбранное упражнение:', selectedExercise);

        const repsOptions = getRepsOptions(
            selectedExercise,
            patternExercise.repetitionLevel,
            gender.value,
            patternExercise.additionalColumn
        );

        if (!repsOptions) {
          console.warn(
              `Не удалось получить повторения для упражнения: ${selectedExercise.name}`
          );
          continue;
        }

        const repsArray = repsOptions
            .split(',')
            .map(Number)
            .filter((num) => !isNaN(num));
        if (repsArray.length === 0) {
          console.warn(
              `Нет корректных повторений для упражнения: ${selectedExercise.name}`
          );
          continue;
        }

        const reps = repsArray[Math.floor(Math.random() * repsArray.length)];
        const sets = getSets(reps);

        workout.push({
          _id: selectedExercise._id,
          name: selectedExercise.name,
          sets,
          reps,
        });
      }

      if (workout.length === 0) {
        errorMessages.value.push(
            'Тренировка не сгенерирована. Попробуйте другие параметры.'
        );
      }

      workoutResults.value = workout;
      console.log('Результаты тренировки:', workoutResults.value);

      timer.value = 3;
      intervalId = window.setInterval(() => {
        timer.value--;
        if (timer.value <= 0 && intervalId !== null) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
      }, 1000);

      isGenerating.value = false;

      // Открываем bottom-sheet
      showBottomSheet.value = true;
    };

    const removeExercise = (index: number) => {
      const exercise = workoutResults.value[index];
      if (exercise && exercise._id) {
        usedExerciseIds.value.delete(exercise._id);
      }
      workoutResults.value.splice(index, 1);
    };

    const regenerateExercise = (index: number) => {
      if (!selectedPattern.value) {
        console.warn('Паттерн не выбран.');
        return;
      }

      const patternExercise = selectedPattern.value.exercises[index];

      const previousExercise = workoutResults.value[index];
      if (previousExercise && previousExercise._id) {
        usedExerciseIds.value.delete(previousExercise._id);
      }

      const matchingExercises = exercises.value.filter((e) => {
        if (!e.category || !e.mainMuscle) {
          console.warn(
              `Exercise ${e._id} is missing category or `
          );
          return false;
        }

        return (
            e.category.toLowerCase() ===
            patternExercise.muscleGroup.toLowerCase() &&
            e.mainMuscle.toLowerCase() ===
            patternExercise.mainMuscle.toLowerCase() &&
            !usedExerciseIds.value.has(e._id)
        );
      });

      if (matchingExercises.length === 0) {
        console.warn('Нет доступных упражнений для заданных критериев');
        return;
      }

      const selectedExercise =
          matchingExercises[
              Math.floor(Math.random() * matchingExercises.length)
              ];
      usedExerciseIds.value.add(selectedExercise._id);

      // Сохраняем предыдущие значения повторений и подходов
      const reps = previousExercise.reps;
      const sets = previousExercise.sets;

      workoutResults.value[index] = {
        _id: selectedExercise._id,
        name: selectedExercise.name,
        sets,
        reps,
      };
    };

    // Метод для отправки тренировки через Telegram
    const sendWorkout = async () => {
      if (!telegramUserId.value || !workoutResults.value.length) {
        errorMessages.value.push(
            'Не указан Telegram ID или отсутствуют результаты тренировки.'
        );
        return;
      }

      try {
        // Преобразуем реактивный массив в обычный
        const workoutData = JSON.parse(
            JSON.stringify(workoutResults.value)
        );

        console.log('Данные для отправки:', workoutData);

        const data = await apiRequest('post', 'send-workout', {
          userId: telegramUserId.value,
          workout: workoutData,
        });
        console.log('Ответ сервера:', data);
        alert('Тренировка успешно отправлена!');
      } catch (error) {
        console.error('Ошибка при отправке тренировки:', error);
        errorMessages.value.push(
            'Не удалось отправить тренировку. Попробуйте позже.'
        );
      }
    };

    // Методы выбора опций
    const selectGender = (option: string) => {
      gender.value = option;
      muscleGroup.value = '';
      muscleSubgroup.value = '';
      populateMuscleGroups();
      populateMuscleSubgroups();
      populateComplexes();
    };

    const selectMuscleGroup = (option: string) => {
      muscleGroup.value = option;
      muscleSubgroup.value = '';
      populateMuscleSubgroups();
      populateComplexes();
    };

    const selectMuscleSubgroup = (option: string) => {
      muscleSubgroup.value = option;
      populateComplexes();
    };

    // При монтировании компонента
    onMounted(async () => {
      await loadExercises();
      await loadPatterns();
      populateMuscleGroups();
      populateMuscleSubgroups();
      populateComplexes();

      // Инициализация данных пользователя из Telegram
      if (process.client) {
        const launchParams = retrieveLaunchParams();
        initData.value = launchParams.initData;
        console.log('initData:', initData.value);

        if (initData.value && initData.value.user) {
          userData.value = initData.value.user;
          telegramUserId.value = userData.value.id || null;
          console.log('userData in Component:', userData.value);
          console.log('telegramUserId Component', telegramUserId.value);
        } else {
          console.error(
              'Не удалось получить данные пользователя. Убедитесь, что приложение запущено внутри Telegram.'
          );
          errorMessages.value.push(
              'Не удалось получить данные пользователя. Убедитесь, что приложение запущено внутри Telegram.'
          );
        }
      }
    });

    return {
      gender,
      muscleGroup,
      muscleSubgroup,
      genders,
      muscleGroups,
      muscleSubgroups,
      complexes,
      workoutResults,
      telegramUserId,
      initData,
      generateWorkout,
      sendWorkout,
      selectGender,
      selectMuscleGroup,
      selectMuscleSubgroup,
      isGenerating,
      timer,
      errorMessages,
      showBottomSheet,
      regenerateExercise,
      increaseReps,
      decreaseReps,
      removeExercise,
      onDragStart,
      onDragEnd,
    };
  },
});
</script>

<style scoped>
/* Общие стили для кнопок */
.group-button {
  min-width: 100px;
}

.selected-button {
  background-color: var(--v-primary-base);
  color: white;
}

/* Стили для сообщений об ошибках */
.v-alert {
  max-width: 600px;
  margin: 0 auto;
}

/* Стили для заголовков упражнений */
.exercise-title {
  font-weight: bold;
}

/* Стили для подзаголовков упражнений */
.exercise-subtitle {
  font-size: 0.9em;
  color: gray;
}

/* Стили для кнопки отправки */
.send-btn {
  width: 100%;
}

/* Стили для кнопки генерации */
.generate-btn {
  width: 100%;
}

/* Стили для скругления v-bottom-sheet */
.rounded-bottom-sheet {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden; /* Обеспечивает, что содержимое не выходит за границы скруглённых углов */
}

/* Стили для фиксированных столбцов */
.sets-reps-column {
  width: 80px; /* Задайте желаемую ширину */
  text-align: right;
}

.action-column {
  width: 50px; /* Задайте желаемую ширину */
  text-align: right;
}

/* Дополнительные стили для таблицы */
.v-simple-table th.fixed-width,
.v-simple-table td.fixed-width {
  padding-right: 16px; /* Отступ для выравнивания */
}

.dragging {
  opacity: 0.5;
}

/* Стили для контейнера с подходами и повторениями */
.sets-reps-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Стили для кнопок увеличения и уменьшения */
.sets-reps-container .v-btn {
  min-width: 24px;
  width: 24px;
  height: 24px;
  margin: 0 4px;
}

/* Стили для текста между кнопками */
.sets-reps-container span {
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

/* Добавьте эти стили в ваш блок стилей */
.action-column .v-btn {
  min-width: 36px;
  width: 36px;
  height: 36px;
  margin: 0 2px;
}

</style>
