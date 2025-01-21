<!-- components/KbzhuCalculator.vue -->
<template>
  <div class="py-0">
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
                outlined
                class="gender-button mx-auto"
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
                outlined
                class="group-button mx-auto"
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

    <!-- Ввод роста, веса и возраста с помощью v-select -->
    <v-row class="no-gutters">
      <!-- Ввод роста -->
      <v-col cols="4" class="pr-1">
        <v-card class="my-0 dark-background pa-2" variant="tonal">
          <v-select
              :items="heightOptions"
              label="Рост"
              variant="outlined"
              v-model.number="formData.height"
              item-title="text"
              item-value="value"
              dense
              hide-details
              :return-object="false"
          ></v-select>
        </v-card>
      </v-col>

      <!-- Ввод веса -->
      <v-col cols="4" class="px-1">
        <v-card class="my-0 dark-background pa-2" variant="tonal">
          <v-select
              :items="weightOptions"
              label="Вес"
              variant="outlined"
              v-model.number="formData.weight"
              item-title="text"
              item-value="value"
              dense
              hide-details
              :return-object="false"
          ></v-select>
        </v-card>
      </v-col>

      <!-- Ввод возраста -->
      <v-col cols="4" class="pl-1">
        <v-card class="my-0 dark-background pa-2" variant="tonal">
          <v-select
              :items="ageOptions"
              label="Возраст"
              variant="outlined"
              v-model.number="formData.age"
              item-title="text"
              item-value="value"
              dense
              hide-details
              :return-object="false"
          ></v-select>
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
                outlined
                class="group-button mx-auto"
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
        :disabled="isAnimating || isGenerating"
        @click="onCalculate"
        color="success"
        class="mt-2"
        rounded="lg"
        width="100%"
    >
      <!-- Текст кнопки в зависимости от состояния -->
      <span v-if="isAnimating">создаю..</span>
      <span v-else-if="isGenerating">Рассчитываю..</span>
      <span v-else>Рассчитать</span>
      <!-- Иконка, которая при загрузке вращается -->
      <v-icon
          right
          :class="{ rotatingDumbbell: isAnimating || isGenerating }"
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

    <!-- BottomSheetWithClose для результатов расчёта -->
    <BottomSheetWithClose
        v-model="showBottomSheet"
        title="Результаты расчёта"
        :persistent="false"
        max-width="600px"
    >
      <v-card-text class="my-2">
        <div class="mb-4">
          <div>Калории в сутки: <strong>{{ kbzhuResult.calories }} ккал</strong></div>
          <div>Калории от тренировок: <strong>{{ kbzhuResult.extraCalories }} ккал</strong></div>
          <div>Белки: <strong>{{ kbzhuResult.proteins }} г</strong></div>
          <div>Жиры: <strong>{{ kbzhuResult.fats }} г</strong></div>
          <div>Углеводы: <strong>{{ kbzhuResult.carbs }} г</strong></div>
        </div>

        <!-- Canvas для диаграммы -->
        <div class="chart-container">
          <canvas id="macroChart"></canvas>
        </div>

        <div class="text-center my-2">
          <v-btn
              color="primary"
              @click="sendKbzhuResult"
              :disabled="!telegramUserId"
              rounded="lg"
              class="mb-1"
          >
            <v-icon left>mdi-send</v-icon>
            Отправить себе
          </v-btn>
        </div>
      </v-card-text>
    </BottomSheetWithClose>

    <!-- Кнопка для тестирования КБЖУ, только для админов -->
    <v-btn
        v-if="isAdmin"
        color="secondary"
        @click="toggleTestComponent"
        class="my-2"
        rounded="lg"
        width="100%"
    >
      <v-icon left>mdi-test-tube</v-icon>
      Тестировать КБЖУ
    </v-btn>

    <!-- Компонент для тестирования КБЖУ -->
    <KbzhuCalculatorTest
        v-if="showTestComponent"
        @close="toggleTestComponent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { retrieveLaunchParams } from "@telegram-apps/sdk";
import Chart from 'chart.js/auto';
import { useApi } from '~/composables/useApi';
import { useKbzhu } from '~/composables/useKbzhu'; // Хук для расчёта КБЖУ
import { useKbzhuAnalytics } from '~/composables/analytics/usersKbzhu'; // Хук для аналитики
import BottomSheetWithClose from '../shared/BottomSheetWithClose.vue';
import KbzhuCalculatorTest from './KbzhuCalculatorTest.vue';
import { useUserStore } from '@/stores/userStore';

