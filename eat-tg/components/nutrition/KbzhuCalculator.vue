<!-- components/KbzhuCalculator.vue -->

<template>
  <div class="py-1">
    <p>Все вводимые в калькулятор данные не сохраняются и не используются.</p>

    <!-- Выбор пола -->
    <v-card class="my-2 dark-background pa-1" variant="tonal">
      <v-card-text class="pa-1">
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
                outlined
                class="group-button mx-auto"
                :class="{ 'selected-button': formData.gender === gender.value }"
                @click="selectGender(gender.value)"
                rounded="lg"
            >
              {{ gender.text }}
            </v-btn>
          </v-slide-group-item>
        </v-slide-group>
      </v-card-text>
    </v-card>

    <!-- Ввод телосложения -->
    <v-card class="my-2 dark-background pa-1" variant="tonal">
      <v-card-text class="pa-1">
        <v-slide-group
            v-model="formData.bodyType"
            mandatory
            class="flex-nowrap align-center"
        >
          <v-slide-group-item
              v-for="bodyType in bodyTypes"
              :key="bodyType.value"
              :value="bodyType.value"
          >
            <v-btn
                variant="text"
                :value="bodyType.value"
                outlined
                class="mx-auto px-3"
                :class="{ 'selected-button': formData.bodyType === bodyType.value }"
                @click="selectBodyType(bodyType.value)"
                rounded="lg"
            >
              {{ bodyType.text }}
            </v-btn>
          </v-slide-group-item>
        </v-slide-group>
      </v-card-text>
    </v-card>

    <!-- Ввод роста, веса и возраста с помощью ScrollPicker -->
    <v-row class="no-gutters">
      <!-- Ввод роста -->
      <v-col cols="4" class="pr-1">
        <v-card class="my-0 dark-background pa-0" variant="tonal">
          <ScrollPicker
              :options="heightOptions"
              v-model="heightSelection"
              class="scroll-picker"
              active-style="color: white; background-color: transparent;"
              inactive-style="color: #39393987; background-color: transparent;"
          />
        </v-card>
      </v-col>

      <!-- Ввод веса -->
      <v-col cols="4" class="px-1">
        <v-card class="my-0 dark-background pa-0" variant="tonal">
          <ScrollPicker
              :options="weightOptions"
              v-model="weightSelection"
              class="scroll-picker"
              active-style="color: white; background-color: transparent;"
              inactive-style="color: #39393987; background-color: transparent;"
          />
        </v-card>
      </v-col>

      <!-- Ввод возраста -->
      <v-col cols="4" class="pl-1">
        <v-card class="my-0 dark-background pa-0" variant="tonal">
          <ScrollPicker
              :options="ageOptions"
              v-model="ageSelection"
              class="scroll-picker"
              active-style="color: white; background-color: transparent;"
              inactive-style="color: #39393987; background-color: transparent;"
          />
        </v-card>
      </v-col>
    </v-row>

    <!-- Ввод цели питания -->
    <v-card class="my-2 dark-background pa-1" variant="tonal">
      <v-card-text class="pa-1">
        <v-slide-group
            v-model="formData.goal"
            class="flex-nowrap"
            center-active
            mandatory
        >
          <v-slide-group-item
              v-for="goal in goals"
              :key="goal.value"
              :value="goal.value"
          >
            <v-btn
                variant="text"
                :value="goal.value"
                outlined
                class="group-button mx-auto px-3"
                :class="{ 'selected-button': formData.goal === goal.value }"
                @click="selectGoal(goal.value)"
                rounded="lg"
            >
              {{ goal.text }}
            </v-btn>
          </v-slide-group-item>
        </v-slide-group>
      </v-card-text>
    </v-card>

    <!-- Ввод числа тренировок в неделю -->
    <v-card class="my-1 dark-background pa-0" variant="tonal">
      <v-card-text class="pa-1">
        <p class="mb-2 pl-3 text-center" style="font-size: 16px;">
          Тренировок в неделю (~1 час) → <strong style="font-size: 20px;">{{ formData.workoutsPerWeek }}</strong>
        </p>
        <v-slider
            v-model="formData.workoutsPerWeek"
            :min="0"
            :max="10"
            step="1"
            show-ticks="always"
            tick-size="2"
            :tick-labels="workoutsLabels"
            required
            class="mb-0 pl-3"
            hide-details="auto"
        ></v-slider>
      </v-card-text>
    </v-card>

    <!-- Кнопка расчёта -->
    <v-btn
        :disabled="isGenerating || timer > 0"
        @click="onCalculate"
        color="success"
    class="mt-2"
    rounded="lg"
    width="100%"
    >
    <!-- Иконка, которая при загрузке вращается -->
    <span v-if="isGenerating">Рассчитываю.. </span>
    <span v-else>Рассчитать</span>
    <v-icon
        right
        :class="{ rotatingDumbbell: isGenerating }"
    >
      mdi-calculator
    </v-icon>
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

    <!-- v-bottom-sheet для отображения результатов расчёта -->
    <v-bottom-sheet
        v-model="showBottomSheet"
        scrim
        :persistent="false"
        content-class="rounded-bottom-sheet"
    >
      <v-card>
        <v-card-title class="ml-4">Результаты расчёта</v-card-title>
        <v-card-text class="my-2">
          <div class="mb-4">
            <div>Калории в сутки: <strong>{{ kbzhuResult?.calories }} ккал</strong></div>
            <div>Калории от тренировок: <strong>{{ kbzhuResult?.extraCalories }} ккал</strong></div>
            <div>Белки: <strong>{{ kbzhuResult?.proteins }} г</strong></div>
            <div>Жиры: <strong>{{ kbzhuResult?.fats }} г</strong></div>
            <div>Углеводы: <strong>{{ kbzhuResult?.carbs }} г</strong></div>
          </div>

          <!-- Добавляем canvas для диаграммы -->
          <div class="chart-container">
            <canvas id="macroChart"></canvas>
          </div>

          <div class="text-center my-2">
            <v-btn
                color="success"
            @click="sendKbzhuResult"
            :disabled="!telegramUserId"
            rounded="lg"
            class="mb-1"
            >
            <v-icon left>mdi-send</v-icon>
            Отправить себе
            </v-btn>
            <v-btn
                @click="closeBottomSheet"
                variant="text"
            class="group-button mx-auto"
            rounded="lg"
            >
            Закрыть
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-bottom-sheet>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import axios from 'axios';
import { retrieveLaunchParams } from "@telegram-apps/sdk";
import ScrollPicker from 'vue3-scroll-picker';
import Chart from 'chart.js/auto';

