<template>
  <v-container class="py-1">
    <v-form @submit.prevent="generateWorkout" elevation="2">

      <!-- Выбор пола -->
      <v-card class="mb-1" outlined dark >
        <v-card-text>
          <v-slide-group v-model="gender" mandatory>
            <v-slide-group-item
                v-for="option in genders"
                :key="option"
                :value="option"
                class="ml-4"
            >
              <v-btn
                  class="pa-1 mx-auto"
                  outlined
                  :color="gender === option ? 'primary' : 'grey lighten-1'"
                  variant="text"
                  @click="selectGender(option)"

              >
                {{ option }}
              </v-btn>
            </v-slide-group-item>
          </v-slide-group>
        </v-card-text>
      </v-card>

      <!-- Выбор мышечной группы -->
      <v-card class="mb-1" outlined dark>
        <v-card-text>
          <v-slide-group v-model="muscleGroup" mandatory show-arrows>
            <v-slide-group-item
                v-for="option in muscleGroups"
                :key="option"
                :value="option"
            >
              <v-btn
                  class="group-button pa-0"
                  outlined
                  :color="muscleGroup === option ? 'primary' : 'grey lighten-1'"
                  variant="text"
                  @click="selectMuscleGroup(option)"
              >
                {{ option }}
              </v-btn>
            </v-slide-group-item>
          </v-slide-group>
        </v-card-text>
      </v-card>

      <!-- Выбор мышечной подгруппы -->
      <v-card class="mb-1" outlined dark>
        <v-card-text>
          <v-slide-group v-model="muscleSubgroup" mandatory show-arrows>
            <v-slide-group-item
                v-for="option in muscleSubgroups"
                :key="option"
                :value="option"
            >
              <v-btn
                  class="subgroup-button mx-1 pa-1"
                  outlined
                  :color="muscleSubgroup === option ? 'primary' : 'grey lighten-1'"
                  variant="text"
                  @click="selectMuscleSubgroup(option)"
              >
                {{ option }}
              </v-btn>
            </v-slide-group-item>
          </v-slide-group>
        </v-card-text>
      </v-card>

      <!-- Кнопка для генерации тренировки -->
      <div class="text-center mb-6">
        <v-btn color="success" large type="submit" class="generate-btn">
          <v-icon left>mdi-dumbbell</v-icon>
           Сгенерировать
        </v-btn>
      </div>

      <!-- Отображение результатов тренировки -->
        <v-card v-if="workoutResults.length" class="mb-6" outlined dark>
          <v-card-text>
            <v-list style="border-radius: 10px">
              <v-list-item v-for="(exercise, index) in workoutResults" :key="index">
                <v-list-item-content>
                  <v-list-item-title class="exercise-title">{{ exercise.name }}</v-list-item-title>
                  <v-list-item-subtitle class="exercise-subtitle">{{ exercise.sets }} сета × {{ exercise.reps }} повторений</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
          <div class="text-center mt-4">
            <v-btn color="primary" @click="sendWorkout" :disabled="!telegramUserId" class="send-btn">
              <v-icon left>mdi-send</v-icon>
              Отправить себе
            </v-btn>
          </div>

        </v-card>

    </v-form>
  </v-container>
</template>




<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import axios from 'axios';

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
  mainMuscles: string;
  additionalMuscles: string;
  difficultyLevel: string;
  name: string;
  equipment: string;
}

interface PatternExercise {
  exerciseLevel: string;
  repetitionLevel: string;
  additionalColumn: string;
}

interface Pattern {
  _id: string;
  gender: string;
  muscleGroup: string;
  mainMuscle: string;
  complexNumber: string;
  exercises: PatternExercise[];
}

