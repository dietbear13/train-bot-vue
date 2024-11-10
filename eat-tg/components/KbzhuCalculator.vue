<!-- components/KbzhuCalculator.vue -->
<template>
  <div class="kbzhu-calculator">
    <p>Все вводимые в калькулятор данные не сохраняются и не используются.</p>

    <!-- Выбор пола -->
    <v-card class="mb-4">
      <v-card-text>
        <v-slide-group
            v-model="formData.gender"
            show-arrows
            class="flex-nowrap"
            center-active
            mandatory
        >
          <v-slide-group-item
              v-for="gender in genders"
              :key="gender.value"
              :value="gender.value"
          >
            <v-btn
                variant="text"
                :value="gender.value"
                class="ma-2"
                :class="{ 'selected-button': formData.gender === gender.value }"
                @click="selectGender(gender.value)"
            >
              {{ gender.text }}
            </v-btn>
          </v-slide-group-item>
        </v-slide-group>
      </v-card-text>
    </v-card>

    <!-- Выбор телосложения -->
    <v-card class="mb-4">
      <v-card-text>
        <v-slide-group
            v-model="formData.bodyType"
            show-arrows
            class="flex-nowrap"
            center-active
            mandatory
        >
          <v-slide-group-item v-for="bodyType in bodyTypes" :key="bodyType.value" :value="bodyType.value">
            <v-btn
                variant="text"
                :value="bodyType.value"
                class="ma-2"
                :class="{ 'selected-button': formData.bodyType === bodyType.value }"
                @click="selectBodyType(bodyType.value)"
            >
              {{ bodyType.text }}
            </v-btn>
          </v-slide-group-item>
        </v-slide-group>
      </v-card-text>
    </v-card>

    <!-- Ввод роста -->
    <v-text-field
        v-model="formData.height"
        label="Рост (см)"
        type="number"
        :min="150"
        :max="197"
        required
        variant="solo-filled"
        class="mb-4"
    ></v-text-field>

    <!-- Ввод веса -->
    <v-text-field
        v-model="formData.weight"
        label="Вес (кг)"
        type="number"
        :min="40"
        :max="139"
        required
        variant="solo-filled"
        class="mb-4"
    ></v-text-field>


    <!-- Ввод цели питания -->
    <v-card class="mb-4">
      <v-card-text>
        <v-slide-group
            v-model="formData.goal"
            show-arrows
            class="flex-nowrap"
            center-active
            mandatory
        >
          <v-slide-group-item v-for="goal in goals" :key="goal.value" :value="goal.value">
            <v-btn
                variant="text"
                :value="goal.value"
                class="ma-2"
                :class="{ 'selected-button': formData.goal === goal.value }"
                @click="selectGoal(goal.value)"
            >
              {{ goal.text }}
            </v-btn>
          </v-slide-group-item>
        </v-slide-group>
      </v-card-text>
    </v-card>

    <!-- Ввод числа тренировок в неделю -->
    <v-text-field
        v-model="formData.workoutsPerWeek"
        label="Число тренировок в неделю (0-10)"
        type="number"
        :min="0"
        :max="10"
        required
        variant="solo-filled"
        class="mb-4"
    ></v-text-field>

    <!-- Кнопка расчёта -->
    <v-btn
        :disabled="isCalculating || timer > 0"
        @click="calculateKbzhu"
        color="primary"
        class="mt-4"
    >
      {{ timer > 0 ? `Повторный расчёт через ${timer} с` : 'Рассчитать' }}
    </v-btn>

    <!-- Сообщение об ошибке -->
    <v-alert
        v-if="errorMessages.length > 0"
        type="error"
        class="mt-4"
        dismissible
        @input="errorMessages = []"
    >
      <ul>
        <li v-for="(msg, index) in errorMessages" :key="index">{{ msg }}</li>
      </ul>
    </v-alert>


    <!-- Результаты расчёта -->
    <v-alert
        v-if="kbzhuResult"
        type="info"
        class="mt-4"
    >
      <div>Калории: <strong>{{ kbzhuResult.calories }}</strong> ккал</div>
      <div>Белки: <strong>{{ kbzhuResult.proteins }} г</strong></div>
      <div>Жиры: <strong>{{ kbzhuResult.fats }} г</strong></div>
      <div>Углеводы: <strong>{{ kbzhuResult.carbs }} г</strong></div>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'