// Импортируем наш хук
import { useKbzhu } from '~~/composables/useKbzhu'; // подставьте нужный путь

// Интерфейсы для типов данных
interface FormData {
  gender: string
  bodyType: string
  age: number | ''
  height: number | ''
  weight: number | ''
  goal: string
  workoutsPerWeek: number
}

interface Option {
  text: string
  value: string
}

interface KbzhuResult {
  calories: number
  extraCalories: number
  proteins: number
  fats: number
  carbs: number
}

// Определение базовых URL-адресов
const primaryBaseURL = 'https://fit-server-bot.ru.tuna.am/api/'
const fallbackBaseURL = 'http://localhost:3002/api/'

// Инициализация данных пользователя из Telegram
const telegramUserId = ref<string | null>(null)

// Данные для селекторов
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
  { text: 'Удержание', value: 'удержание' },
  { text: 'Набор', value: 'набор' },
]

const workoutsLabels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// Функция для корректного склонения слова "год"
const getYearDeclension = (age: number): string => {
  const lastDigit = age % 10;
  const lastTwoDigits = age % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'лет';
  }

  if (lastDigit === 1) {
    return 'год';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'года';
  }

  return 'лет';
};

// Опции для ScrollPicker с правильным склонением
const ageOptions = [
  Array.from({ length: 111 }, (_, i) => {
    const age = 10 + i;
    const declension = getYearDeclension(age);
    return {
      label: `${age} ${declension}`,
      value: `${age}`,
    };
  }),
];