interface WorkoutResult {
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
  name: 'WorkoutGenerator',
  setup() {
    // Переменные для данных пользователя и initData
    const userData = ref<TelegramUserData | null>(null);
    const telegramUserId = ref<number | null>(null);
    const initData = ref<any>(null);

    if (process.client) {
      onMounted(() => {
        // Получаем initData через retrieveLaunchParams из Telegram SDK
        const launchParams = retrieveLaunchParams();
        initData.value = launchParams.initData;
        console.log('initData:', initData.value);

        if (initData.value && initData.value.user) {
          // Инициализация данных пользователя из initData
          userData.value = initData.value.user;
          telegramUserId.value = userData.value.id || null;
          console.log('userData in Component:', userData.value);
          console.log('telegramUserId Component', telegramUserId.value);
        } else {
          console.error('Не удалось получить данные пользователя. Убедитесь, что приложение запущено внутри Telegram.');
        }
      });
    }

    const gender = ref<string | null>(null);
    const muscleGroup = ref<string | null>(null);
    const muscleSubgroup = ref<string | null>(null);
    const complexNumber = ref<string | null>(null);

    const genders = ['Мужчина', 'Женщина'];
    const muscleGroups = ref<string[]>([]);
    const muscleSubgroups = ref<string[]>([]);
    const complexes = ref<string[]>([]);
    const workoutResults = ref<WorkoutResult[]>([]);

    const exercises = ref<Exercise[]>([]);
    const patterns = ref<Pattern[]>([]);

    // Методы загрузки данных
    const loadExercises = async () => {
      try {
        const response = await axios.get<Exercise[]>('http://localhost:3002/api/exercises');
        exercises.value = response.data;
        console.log('Упражнения загружены:', exercises.value);
      } catch (error: any) {
        console.error('Ошибка при загрузке упражнений:', error.message);
      }
    };

    const loadPatterns = async () => {
      try {
        const response = await axios.get<Pattern[]>('http://localhost:3002/api/patterns');
        patterns.value = response.data;
        console.log('Загруженные паттерны:', patterns.value);
      } catch (error: any) {
        console.error('Ошибка при загрузке паттернов:', error.message);
      }
    };

    const populateMuscleGroups = () => {
      const groups = new Set(exercises.value.map((e) => e.category.trim().toLowerCase()));
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
              .filter((e) => e.category.trim().toLowerCase() === selectedMuscleGroupLower)
              .map((e) => e.subcategory.trim().toLowerCase())
      );
      muscleSubgroups.value = Array.from(subgroups).map((subgroup) => capitalize(subgroup));
    };

    const populateComplexes = () => {
      if (!muscleSubgroup.value || !gender.value) {
        complexes.value = [];
        return;
      }

      // Отладочный вывод значений перед фильтрацией
      console.log('Gender:', gender.value);
      console.log('Muscle Group:', muscleGroup.value);
      console.log('Muscle Subgroup:', muscleSubgroup.value);

      const selectedGenderLower = gender.value.trim().toLowerCase();
      const selectedMuscleSubgroupLower = muscleSubgroup.value.trim().toLowerCase();

      // Фильтрация паттернов по gender и complexNumber, совпадающему с mainMuscles упражнений
      const availableComplexes = patterns.value.filter(
          (p) =>
              p.gender.trim().toLowerCase() === selectedGenderLower &&
              p.complexNumber.trim().toLowerCase() === selectedMuscleSubgroupLower
      );

      // Присваиваем complexNumber
      complexes.value = availableComplexes.map((p) => p.complexNumber);
      console.log('Доступные комплексы после фильтрации:', complexes.value);
    };

    const capitalize = (str: string): string => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const levelMapping: { [key: string]: string } = {
      'легкая': 'Light',
      'средняя': 'Medium',
      'тяжелая': 'Heavy',
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
      const repsKey = `${gender === 'Мужчина' ? 'male' : 'female'}Reps${capitalize(mappedLevel)}` as keyof RepetitionLevels;
      return exercise[repsKey] || null;
    };

    const getSets = (reps: number): number => {
      if (reps >= 15) return 3;
      if (reps >= 6) return 4;
      return 3;
    };

