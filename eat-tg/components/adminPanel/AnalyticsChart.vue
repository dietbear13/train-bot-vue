<template>
  <v-card class="pa-4">
    <!-- Фильтры/настройки в верхней панели -->
    <div class="row mb-2 filter-row">
      <!-- Фильтр: дата начала с выбором через v-date-picker -->
      <div class="col-12 col-md-3 filter-item">
        <v-menu v-model="menuStart" transition="scale-transition" offset-y>
          <template #activator="{ props }">
            <v-text-field
                v-model="startDateStr"
                v-bind="props"
                label="Дата начала (дд.мм.гггг)"
                variant="outlined"
                :error="startDateError !== ''"
                :error-messages="[startDateError]"
                placeholder="01.01.2025"
                clearable
                @input="validateStartDate"
            />
          </template>
          <!-- Используем только v-model для связывания -->
          <v-date-picker
              v-model="startDateISO"
              locale="ru"
          />
        </v-menu>
      </div>

      <!-- Фильтр: дата окончания с выбором через v-date-picker -->
      <div class="col-12 col-md-3 filter-item">
        <v-menu v-model="menuEnd" transition="scale-transition" offset-y>
          <template #activator="{ props }">
            <v-text-field
                v-model="endDateStr"
                v-bind="props"
                label="Дата окончания (дд.мм.гггг)"
                variant="outlined"
                :error="endDateError !== ''"
                :error-messages="[endDateError]"
                placeholder="31.12.2025"
                clearable
                @input="validateEndDate"
            />
          </template>
          <v-date-picker
              v-model="endDateISO"
              locale="ru"
          />
        </v-menu>
      </div>

      <!-- Выбор режима -->
        <div class="col-12 col-md-3 filter-item">
          <v-select
              v-model="selectedMode"
              :items="modeItems"
              label="Режим"
              variant="outlined"
              item-text="label"
              item-value="value"
          />
        </div>

      <!-- Выбор типа графика -->
      <div class="col-12 col-md-3 filter-item">
        <v-select
            v-model="chartType"
            :items="chartTypeItems"
            label="Тип графика"
            variant="outlined"
            item-title="title"
            item-value="value"
        />
      </div>


    </div>

      <!-- Остальные элементы разметки ... -->
      <div class="row mb-3 mode-row">
        <v-expansion-panels class="mb-3">
          <v-expansion-panel>
            <v-expansion-panel-title>Выбор метрик</v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="row checkboxes-row">
                <div class="col-12 col-md-2 checkbox-item">
                  <v-checkbox v-model="showTrainGenerated" label="Сген. тренировки" />
                </div>
                <div class="col-12 col-md-2 checkbox-item">
                  <v-checkbox v-model="showTrainSent" label="Отправл. тренировки" />
                </div>
                <div class="col-12 col-md-2 checkbox-item">
                  <v-checkbox v-model="showKbzhu" label="КБЖУ" />
                </div>
                <div class="col-12 col-md-2 checkbox-item">
                  <v-checkbox v-model="showLikes" label="Лайки" />
                </div>
                <div class="col-12 col-md-2 checkbox-item">
                  <v-checkbox v-model="showDonations" label="Донаты" />
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

    <!-- График -->
    <apexchart
        :type="chartType"
        height="400"
        :options="chartOptions"
        :series="chartSeries"
    />

    <!-- Статус загрузки или ошибка -->
    <v-alert
        v-if="userError"
        type="error"
        variant="tonal"
        class="mt-4"
        closable
        @click:close="userError = null"
    >
      {{ userError }}
    </v-alert>

    <v-progress-circular
        v-if="loading"
        indeterminate
        color="primary"
        class="mt-4"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import ApexCharts from 'vue3-apexcharts'
import { useApi } from '../../composables/useApi'
import { type IUser, aggregateUserData, getDatesInRange, aggregateUserDataLast } from '../../utils/analyticsHelpers'
import { parseDateDMY, formatDayKey } from '../../utils/dateUtils'

const { apiRequest } = useApi()

// Локально храним пользователей и статус
const users = ref<IUser[]>([])
const loading = ref(false)
const userError = ref<string | null>(null)