// Опции для роста и веса
const heightOptions = [
  Array.from({ length: 101 }, (_, i) => ({
    label: `${150 + i} см`,
    value: `${150 + i}`,
  })),
];

const weightOptions = [
  Array.from({ length: 211 }, (_, i) => ({
    label: `${40 + i} кг`,
    value: `${40 + i}`,
  })),
];

// Реактивные данные формы
const formData = reactive<FormData>({
  gender: '',
  bodyType: '',
  age: '',
  height: '',
  weight: '',
  goal: '',
  workoutsPerWeek: 3,
})

const selectGoal = (goal: string) => {
  formData.goal = goal;
  console.log('Selected Goal:', formData.goal);
};

// Вычисляемые свойства для отображения текста
const goalText = computed(() => {
  return goals.find(goal => goal.value === formData.goal)?.text || '';
});

// Состояние для ScrollPicker
const heightSelection = ref<string[]>(['170']) // Начальное значение
const weightSelection = ref<string[]>(['70'])  // Начальное значение
const ageSelection = ref<string[]>(['30'])     // Начальное значение

// Состояние для v-bottom-sheet
const showBottomSheet = ref(false)

// Добавляем ref для диаграммы
let macroChart: Chart | null = null;

// --- ПОДКЛЮЧАЕМ НАШ ХУК ---
const {
  kbzhuResult,
  isGenerating,
  errorMessages,
  timer,
  calculateKbzhu
} = useKbzhu()

// Следим за значениями ScrollPicker и обновляем formData
watch(heightSelection, (newVal) => {
  formData.height = parseInt(newVal[0]) || ''
})
watch(weightSelection, (newVal) => {
  formData.weight = parseInt(newVal[0]) || ''
})
watch(ageSelection, (newVal) => {
  formData.age = parseInt(newVal[0]) || ''
})

// Функции обработчиков выбора пола/телосложения
const selectGender = (gender: string) => {
  formData.gender = gender;
  console.log('Selected Gender:', formData.gender);

  if (gender === 'мужчина') {
    heightSelection.value = ['175'];
    weightSelection.value = ['90'];
    ageSelection.value = ['30'];
  } else if (gender === 'женщина') {
    heightSelection.value = ['170'];
    weightSelection.value = ['60'];
    ageSelection.value = ['30'];
  }
}

const selectBodyType = (bodyType: string) => {
  formData.bodyType = bodyType;
  console.log('Selected Body Type:', formData.bodyType);
}

// Запрашиваем данные Telegram при монтировании
onMounted(() => {
  if (process.client) {
    const launchParams = retrieveLaunchParams();
    if (launchParams && launchParams.initData) {
      const user = launchParams.initData.user;
      if (user && user.id) {
        telegramUserId.value = String(user.id);
        console.log('telegramUserId:', telegramUserId.value);
      } else {
        console.error('Не удалось получить данные пользователя из Telegram.');
        errorMessages.value.push('Не удалось получить данные пользователя. Убедитесь, что приложение запущено внутри Telegram.')
      }
    } else {
      console.error('Не удалось получить initData из launchParams.');
      errorMessages.value.push('Не удалось получить данные пользователя. Убедитесь, что приложение запущено внутри Telegram.')
    }
  }
});

// Эта функция просто вызывает calculateKbzhu из нашего хука
const onCalculate = () => {
  calculateKbzhu(formData, showBottomSheet, nextTick, updateMacroChart)
}