    const generateWorkout = () => {
      if (!gender.value || !muscleGroup.value || !muscleSubgroup.value) {
        console.error('Необходимо указать все параметры для генерации тренировки');
        return;
      }

      // Присваиваем значения локальным константам после проверки
      const selectedGender = gender.value.trim();
      const selectedMuscleGroup = muscleGroup.value.trim();
      const selectedMuscleSubgroup = muscleSubgroup.value.trim();

      const formattedGender = selectedGender.toLowerCase();

      // Фильтрация паттернов по gender и complexNumber
      const filteredPatterns = patterns.value.filter(
          (p) =>
              p.gender.trim().toLowerCase() === formattedGender &&
              p.complexNumber.trim().toLowerCase() === selectedMuscleSubgroup.toLowerCase()
      );

      // Проверяем, есть ли подходящие паттерны
      if (filteredPatterns.length === 0) {
        console.error('Подходящий паттерн не найден');
        return;
      }

      // Выбираем случайный паттерн из доступных
      const selectedPattern = filteredPatterns[Math.floor(Math.random() * filteredPatterns.length)];
      console.log('++ selectedPattern', selectedPattern);

      const workout: WorkoutResult[] = [];
      const usedExerciseIds = new Set<string>();
      console.log('++ usedExerciseIds', usedExerciseIds);

      // Обрабатываем упражнения из паттерна
      for (const patternExercise of selectedPattern.exercises) {
        // Ищем упражнения по уровню сложности и подгруппе мышц
        const matchingExercises = exercises.value.filter(
            (e) =>
                e.subcategory.toLowerCase() === selectedMuscleSubgroup.toLowerCase() &&
                e.difficultyLevel.toLowerCase() === patternExercise.repetitionLevel.toLowerCase() &&
                !usedExerciseIds.has(e._id)
        );

        if (matchingExercises.length === 0) {
          console.warn('Нет доступных упражнений для заданных критериев');
          continue;
        }

        // Выбираем случайное упражнение из доступных
        const selectedExercise = matchingExercises[Math.floor(Math.random() * matchingExercises.length)];
        usedExerciseIds.add(selectedExercise._id);
        console.log('Выбранное упражнение:', selectedExercise);

        // Используем additionalColumn для определения уровня нагрузки (легкая, средняя, тяжелая)
        const repsOptions = getRepsOptions(
            selectedExercise,
            patternExercise.repetitionLevel,
            selectedGender,
            patternExercise.additionalColumn
        );

        if (!repsOptions) {
          console.warn(`Не удалось получить репы для упражнения: ${selectedExercise.name}`);
          continue;
        }

        const repsArray = repsOptions.split(',').map(Number).filter((num) => !isNaN(num));
        if (repsArray.length === 0) {
          console.warn(`Нет корректных репов для упражнения: ${selectedExercise.name}`);
          continue;
        }

        const reps = repsArray[Math.floor(Math.random() * repsArray.length)];
        const sets = getSets(reps);

        // Добавляем упражнение в тренировку
        workout.push({
          name: selectedExercise.name,
          sets,
          reps,
        });
      }

      if (workout.length === 0) {
        console.warn('Тренировка не сгенерирована. Попробуйте другие параметры.');
      }

      workoutResults.value = workout;
      console.log('Результаты тренировки:', workoutResults.value);
    };

    // Метод для отправки тренировки через Telegram
    const sendWorkout = async () => {
      if (!telegramUserId.value || !workoutResults.value.length) {
        console.error('Не указан telegramUserId или отсутствуют результаты тренировки');
        return;
      }

      try {
        const response = await axios.post('http://localhost:3002/api/send-workout', {
          userId: telegramUserId.value,
          workout: workoutResults.value,
        });
        console.log('Ответ сервера:', response.data);
      } catch (error: any) {
        console.error('Ошибка при отправке тренировки:', error.message);
      }
    };

