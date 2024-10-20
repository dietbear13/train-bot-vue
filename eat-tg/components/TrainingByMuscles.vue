<template>
  <v-container>
    <v-form @submit.prevent="generateWorkout">
      <!-- Выбор пола -->
      <v-select v-model="gender" :items="genders" label="Пол" required></v-select>

      <!-- Выбор мышечной группы -->
      <v-select
          v-model="muscleGroup"
          :items="muscleGroups"
          label="Мышечная группа"
          required
      ></v-select>

      <!-- Выбор мышечной подгруппы -->
      <v-select
          v-model="muscleSubgroup"
          :items="muscleSubgroups"
          label="Мышечная подгруппа"
          required
          :disabled="!muscleGroup"
      ></v-select>

      <!-- Отображение результатов тренировки -->
      <div v-if="workoutResults.length">
        <h2>Результаты тренировки:</h2>
        <div v-for="(exercise, index) in workoutResults" :key="index">
          {{ exercise.name }} — {{ exercise.sets }}×{{ exercise.reps }}
        </div>
        <!-- Кнопка для отправки тренировки -->
        <v-btn @click="sendWorkout" :disabled="!workoutResults.length || !telegramUserId">
          Отправить сообщением
        </v-btn>
      </div>


      <!-- Кнопка для генерации тренировки -->
      <v-btn type="submit">Сгенерировать тренировку</v-btn>
    </v-form>

  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue'
import axios from 'axios'

// Интерфейсы
interface Exercise {
  _id: string
  category: string
  subcategory: string
  mainMuscles: string
  additionalMuscles: string
  difficultyLevel: string
  name: string
  equipment: string
  maleRepsLight: string
  maleRepsMedium: string
  maleRepsHeavy: string
  femaleRepsLight: string
  femaleRepsMedium: string
  femaleRepsHeavy: string
}

interface PatternExercise {
  exerciseLevel: string
  repetitionLevel: string
}

interface Pattern {
  _id: string
  gender: string
  muscleGroup: string
  mainMuscle: string
  complexNumber: string
  exercises: PatternExercise[]
}

interface WorkoutResult {
  name: string
  sets: number
  reps: number
}

interface TelegramUserData {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
}

interface RepetitionLevels {
  maleRepsLight: string
  maleRepsMedium: string
  maleRepsHeavy: string
  femaleRepsLight: string
  femaleRepsMedium: string
  femaleRepsHeavy: string
}