// ------------------ Интерфейсы ------------------
interface FormData {
  gender: string;
  bodyType: string;
  age: number | null;
  height: number | null;
  weight: number | null;
  goal: string;
  workoutsPerWeek: number;
}

interface StringOption {
  text: string;
  value: string;
}

interface NumberOption {
  text: string;
  value: number;
}

interface KbzhuResult {
  calories: number;
  extraCalories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

// ------------------ Инициализация ------------------

// Telegram user ID
const telegramUserId = ref<number | null>(null);

// Данные для селекторов
const genders: StringOption[] = [
  { text: 'Мужчина', value: 'мужчина' },
  { text: 'Женщина', value: 'женщина' },
];

const bodyTypes: StringOption[] = [
  { text: 'Худощавое', value: 'худощавое' },
  { text: 'Среднее', value: 'среднее' },
  { text: 'Плотное', value: 'плотное' },
];

const goals: StringOption[] = [
  { text: 'Похудение', value: 'похудение' },
  { text: 'Удержание', value: 'удержание' },
  { text: 'Набор', value: 'набор' },
];

const workoutsLabels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Функция для склонения "год"
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

// Создаем списки опций для возраста, роста, веса
const ageOptions: NumberOption[] = Array.from({ length: 111 }, (_, i) => {
  const age = 10 + i;
  return {
    text: `${age} ${getYearDeclension(age)}`,
    value: age,
  };
});

const heightOptions: NumberOption[] = Array.from({ length: 101 }, (_, i) => ({
  text: `${150 + i} см`,
  value: 150 + i,
}));

const weightOptions: NumberOption[] = Array.from({ length: 211 }, (_, i) => ({
  text: `${40 + i} кг`,
  value: 40 + i,
}));

// Реактивные данные формы
const formData = reactive<FormData>({
  gender: '',
  bodyType: '',
  age: null,
  height: null,
  weight: null,
  goal: '',
  workoutsPerWeek: 3,
});

// Подключаем хук аналитики
const { sendAnalyticsData } = useKbzhuAnalytics();

// Watcher для формы — логирует изменения
watch(
    formData,
    (newVal) => {
      console.log('formData изменился:', JSON.stringify(newVal, null, 2));
    },
    { deep: true }
);

// -------------- Хэндлеры выбора --------------
const selectGender = (gender: string) => {
  formData.gender = gender;
  console.log('Selected Gender:', formData.gender);

  // Пример автозаполнения при выборе пола
  if (gender === 'мужчина') {
    formData.height = 175;
    formData.weight = 90;
    formData.age = 30;
  } else if (gender === 'женщина') {
    formData.height = 170;
    formData.weight = 60;
    formData.age = 30;
  }
};

const selectBodyType = (bodyType: string) => {
  formData.bodyType = bodyType;
  console.log('Selected Body Type:', formData.bodyType);
};

const selectGoal = (goal: string) => {
  formData.goal = goal;
  console.log('Selected Goal:', formData.goal);
};

// ---------- Состояние для BottomSheetWithClose ----------
const showBottomSheet = ref(false);

// ---------- Диаграмма (Chart.js) ----------
let macroChart: Chart | null = null;

// ---------- Хук для расчёта КБЖУ ----------
const {
  kbzhuResult,
  isGenerating,
  errorMessages,
  calculateKbzhu,
} = useKbzhu();

// Подключаем API для дополнительной логики
const { apiRequest } = useApi();

// --------- Watchers для вывода в консоль ---------
watch(kbzhuResult, (newResult) => {
  console.log('kbzhuResult изменился:', newResult);
});

watch(errorMessages, (newErrors) => {
  if (newErrors.length > 0) {
    console.error('errorMessages:', newErrors);
  }
});

// ---------- Pinia для проверки, админ ли пользователь ----------
const userStore = useUserStore();
const isAdmin = computed(() => userStore.role === 'admin');

// ---------- Тестовый компонент (для админов) ----------
const showTestComponent = ref(false);
const toggleTestComponent = () => {
  showTestComponent.value = !showTestComponent.value;
};

// ---------- Telegram initData ----------
onMounted(() => {
  if (process.client) {
    const launchParams = retrieveLaunchParams();
    if (launchParams && launchParams.initData) {
      const user = launchParams.initData.user;
      if (user && user.id) {
        telegramUserId.value = Number(user.id);
        console.log('telegramUserId:', telegramUserId.value);
      } else {
        console.error('Не удалось получить данные пользователя из Telegram.');
        errorMessages.value.push('Не удалось получить данные пользователя. Убедитесь, что приложение запущено внутри Telegram.');
      }
    } else {
      console.error('Не удалось получить initData из launchParams.');
      errorMessages.value.push('Не удалось получить данные пользователя. Убедитесь, что приложение запущено внутри Telegram.');
    }
  }
});

// ---------- Имитируем анимацию генерации ----------
const isAnimating = ref(false);

// ---------- Основная кнопка "Рассчитать" ----------
const onCalculate = async () => {
  console.log('Вызов onCalculate с formData:', JSON.stringify(formData, null, 2));

  // Имитация генерации
  isAnimating.value = true;
  const delay = 1100 + Math.random() * 200;
  await new Promise(resolve => setTimeout(resolve, delay));
  isAnimating.value = false;

  // Запускаем реальный расчёт
  await calculateKbzhu(formData, showBottomSheet, nextTick, updateMacroChart);

  // Если нет ошибок — отправляем результаты через модуль аналитики
  if (!errorMessages.value.length && kbzhuResult.value) {
    try {
      console.log('Отправляем аналитические данные через модуль аналитики...');
      sendAnalyticsData(telegramUserId.value, formData, kbzhuResult.value);
    } catch (err) {
      console.error('Ошибка при отправке аналитики через модуль:', err);
    }
  }
};

// ---------- Функция для обновления диаграммы ----------
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
  if (!ctx) {
    console.error('Не удалось получить контекст для диаграммы.');
    return;
  }

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
        `Всего (${totalMacroCalories} ккал)`,
      ],
      datasets: [
        {
          data: [proteinCalories, fatCalories, carbCalories],
          backgroundColor: [
            '#42A5F5', // Белки
            '#FFA726', // Жиры
            '#66BB6A', // Углеводы
            '#d16060', // Дополнительный цвет
          ],
          hoverOffset: 4,
        },
      ],
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.parsed;
              return `${label}: ${value} ккал`;
            },
          },
        },
        legend: {
          position: 'bottom',
          labels: {
            color: '#fff',
          },
        },
      },
    },
  });
};