// Интерфейсы для типов данных
interface FormData {
  gender: string
  bodyType: string
  height: number | ''
  weight: number | ''
  goal: string
  workoutsPerWeek: number | ''
}

interface Option {
  text: string
  value: string
}

interface KbzhuResult {
  calories: number
  proteins: number
  fats: number
  carbs: number
}

interface MacrosCoefficient {
  gender: string
  bodyType: string
  proteinCoefficient: number
  fatCoefficient: number
  activityCoefficient: number
}

interface GoalCoefficient {
  gender: string
  bodyType: string
  goal: string
  goalCoefficient: number
}

interface HeightWeightCoefficient {
  gender: string
  bodyType: string
  weightRange: string
  heightRange: string
  coefficient: number
}

const formData = reactive<FormData>({
  gender: '',
  bodyType: '',
  height: '',
  weight: '',
  goal: '',
  workoutsPerWeek: '',
})

const genders: Option[] = [
  { text: 'Мужчина', value: 'мужчина' },
  { text: 'Женщина', value: 'женщина' },
]

const bodyTypes: Option[] = [
  { text: 'Худощавое', value: 'худощавое' },
  { text: 'Среднее', value: 'среднее' },
  { text: 'Плотное', value: 'плотное' },
]

const goals: Option[] = [
  { text: 'Похудение', value: 'похудение' },
  { text: 'Удержание веса', value: 'удержание' },
  { text: 'Набор веса', value: 'набор' },
]

const kbzhuResult = ref<KbzhuResult | null>(null)
const isCalculating = ref(false)
const timer = ref(0)
let intervalId: number | null = null

const errorMessages = ref<string[]>([])

// Коэффициенты, загруженные с сервера
let macrosCoefficients = ref<MacrosCoefficient[]>([])
let goalCoefficients = ref<GoalCoefficient[]>([])
let heightWeightCoefficients = ref<HeightWeightCoefficient[]>([])

// Функция для загрузки коэффициентов
const loadCoefficients = async () => {
  try {
    const [macrosRes, goalRes, heightWeightRes] = await Promise.all([
      axios.get('http://localhost:3002/api/macros-coefficients'),
      axios.get('http://localhost:3002/api/goal-coefficients'),
      axios.get('http://localhost:3002/api/height-weight-coefficients'),
    ])
    macrosCoefficients.value = macrosRes.data
    goalCoefficients.value = goalRes.data
    heightWeightCoefficients.value = heightWeightRes.data

    console.log('Macros Coefficients:', macrosCoefficients.value)
    console.log('Goal Coefficients:', goalCoefficients.value)
    console.log('Height Weight Coefficients:', heightWeightCoefficients.value)
  } catch (error) {
    console.error('Ошибка при загрузке коэффициентов:', error)
    errorMessages.value.push('Не удалось загрузить коэффициенты. Попробуйте позже.')
  }
}

// Функции обработчиков выбора
const selectGender = (gender: string) => {
  formData.gender = gender
  console.log('Selected Gender:', formData.gender)
}

const selectBodyType = (bodyType: string) => {
  formData.bodyType = bodyType
  console.log('Selected Body Type:', formData.bodyType)
}

const selectGoal = (goal: string) => {
  formData.goal = goal
  console.log('Selected Goal:', formData.goal)
}

// Type Guards
function isMacrosCoefficient(value: MacrosCoefficient | undefined): value is MacrosCoefficient {
  return value !== undefined
}