import { retrieveLaunchParams  } from '@telegram-apps/sdk';
const { initData } = retrieveLaunchParams();

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
          console.log('telegramUserId Component', telegramUserId)
        } else {
          console.error('Не удалось получить данные пользователя. Убедитесь, что приложение запущено внутри Telegram.');
        }
      });
    }

    const gender = ref<string | null>(null)
    const muscleGroup = ref<string | null>(null)
    const muscleSubgroup = ref<string | null>(null)
    const complexNumber = ref<string | null>(null)

    const genders = ['Мужчина', 'Женщина']
    const muscleGroups = ref<string[]>([])
    const muscleSubgroups = ref<string[]>([])
    const complexes = ref<string[]>([])
    const workoutResults = ref<WorkoutResult[]>([])

    const exercises = ref<Exercise[]>([])
    const patterns = ref<Pattern[]>([])

    // Методы
    const loadExercises = async () => {
      try {
        const response = await axios.get<Exercise[]>('http://localhost:3002/api/exercises')
        exercises.value = response.data
      } catch (error: any) {
        console.error('Ошибка при загрузке упражнений:', error.message)
      }
    }

    const loadPatterns = async () => {
      try {
        const response = await axios.get<Pattern[]>('http://localhost:3002/api/patterns');
        patterns.value = response.data;

        // Отладочный вывод загруженных паттернов
        console.log('Загруженные паттерны:', patterns.value);
      } catch (error: any) {
        console.error('Ошибка при загрузке паттернов:', error.message);
      }
    };

    const populateMuscleGroups = () => {
      const groups = new Set(exercises.value.map((e) => e.category))
      muscleGroups.value = Array.from(groups)
    }

    const populateMuscleSubgroups = () => {
      if (!muscleGroup.value) {
        muscleSubgroups.value = []
        return
      }
      const subgroups = new Set(
          exercises.value.filter((e) => e.category === muscleGroup.value).map((e) => e.subcategory)
      )
      muscleSubgroups.value = Array.from(subgroups)
    }


    const populateComplexes = () => {
      if (!muscleSubgroup.value || !gender.value) {
        complexes.value = [];
        return;
      }

      // Отладочный вывод значений перед фильтрацией
      console.log('Gender:', gender.value);
      console.log('Muscle Group:', muscleGroup.value);
      console.log('Muscle Subgroup:', muscleSubgroup.value);

      const availableComplexes = patterns.value.filter(
          (p) =>
              p.gender === gender.value &&
              p.muscleGroup === muscleGroup.value &&
              p.mainMuscle === muscleSubgroup.value
      );

      // Проверяем, есть ли complexNumber у паттернов
      availableComplexes.forEach((pattern) => {
        console.log('Паттерн:', pattern);
        console.log('complexNumber у паттерна:', pattern.complexNumber);
      });

      // Проверяем, чтобы complexNumber не был undefined
      complexes.value = availableComplexes.map((p) => p.complexNumber);
      console.log('Доступные комплексы после фильтрации:', complexes.value);
    };


    const capitalize = (str: string): string => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const levelMapping: { [key: string]: string } = {
      'легкая': 'Light',
      'средняя': 'Medium',
      'тяжелая': 'Heavy',
    };

    const getRepsOptions = (exercise: Exercise, repetitionLevel: string, gender: string): string => {
      // Преобразуем русское значение уровня сложности в английское
      const mappedLevel = levelMapping[repetitionLevel.toLowerCase()] || repetitionLevel;
      const repsKey = `${gender === 'Мужчина' ? 'male' : 'female'}Reps${capitalize(mappedLevel)}` as keyof RepetitionLevels;

      console.log('+!! repsKey', repsKey);

      return (exercise as RepetitionLevels)[repsKey];
    };

    const getSets = (reps: number): number => {
      if (reps >= 15) return 3
      if (reps >= 6) return 4
      return 3
    }

    const generateWorkout = () => {
      if (!gender.value || !muscleGroup.value || !muscleSubgroup.value) {
        console.error('Необходимо указать все параметры для генерации тренировки');
        return;
      }

      // Фильтруем паттерны на основе выбранного пола, мышечной группы и подгруппы
      const filteredPatterns = patterns.value.filter(
          (p) =>
              p.gender === gender.value &&
              p.muscleGroup === muscleGroup.value &&
              p.mainMuscle === muscleSubgroup.value
      );

      // Проверяем, есть ли подходящие паттерны
      if (filteredPatterns.length === 0) {
        console.error('Подходящий паттерн не найден');
        return;
      }

      // Выбираем случайный паттерн из доступных
      const selectedPattern = filteredPatterns[Math.floor(Math.random() * filteredPatterns.length)];

      // Выводим содержимое поля `exercises` для отладки
      console.log('Выбранный паттерн:', selectedPattern);
      console.log('Exercises из паттерна:', selectedPattern.exercises);

      const workout: WorkoutResult[] = [];
      const usedExerciseIds = new Set<string>();

      // Обрабатываем упражнения из паттерна
      for (const patternExercise of selectedPattern.exercises) {
        // Ищем упражнения по уровню сложности и подгруппе мышц
        const matchingExercises = exercises.value.filter(
            (e) =>
                e.subcategory === muscleSubgroup.value &&
                e.difficultyLevel === patternExercise.exerciseLevel &&
                !usedExerciseIds.has(e._id) // Убедиться, что упражнение не было уже использовано
        );

        console.log('+ Подбор упражнений по паттерну matchingExercises', matchingExercises)

        if (matchingExercises.length === 0) {
          console.warn('Нет доступных упражнений для заданных критериев');
          continue;
        }

        // Выбираем случайное упражнение из доступных
        const selectedExercise = matchingExercises[Math.floor(Math.random() * matchingExercises.length)];
        usedExerciseIds.add(selectedExercise._id);

        console.log('+1 selectedExercise', selectedExercise)

        // Определяем количество повторений в зависимости от пола и уровня повторений
        const repsOptions = getRepsOptions(selectedExercise, patternExercise.repetitionLevel, gender.value);
        console.log('++1 repsOptions', repsOptions)
        const repsArray = repsOptions.split(',').map(Number);
        console.log('++1 repsArray', repsArray)
        const reps = repsArray[Math.floor(Math.random() * repsArray.length)];
        console.log('++1 reps', reps)
        const sets = getSets(reps);
        console.log('++1 sets', sets)

        console.log('+1 repsOptions', repsOptions)

        // Добавляем упражнение в тренировку
        workout.push({
          name: selectedExercise.name,
          sets,
          reps,
        });
      }

      workoutResults.value = workout;
    };

    // Метод для отправки тренировки через Telegram
    const sendWorkout = async () => {
      if (!telegramUserId.value || !workoutResults.value.length) {
        console.error('Не указан telegramUserId или отсутствуют результаты тренировки')
        return
      }

      try {
        const response = await axios.post('http://localhost:3002/api/send-workout', {
          userId: telegramUserId.value,
          workout: workoutResults.value,
        })
        console.log('Ответ сервера:', response.data)
      } catch (error: any) {
        console.error('Ошибка при отправке тренировки:', error.message)
      }
    }

    // Наблюдатели
    watch(muscleGroup, () => {
      muscleSubgroup.value = null
      complexNumber.value = null
      populateMuscleSubgroups()
    })

    watch(muscleSubgroup, () => {
      complexNumber.value = null
      populateComplexes()
    })

    watch(gender, () => {
      complexNumber.value = null
      populateComplexes()
    })

    // При монтировании компонента
    onMounted(async () => {
      await loadExercises()
      await loadPatterns()
      populateMuscleGroups()
    })

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
      sendWorkout
    }
  },
})
</script>

<style scoped>
.v-container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