// Даты (по умолчанию последние 7 дней)
const now = new Date()
const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(now.getDate() - 13)

// Функция форматирования Date -> дд.мм.гггг
function toDDMMYYYY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

// Функция для получения даты в формате ISO (YYYY-MM-DD) для v-date-picker
function toISODate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Строковые поля для полей ввода
const startDateStr = ref(toDDMMYYYY(sevenDaysAgo))
const endDateStr = ref(toDDMMYYYY(now))

const startDateError = ref('')
const endDateError = ref('')

// Храним "распарсенные" объекты Date
let startDateParsed: Date = sevenDaysAgo
let endDateParsed: Date = now

// Дополнительные реактивные переменные для работы v-date-picker
const menuStart = ref(false)
const menuEnd = ref(false)
const startDateISO = ref(toISODate(sevenDaysAgo))
const endDateISO = ref(toISODate(now))

// Следим за изменением значения пикера для даты начала
watch(startDateISO, (newVal) => {
  const d = new Date(newVal)
  startDateParsed = d
  startDateStr.value = toDDMMYYYY(d)
  menuStart.value = false
})

// Аналогично для даты окончания
watch(endDateISO, (newVal) => {
  const d = new Date(newVal)
  endDateParsed = d
  endDateStr.value = toDDMMYYYY(d)
  menuEnd.value = false
})

function validateStartDate() {
  startDateError.value = ''
  const parsed = parseDateDMY(startDateStr.value)
  if (!parsed) {
    startDateError.value = 'Неверный формат даты'
    return
  }
  startDateParsed = parsed
}

function validateEndDate() {
  endDateError.value = ''
  const parsed = parseDateDMY(endDateStr.value)
  if (!parsed) {
    endDateError.value = 'Неверный формат даты'
    return
  }
  endDateParsed = parsed
}

// Тип графика
const chartTypeItems = [
  { title: 'Столбчатый (Stacked)', value: 'bar' },
  { title: 'Линейный график', value: 'line' },
  { title: 'Area (площадь)', value: 'area' }
]
const chartType = ref<'bar' | 'line' | 'area'>('line')

// Режим "Визиты" / "Пользователи"
const modeItems = [
  { title: 'Визиты', value: 'visits' },
  { title: 'Пользователи', value: 'users' }
]
const selectedMode = ref<'visits' | 'users'>('visits')

// Чекбоксы (метрики)
const showTrainGenerated = ref(true)
const showTrainSent = ref(true)
const showKbzhu = ref(true)
const showLikes = ref(true)
const showDonations = ref(true)

// Сырые агрегированные данные
let aggregatedData: Record<string, any> = {}

// Реактивные series и options для ApexChart
const chartSeries = ref<any[]>([])
const chartOptions = ref<any>({
  chart: {
    id: 'user-analytics',
    background: '#1e1e1e',
    foreColor: '#fff',
    stacked: false,
    toolbar: { show: true }
  },
  colors: ['#F44336', '#E91E63', '#9C27B0', '#FFC107', '#4CAF50'],
  fill: {
    colors: ['#F44336', '#E91E63', '#9C27B0', '#FFC107', '#4CAF50']
  },
  dataLabels: {
    style: {
      colors: ['#F44336', '#E91E63', '#9C27B0', '#FFC107', '#4CAF50']
    }
  },
  markers: {
    colors: ['#F44336', '#E91E63', '#9C27B0', '#FFC107', '#4CAF50']
  },
  grid: {
    row: {
      colors: ['#2e2e2e', '#3e3e3e']
    },
    column: {
      colors: ['#2e2e2e', '#3e3e3e']
    }
  },
  xaxis: {
    categories: [] as string[],
    labels: {
      rotateAlways: false,
      rotate: -45,
      hideOverlappingLabels: false,
      style: {
        colors: '#fff'
      }
    }
  },
  yaxis: {
    labels: {
      style: {
        colors: '#fff'
      },
      formatter: (val: number) => Math.round(val).toString()
    }
  },
  legend: {
    position: 'top',
    labels: {
      colors: '#fff'
    }
  }
})