function isGoalCoefficient(value: GoalCoefficient | undefined): value is GoalCoefficient {
  return value !== undefined
}

function isHeightWeightCoefficient(value: HeightWeightCoefficient | null): value is HeightWeightCoefficient {
  return value !== null
}

// Запускаем загрузку коэффициентов при монтировании компонента
onMounted(() => {
  loadCoefficients()
})

// Функция для расчёта КБЖУ
const calculateKbzhu = () => {
  if (isCalculating.value || timer.value > 0) {
    return
  }

  isCalculating.value = true
  errorMessages.value = [] // Очистка предыдущих ошибок
  kbzhuResult.value = null // Очистка предыдущих результатов

  const gender = formData.gender.toLowerCase()
  const bodyType = formData.bodyType.toLowerCase()
  const goal = formData.goal.toLowerCase()
  const height = typeof formData.height === 'number' ? formData.height : parseFloat(formData.height as string)
  const weight = typeof formData.weight === 'number' ? formData.weight : parseFloat(formData.weight as string)
  const workoutsPerWeek = typeof formData.workoutsPerWeek === 'number' ? formData.workoutsPerWeek : parseInt(formData.workoutsPerWeek as string)

  // Сбор специфических ошибок
  if (!gender) {
    errorMessages.value.push('Пожалуйста, выберите пол.')
  }
  if (!bodyType) {
    errorMessages.value.push('Пожалуйста, выберите тип телосложения.')
  }
  if (!goal) {
    errorMessages.value.push('Пожалуйста, выберите цель питания.')
  }
  if (isNaN(height) || height < 150 || height > 197) {
    errorMessages.value.push('Пожалуйста, введите корректный рост (150-197 см).')
  }
  if (isNaN(weight) || weight < 40 || weight > 139) {
    errorMessages.value.push('Пожалуйста, введите корректный вес (40-139 кг).')
  }
  if (isNaN(workoutsPerWeek) || workoutsPerWeek < 0 || workoutsPerWeek > 10) {
    errorMessages.value.push('Пожалуйста, введите корректное число тренировок в неделю (0-10).')
  }

  // Если есть ошибки в базовой валидации
  if (errorMessages.value.length > 0) {
    isCalculating.value = false
    return
  }

  // Получение коэффициентов БЖУ
  const macrosCoeff = macrosCoefficients.value.find((item) => item.gender === gender && item.bodyType === bodyType)
  if (!isMacrosCoefficient(macrosCoeff)) {
    errorMessages.value.push('Коэффициенты БЖУ не найдены для указанных параметров.')
  }

  // Получение коэффициента цели питания
  const goalCoeff = goalCoefficients.value.find((item) => item.gender === gender && item.bodyType === bodyType && item.goal === goal)
  if (!isGoalCoefficient(goalCoeff)) {
    errorMessages.value.push('Коэффициенты цели питания не найдены для указанных параметров.')
  }

  // Подбор коэффициента по росту и весу
  const heightWeightCoeff = getHeightWeightCoefficient(gender, bodyType, weight, height)
  if (!isHeightWeightCoefficient(heightWeightCoeff)) {
    errorMessages.value.push('Коэффициенты по росту и весу не найдены для указанных параметров.')
  }

  function isMacrosCoefficient(value: MacrosCoefficient | undefined): value is MacrosCoefficient {
    return value !== undefined
  }

  function isGoalCoefficient(value: GoalCoefficient | undefined): value is GoalCoefficient {
    return value !== undefined
  }

  function isHeightWeightCoefficient(value: HeightWeightCoefficient | null): value is HeightWeightCoefficient {
    return value !== null
  }


  // Если есть ошибки после получения коэффициентов
  if (errorMessages.value.length > 0) {
    isCalculating.value = false
    return
  }

  // Теперь TypeScript знает, что macrosCoeff, goalCoeff и heightWeightCoeff определены

  // Расчёт калорийности и БЖУ
  let activityCoefficient = macrosCoeff.activityCoefficient
  let proteinCoefficient = macrosCoeff.proteinCoefficient
  let fatCoefficient = macrosCoeff.fatCoefficient

  // Расчёт базовой калорийности
  let calories = activityCoefficient * weight

  // Учитываем коэффициент по росту и весу
  calories *= heightWeightCoeff.coefficient

  // Учитываем коэффициент цели питания
  calories *= goalCoeff.goalCoefficient

  // Учитываем число тренировок
  const totalCaloriesPerWeek = (calories * 7) + (workoutsPerWeek * 400)
  calories = totalCaloriesPerWeek / 7

  // Расчёт белков и жиров
  const proteins = proteinCoefficient * weight
  const fats = fatCoefficient * weight

  // Калории из белков и жиров
  const proteinCalories = proteins * 4
  const fatCalories = fats * 9

  // Расчёт углеводов
  const carbCalories = calories - (proteinCalories + fatCalories)
  const carbs = carbCalories / 4

  // Округление результатов
  kbzhuResult.value = {
    calories: Math.round(calories),
    proteins: Math.round(proteins),
    fats: Math.round(fats),
    carbs: Math.round(carbs),
  }

  // Запуск таймера повторной генерации
  timer.value = 10
  intervalId = window.setInterval(() => {
    timer.value--
    if (timer.value <= 0 && intervalId !== null) {
      window.clearInterval(intervalId)
      intervalId = null
    }
  }, 1000)

  isCalculating.value = false
}