    // Методы выбора опций
    const selectGender = (option: string) => {
      gender.value = option;
      muscleGroup.value = null;
      muscleSubgroup.value = null;
      populateMuscleGroups();
      populateMuscleSubgroups();
      populateComplexes();
    };

    const selectMuscleGroup = (option: string) => {
      muscleGroup.value = option;
      muscleSubgroup.value = null;
      populateMuscleSubgroups();
      populateComplexes();
    };

    const selectMuscleSubgroup = (option: string) => {
      muscleSubgroup.value = option;
      populateComplexes();
    };

    // Наблюдатели (необходимы только если используем select methods)
    /*
    watch(muscleGroup, () => {
      muscleSubgroup.value = null;
      complexNumber.value = null;
      populateMuscleSubgroups();
    });

    watch(muscleSubgroup, () => {
      complexNumber.value = null;
      populateComplexes();
    });

    watch(gender, () => {
      complexNumber.value = null;
      populateComplexes();
    });
    */

    // При монтировании компонента
    onMounted(async () => {
      await loadExercises();
      await loadPatterns();
      populateMuscleGroups();
      populateMuscleSubgroups();
      populateComplexes();

      // Установка значений по умолчанию, если они еще не установлены
      if (genders.length > 0 && !gender.value) {
        gender.value = genders[0];
      }
      if (muscleGroups.value.length > 0 && !muscleGroup.value) {
        muscleGroup.value = muscleGroups.value[0];
      }
      if (muscleSubgroups.value.length > 0 && !muscleSubgroup.value) {
        muscleSubgroup.value = muscleSubgroups.value[0];
      }
    });

    return {
      gender,
      muscleGroup,
      muscleSubgroup,
      complexNumber,
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
    };
  },
});
</script>


<style scoped>
.v-container {
  max-width: 800px;
  margin: 0 auto;
  background-color: #121212; /* Тёмный фон контейнера */
  padding: 5px;
  border-radius: 10px;
}

.v-form {
  background-color: #1e1e1e; /* Тёмный фон формы */
  border-radius: 10px;
  padding: 12px;
}

.headline {
  font-weight: bold;
  font-size: 20px;
  color: #ffffff; /* Светлый текст заголовков */
}

.slide-group-item {
  min-width: 120px;
  text-transform: none;
  color: #ffffff; /* Светлый текст */
  background-color: rgba(255, 255, 255, 0.1); /* Фон элементов */
  border-radius: 10px;
  padding: 10px 20px;
  margin: 0 4px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s;
}

.slide-group-item.active {
  background-color: #43A047FF; /* Цвет активного элемента */
  transform: scale(1.05);
}

.slide-group-item:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.v-card {
  background-color: #1e1e1e; /* Тёмный фон карточек */
  border-color: rgba(255, 255, 255, 0.1); /* Светлая граница карточек */
}

.generate-btn {
  background-color: #43a047; /* Цвет кнопки генерации */
  color: #ffffff;
  margin: 10px;
}

.generate-btn:hover {
  background-color: #388e3c;
}

.send-btn {
  background-color: #2196f3; /* Цвет кнопки отправки */
  color: #ffffff;
}

.send-btn:hover {
  background-color: #1976d2;
}

.v-btn {
  transition: background-color 0.3s, color 0.3s;
}

.v-list {
  border-color: #ffffff;
  border-width: 1px;
}

.v-list-item-title {
  color: #ffffff; /* Светлый текст названий упражнений */
}

.v-list-item-subtitle {
  color: #b0bec5; /* Светло-серый текст описаний */
}

.v-slide-group {
  background-color: #333333; /* Тёмный фон для слайд-группы */
  border-radius: 8px;
  padding: 8px;
}

@media (max-width: 800px) {
  .slide-group-item {
    min-width: 60px;
    padding: 6px 12px;
  }

  .headline {
    font-size: 18px;
  }
}

</style>
