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

      <!-- Выбор комплекса -->
      <v-select
          v-model="complexNumber"
          :items="complexes"
          label="Комплекс"
          required
          :disabled="!muscleSubgroup"
      ></v-select>

      <!-- Кнопка для генерации тренировки -->
      <v-btn type="submit">Сгенерировать тренировку</v-btn>
    </v-form>

    <!-- Отображение результатов тренировки -->
    <div v-if="workoutResults.length">
      <h2>Результаты тренировки:</h2>
      <div v-for="(exercise, index) in workoutResults" :key="index">
        {{ exercise.name }} — {{ exercise.sets }}×{{ exercise.reps }}
      </div>
      <!-- Кнопка для отправки тренировки -->
      <v-btn @click="sendWorkout" :disabled="!workoutResults.length || !telegramUserId">
        Отправить тренировку
      </v-btn>
    </div>

    <!-- Для отладки: выводим initData и telegramUserId -->
    <div>
      <h3>Данные для отладки:</h3>
      <p><strong>initData:</strong> {{ initData }}</p>
      <p><strong>telegramUserId:</strong> {{ telegramUserId }}</p>
    </div>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, inject, ref, onMounted, watch } from 'vue'
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
  complexNumber: number
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

export default defineComponent({
  name: 'WorkoutGenerator',
  setup() {
    // Получаем данные пользователя из provide
    const userData = ref<TelegramUserData | null>(null)
    const telegramUserId = ref<number | null>(null)
    const initData = ref<any>(null)

    if (process.client) {
      onMounted(() => {
        const injectedUserData = inject<any>('userData')
        console.log('injectedUserData Component', injectedUserData)

        if (injectedUserData && injectedUserData.value) {
          initData.value = injectedUserData.value
          if (injectedUserData.value.user) {
            userData.value = injectedUserData.value.user
            telegramUserId.value = userData.value.id || null
          }
          console.log('initData:', initData.value)
          console.log('userData in Component:', userData.value)
        } else {
          console.error(
              'Не удалось получить данные пользователя. Убедитесь, что приложение запущено внутри Telegram.'
          )
        }
      })
    }

    // Определяем реактивные данные
    const gender = ref<string | null>(null)
    const muscleGroup = ref<string | null>(null)
    const muscleSubgroup = ref<string | null>(null)
    const complexNumber = ref<number | null>(null)

    const genders = ['Мужчина', 'Женщина']
    const muscleGroups = ref<string[]>([])
    const muscleSubgroups = ref<string[]>([])
    const complexes = ref<number[]>([])

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
        const response = await axios.get<Pattern[]>('http://localhost:3002/api/patterns')
        patterns.value = response.data
      } catch (error: any) {
        console.error('Ошибка при загрузке паттернов:', error.message)
      }
    }

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
        complexes.value = []
        return
      }
      const availableComplexes = new Set(
          patterns.value
              .filter(
                  (p) =>
                      p.gender === gender.value &&
                      p.muscleGroup === muscleGroup.value &&
                      p.mainMuscle === muscleSubgroup.value
              )
              .map((p) => p.complexNumber)
      )
      complexes.value = Array.from(availableComplexes)
    }

    const getSets = (reps: number): number => {
      if (reps >= 15) return 3
      if (reps >= 6) return 4
      return 3
    }

    const generateWorkout = () => {
      if (!gender.value || !muscleGroup.value || !muscleSubgroup.value || !complexNumber.value) {
        return
      }

      const selectedPattern = patterns.value.find(
          (p) =>
              p.gender === gender.value &&
              p.muscleGroup === muscleGroup.value &&
              p.mainMuscle === muscleSubgroup.value &&
              p.complexNumber === complexNumber.value
      )

      if (!selectedPattern) {
        console.error('Паттерн не найден')
        return
      }

      const workout: WorkoutResult[] = []
      const usedExerciseIds = new Set<string>()

      for (const patternExercise of selectedPattern.exercises) {
        const matchingExercises = exercises.value.filter(
            (e) =>
                e.subcategory === muscleSubgroup.value &&
                e.difficultyLevel === patternExercise.exerciseLevel &&
                !usedExerciseIds.has(e._id)
        )

        if (matchingExercises.length === 0) {
          console.warn('Нет доступных упражнений для заданных критериев')
          continue
        }

        const selectedExercise =
            matchingExercises[Math.floor(Math.random() * matchingExercises.length)]

        usedExerciseIds.add(selectedExercise._id)

        let repsOptions = ''
        if (gender.value === 'Мужчина') {
          if (patternExercise.repetitionLevel === 'легкая') {
            repsOptions = selectedExercise.maleRepsLight
          } else if (patternExercise.repetitionLevel === 'средняя') {
            repsOptions = selectedExercise.maleRepsMedium
          } else {
            repsOptions = selectedExercise.maleRepsHeavy
          }
        } else {
          if (patternExercise.repetitionLevel === 'легкая') {
            repsOptions = selectedExercise.femaleRepsLight
          } else if (patternExercise.repetitionLevel === 'средняя') {
            repsOptions = selectedExercise.femaleRepsMedium
          } else {
            repsOptions = selectedExercise.femaleRepsHeavy
          }
        }

        const repsArray = repsOptions.split(',').map(Number)
        const reps = repsArray[Math.floor(Math.random() * repsArray.length)]
        const sets = getSets(reps)

        workout.push({
          name: selectedExercise.name,
          sets,
          reps,
        })
      }

      workoutResults.value = workout
    }

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
      sendWorkout,
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