// Функция для получения коэффициента по росту и весу
const getHeightWeightCoefficient = (gender: string, bodyType: string, weight: number, height: number) => {
  // Находим все коэффициенты для указанного пола и телосложения
  const coeffs = heightWeightCoefficients.value.filter(
      (item) => item.gender === gender && item.bodyType === bodyType
  )

  // Поиск диапазона веса, в который попадает пользователь
  let weightRange = ''
  for (const coeff of coeffs) {
    const [minWeight, maxWeight] = coeff.weightRange.split('-').map(Number)
    if (weight >= minWeight && weight <= maxWeight) {
      weightRange = coeff.weightRange
      break
    }
  }

  // Если диапазон веса не найден, берем ближайший
  if (!weightRange) {
    // Получаем все уникальные диапазоны веса
    const weightRanges = Array.from(new Set(coeffs.map((item) => item.weightRange)))
    weightRange = getClosestRange(weightRanges, weight)
  }

  // Фильтруем коэффициенты по найденному диапазону веса
  const weightCoeffs = coeffs.filter((item) => item.weightRange === weightRange)

  // Поиск диапазона роста, в который попадает пользователь
  let heightRange = ''
  for (const coeff of weightCoeffs) {
    const [minHeight, maxHeight] = coeff.heightRange.split('-').map(Number)
    if (height >= minHeight && height <= maxHeight) {
      heightRange = coeff.heightRange
      return coeff
    }
  }

  // Если диапазон роста не найден, берем ближайший
  if (!heightRange) {
    const heightRanges = weightCoeffs.map((item) => item.heightRange)
    heightRange = getClosestRange(heightRanges, height)
    return weightCoeffs.find((item) => item.heightRange === heightRange) || null
  }

  return null
}

// Функция для получения ближайшего диапазона
const getClosestRange = (ranges: string[], value: number): string => {
  let closestRange = ranges[0]
  let minDiff = Infinity

  for (const range of ranges) {
    const [min, max] = range.split('-').map(Number)
    const diff = Math.min(Math.abs(value - min), Math.abs(value - max))
    if (diff < minDiff) {
      minDiff = diff
      closestRange = range
    }
  }

  return closestRange
}
</script>


<style scoped>
.kbzhu-calculator {
  max-width: 600px;
  margin: 0 auto;
}

.v-slide-group {
  overflow-x: auto;
}

.selected-button {
  background-color: #2196f3 !important;
  color: white !important;
}

</style>