// ---------- Закрытие BottomSheet (если нужно) ----------
const closeBottomSheet = () => {
  showBottomSheet.value = false;
  if (macroChart) {
    macroChart.destroy();
    macroChart = null;
  }
};

// ---------- Отправка результатов себе в Telegram ----------
const sendKbzhuResult = async () => {
  if (!kbzhuResult.value || telegramUserId.value === null) {
    errorMessages.value.push('Не удалось отправить результаты. Проверьте данные пользователя.');
    console.error('sendKbzhuResult: отсутствуют kbzhuResult или telegramUserId');
    return;
  }

  console.log('Отправка результатов для Telegram ID:', telegramUserId.value, 'kbzhuResult:', kbzhuResult.value);

  try {
    await apiRequest('post', 'bot/send-kbzhu', {
      userId: telegramUserId.value,
      kbzhuResult: kbzhuResult.value,
    });
    alert('Результаты успешно отправлены!');
  } catch (error: any) {
    console.error('Ошибка при отправке результатов:', error);
    errorMessages.value.push('Не удалось отправить результаты. Попробуйте позже.');
  }
};
</script>

<style scoped>
/* Дополнительные стили для тёмной темы */
.dark-background {
  background-color: #121212 !important;
}

.gender-button {
  min-width: 45%;
}

.selected-button {
  background-color: var(--v-primary-base);
  color: white;
}

/* Вращающаяся иконка при загрузке */
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

.chart-container {
  max-width: 300px;
  margin: 20px auto;
}

/* BottomSheet стили */
.rounded-bottom-sheet {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
}

/* Кнопка для тестов */
.text-center .v-btn {
  min-width: 150px;
}

.v-btn .v-icon {
  margin-right: 0;
}

.dragging {
  opacity: 0.5;
}
</style>