// Функция для обновления диаграммы (остаётся здесь)
const updateMacroChart = () => {
  if (!kbzhuResult.value) return;

  const proteinCalories = kbzhuResult.value.proteins * 4;
  const fatCalories = kbzhuResult.value.fats * 9;
  const carbCalories = kbzhuResult.value.carbs * 4;
  const totalMacroCalories = proteinCalories + fatCalories + carbCalories;

  const proteinPercent = ((proteinCalories / totalMacroCalories) * 100).toFixed(1);
  const fatPercent = ((fatCalories / totalMacroCalories) * 100).toFixed(1);
  const carbPercent = ((carbCalories / totalMacroCalories) * 100).toFixed(1);

  const ctx = (document.getElementById('macroChart') as HTMLCanvasElement)?.getContext('2d');
  if (!ctx) return;

  // Уничтожаем предыдущую диаграмму, если она есть
  if (macroChart) {
    macroChart.destroy();
  }

  macroChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [
        `Белки (${proteinPercent}%)`,
        `Жиры (${fatPercent}%)`,
        `Углеводы (${carbPercent}%)`,
        `Калорий (${totalMacroCalories} ккал)`,
      ],
      datasets: [{
        data: [proteinCalories, fatCalories, carbCalories],
        backgroundColor: [
          '#42A5F5', // Синий для белков
          '#FFA726', // Оранжевый для жиров
          '#66BB6A', // Зелёный для углеводов
          '#d16060', // Для примера
        ],
        hoverOffset: 4
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              return `${label}: ${value} ккал`;
            }
          }
        },
        legend: {
          position: 'bottom',
          labels: {
            color: '#fff', // Цвет текста легенды (для темного фона)
          }
        }
      }
    }
  });
}

// Функция для управления v-bottom-sheet
const closeBottomSheet = () => {
  showBottomSheet.value = false
  // Уничтожаем диаграмму при закрытии
  if (macroChart) {
    macroChart.destroy();
    macroChart = null;
  }
}

// Функция для отправки результатов в Telegram
const sendKbzhuResult = async () => {
  if (!kbzhuResult.value || !telegramUserId.value) {
    errorMessages.value.push('Не удалось отправить результаты. Проверьте данные пользователя.')
    return
  }

  console.log('Отправка результатов для Telegram ID:', telegramUserId.value)

  try {
    await axios.post(`${primaryBaseURL}send-kbzhu`, {
      userId: telegramUserId.value,
      kbzhuResult: kbzhuResult.value
    })

    alert('Результаты успешно отправлены!')
  } catch (error: any) {
    console.error('Ошибка при отправке результатов:', error)
    errorMessages.value.push('Не удалось отправить результаты. Попробуйте позже.')
  }
}
</script>

<style scoped>
/* Настройка размеров ScrollPicker */
.scroll-picker {
  width: 100%;
  height: 80px; /* Уменьшенная высота */
  overflow: hidden;
  position: relative;
}

/* Настройка текста опций */
.scroll-picker .scroll-picker__option {
  font-size: 16px;
  text-align: center;
}

/* Настройка активной опции */
.scroll-picker .scroll-picker__option.active {
  color: white;
  background-color: transparent;
}

/* Настройка неактивных опций */
.scroll-picker .scroll-picker__option.inactive {
  color: rgba(57, 57, 57, 0.53);
  background-color: #00000033;
}

/* Настройка центральной зоны */
.scroll-picker .scroll-picker__center-overlay {
  background: linear-gradient(to bottom, transparent, #00000033, transparent);
}

/* Дополнительные стили для темной темы */
.dark-background {
  background-color: #121212 !important;
}

.group-button {
  min-width: 45%;
}

.selected-button {
  background-color: var(--v-primary-base) !important; /* Используем CSS-переменную для консистентности */
  color: white !important;
}

/* Вращение иконки */
.rotatingDumbbell {
  animation: rotate-dumbbell 1s linear infinite;
}

@keyframes rotate-dumbbell {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Стилизация контейнера диаграммы */
.chart-container {
  max-width: 300px;
  margin: 20px auto;
}

/* Скрытие скроллбара */
.scroll-picker ::v-deep .scroll-picker__scroll-area::-webkit-scrollbar {
  display: none; /* Safari и Chrome */
}

.scroll-picker ::v-deep .scroll-picker__scroll-area {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

/* Остальные стили остаются без изменений */
.rounded-bottom-sheet {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
}

/* Контейнер для кнопок закрытия и отправки */
.text-center .v-btn {
  min-width: 150px;
}

/* Изменение цвета иконки для кнопок */
.v-btn .v-icon {
  margin-right: 0;
}

/* Перетаскивание (если необходимо) */
.dragging {
  opacity: 0.5;
}
</style>