function applyFilters() {
  validateStartDate()
  validateEndDate()
  if (startDateError.value || endDateError.value) {
    return
  }

  if (selectedMode.value === 'visits') {
    aggregatedData = aggregateUserData(users.value)
  } else {
    aggregatedData = aggregateUserDataLast(users.value)
  }

  const dateList = getDatesInRange(startDateParsed, endDateParsed)
  chartOptions.value.xaxis.categories = dateList.map((d: Date) => formatDayKey(d))

  const { dataForTrainGen, dataForTrainSent, dataForKbzhu, dataForLikes, dataForDonations } = buildSeriesData(dateList)

  const newSeries: Array<{ name: string; data: number[] }> = []
  if (showTrainGenerated.value) newSeries.push({ name: 'Сген. трени', data: dataForTrainGen })
  if (showTrainSent.value)      newSeries.push({ name: 'Отправл. трени', data: dataForTrainSent })
  if (showKbzhu.value)          newSeries.push({ name: 'КБЖУ', data: dataForKbzhu })
  if (showLikes.value)          newSeries.push({ name: 'Лайки', data: dataForLikes })
  if (showDonations.value)      newSeries.push({ name: 'Донаты', data: dataForDonations })

  chartOptions.value.chart.type = chartType.value
  chartOptions.value.chart.stacked = (chartType.value === 'bar')
  chartSeries.value = newSeries
}

function buildSeriesData(dateList: Date[]) {
  const dataForTrainGen: number[] = []
  const dataForTrainSent: number[] = []
  const dataForKbzhu: number[] = []
  const dataForLikes: number[] = []
  const dataForDonations: number[] = []

  for (const d of dateList) {
    const key = formatDayKey(d)
    const dayData = aggregatedData[key] || {
      trainGenerated: 0,
      trainSent: 0,
      kbzhuCount: 0,
      likesCount: 0,
      starDonations: 0
    }
    dataForTrainGen.push(dayData.trainGenerated)
    dataForTrainSent.push(dayData.trainSent)
    dataForKbzhu.push(dayData.kbzhuCount)
    dataForLikes.push(dayData.likesCount)
    dataForDonations.push(dayData.starDonations)
  }
  return { dataForTrainGen, dataForTrainSent, dataForKbzhu, dataForLikes, dataForDonations }
}

// Автоматический вызов фильтрации при изменении любых входных данных
watch(
    [
      startDateStr,
      endDateStr,
      chartType,
      selectedMode,
      showTrainGenerated,
      showTrainSent,
      showKbzhu,
      showLikes,
      showDonations
    ],
    () => {
      applyFilters()
    },
    { immediate: true }
)

onMounted(async () => {
  loading.value = true
  try {
    const data = await apiRequest<{ users: IUser[] }>('GET', 'users')
    users.value = data.users

    aggregatedData = aggregateUserData(users.value)
    applyFilters()
  } catch (err: any) {
    userError.value = 'Не удалось загрузить пользователей: ' + err.message
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* Flex-верстка для замены Vuetify grid */
.row {
  display: flex;
  flex-wrap: wrap;
  margin-left: -8px;
  margin-right: -8px;
}

.col-12 {
  flex: 0 0 100%;
  max-width: 100%;
  padding-left: 8px;
  padding-right: 8px;
}

@media (min-width: 960px) {
  .col-md-3 {
    flex: 0 0 25%;
    max-width: 25%;
  }
  .col-md-2 {
    flex: 0 0 16.66%;
    max-width: 16.66%;
  }
}

/* Выравнивание кнопки "Применить" по правому краю (скрытой) */
.button-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.chart-end-date {
  align-self: center;
  margin-left: 16px;
  color: #fff;
}

/* Стили из вашей исходной темы */
.v-application .v-card {
  background-color: #1e1e1e !important;
  color: #fff !important;
}
.v-application .v-text-field,
.v-application .v-select,
.v-application .v-checkbox {
  color: #fff;
}
.v-application .v-checkbox .v-selection-control__input input:checked + .v-selection-control__ripple::before {
  border-color: #1976d2 !important;
}

.apexcharts-menu {
  background-color: #1e1e1e !important;
  color: #fff !important;
}
.apexcharts-tooltip {
  background-color: #1e1e1e !important;
  color: #fff !important;
}
</style>
