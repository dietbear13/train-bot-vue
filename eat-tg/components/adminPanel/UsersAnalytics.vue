<template>
  <v-card class="pa-4">
    <!-- Заголовок и кнопка обновления -->
    <v-app-bar color="transparent" flat>
      <v-toolbar-title>Админ-панель: список пользователей</v-toolbar-title>
      <v-spacer />
      <v-btn color="primary" :loading="loading" @click="fetchUsers">
        <v-icon icon="mdi-reload" class="me-2" />
        Обновить
      </v-btn>
    </v-app-bar>

    <!-- Аналитическая панель (график, фильтры дат) -->
    <v-card class="mb-4 pa-4" outlined>
      <v-row align="center" justify="space-between">
        <!-- Выбор метрики -->
        <v-col cols="12" md="3">
          <v-select
              v-model="selectedMetric"
              :items="metricItems"
              label="Выберите метрику"
              variant="outlined"
              item-text="label"
              item-value="value"
          />
        </v-col>

        <!-- Фильтр: дата начала -->
        <v-col cols="12" md="4">
          <v-text-field
              v-model="startDate"
              label="Дата начала (дд.мм.гггг)"
              variant="outlined"
              :error="startDateError !== ''"
              :error-messages="[startDateError]"
              placeholder="01.01.2025"
              clearable
              @input="validateStartDate"
          />
        </v-col>

        <!-- Фильтр: дата окончания -->
        <v-col cols="12" md="4">
          <v-text-field
              v-model="endDate"
              label="Дата окончания (дд.мм.гггг)"
              variant="outlined"
              :error="endDateError !== ''"
              :error-messages="[endDateError]"
              placeholder="31.12.2025"
              clearable
              @input="validateEndDate"
          />
        </v-col>
      </v-row>

      <!-- Сам график -->
      <apexchart
          type="line"
          height="350"
          :options="chartOptions"
          :series="chartSeries"
      />
    </v-card>

    <!-- Поле поиска по Telegram ID -->
    <v-text-field
        v-model="searchId"
        label="Поиск по Telegram ID"
        clearable
        variant="outlined"
        prepend-inner-icon="mdi-magnify"
        class="my-4"
        @input="searchUser"
    />

    <!-- Таблица пользователей -->
    <v-data-table
        :headers="userHeaders"
        :items="filteredUsers"
        :items-per-page="10"
        :loading="loading"
        class="elevation-1"
        hide-default-footer
    >
      <!-- Форматирование даты добавления -->
      <template #item.dateAdded="{ item }">
        {{ formatDate(item.dateAdded) }}
      </template>

      <!-- Действия (просмотр / удалить) -->
      <template #item.actions="{ item }">
        <v-btn icon variant="text" color="primary" @click="openUserDialog(item)">
          <v-icon icon="mdi-eye" />
        </v-btn>
        <v-btn icon variant="text" color="error" @click="deleteUser(item._id)">
          <v-icon icon="mdi-delete" />
        </v-btn>
      </template>
    </v-data-table>

    <!-- Пагинация -->
    <v-pagination
        v-model="pagination.page"
        :length="pageCount"
        class="mt-4 d-flex justify-center"
    />

    <!-- Диалог редактирования пользователя -->
    <v-dialog v-model="userDialog" max-width="1000px" persistent>
      <v-card>
        <v-card-title class="text-h6">Управление пользователем</v-card-title>

        <!-- Содержимое диалога (вкладки с данными) -->
        <v-card-text v-if="selectedUser && editingUser">
          <v-tabs
              v-model="activeTab"
              align-tabs="center"
              color="deep-purple-accent-4"
              background-color="transparent"
              class="mb-4"
          >
            <v-tab value="main">Основное</v-tab>
            <v-tab value="kbzhu">История КБЖУ</v-tab>
            <v-tab value="training">История тренировок</v-tab>
            <v-tab value="referrals">Referrals</v-tab>
            <v-tab value="likes">Blog Likes</v-tab>
          </v-tabs>

          <v-tabs-window v-model="activeTab">
            <!-- Вкладка: Основное -->
            <v-tabs-window-item value="main">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                      label="Telegram ID"
                      v-model="editingUser.telegramId"
                      variant="filled"
                      readonly
                  />
                  <v-text-field
                      label="Имя (из Telegram)"
                      v-model="editingUser.firstName"
                      variant="filled"
                      readonly
                      class="mt-3"
                  />
                  <v-text-field
                      label="Фамилия (из Telegram)"
                      v-model="editingUser.lastName"
                      variant="filled"
                      readonly
                      class="mt-3"
                  />
                  <v-text-field
                      label="Username (из Telegram)"
                      v-model="editingUser.username"
                      variant="filled"
                      readonly
                      class="mt-3"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                      :items="roleItems"
                      v-model="editingUser.role"
                      label="Роль"
                      variant="filled"
                      class="mt-3"
                  />
                  <p class="mt-6">
                    <strong>Дата добавления:</strong>
                    {{ formatDate(editingUser.dateAdded) }}
                  </p>
                </v-col>
              </v-row>
            </v-tabs-window-item>

            <!-- Вкладка: История КБЖУ -->
            <v-tabs-window-item value="kbzhu">
              <v-data-table
                  :headers="kbzhuHeaders"
                  :items="editingUser.kbzhuHistory ?? []"
                  class="elevation-1"
                  dense
                  hide-default-footer
              >
                <template #item.timestamp="{ item }">
                  {{ formatTimestamp(item.timestamp) }}
                </template>
                <template #item.formData="{ item }">
                  Пол: {{ item.formData.gender }},
                  Телосложение: {{ item.formData.bodyType }},
                  Возраст: {{ item.formData.age }},
                  Рост: {{ item.formData.height }},
                  Вес: {{ item.formData.weight }},
                  Цель: {{ item.formData.goal }},
                  Тренировок: {{ item.formData.workoutsPerWeek }}
                </template>
                <template #item.kbzhuResult="{ item }">
                  Кал: {{ item.kbzhuResult.calories }},
                  Доп.ккал: {{ item.kbzhuResult.extraCalories }},
                  Б: {{ item.kbzhuResult.proteins }},
                  Ж: {{ item.kbzhuResult.fats }},
                  У: {{ item.kbzhuResult.carbs }}
                </template>
                <template #item.actions="{ item }">
                  <v-btn
                      icon
                      color="error"
                      variant="text"
                      @click="deleteKbzhuEntry(item._id)"
                  >
                    <v-icon icon="mdi-delete" />
                  </v-btn>
                </template>
              </v-data-table>
            </v-tabs-window-item>

            <!-- Вкладка: История тренировок -->
            <!-- Здесь выводим isSended внутри formData -->
            <v-tabs-window-item value="training">
              <v-data-table
                  :headers="trainingHeaders"
                  :items="editingUser.trainingHistory ?? []"
                  class="elevation-1"
                  dense
                  hide-default-footer
              >
                <!-- (1) timestamp -->
                <template #item.timestamp="{ item }">
                  {{ formatTimestamp(item.timestamp) }}
                </template>

                <!-- (2) formData -->
                <template #item.formData="{ item }">
                  Пол: {{ item.formData.gender }}<br />
                  Цель: {{ item.formData.goal }}<br />
                  Сплит: {{ item.formData.splitType }}<br />
                  ID Сплита: {{ item.formData.splitId }}<br />
                  Отправлена:
                  <strong>{{ item.isSended ? 'Отправлена' : 'Сгенерирована' }}</strong>
                </template>

                <!-- (3) actions (удалить запись) -->
                <template #item.actions="{ item }">
                  <v-btn
                      icon
                      color="error"
                      variant="text"
                      @click="deleteTrainingEntry(item._id)"
                  >
                    <v-icon icon="mdi-delete" />
                  </v-btn>
                </template>
              </v-data-table>
            </v-tabs-window-item>

            <!-- Вкладка: Referrals -->
            <v-tabs-window-item value="referrals">
              <div>
                <p v-if="editingUser.referrals && editingUser.referrals.length">
                  Список рефералов:
                </p>
                <p v-else>Нет рефералов</p>
                <ul>
                  <li
                      v-for="(ref, index) in editingUser.referrals || []"
                      :key="index"
                  >
                    {{ ref }}
                  </li>
                </ul>
              </div>
            </v-tabs-window-item>

            <!-- Вкладка: Blog Likes -->
            <v-tabs-window-item value="likes">
              <div>
                <p v-if="editingUser.blogLikes && editingUser.blogLikes.length">
                  Посты, которым пользователь поставил лайк:
                </p>
                <p v-else>Нет лайков</p>
                <ul>
                  <li
                      v-for="(like, index) in editingUser.blogLikes || []"
                      :key="index"
                  >
                    postId: {{ like.postId }} - liked: {{ like.liked }}
                    ({{ formatTimestamp(like.date) }})
                  </li>
                </ul>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>

        <!-- Прелоадер, если данные ещё не загружены -->
        <v-card-text v-else class="d-flex justify-center">
          <v-progress-circular indeterminate color="primary" />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeUserDialog">
            Закрыть
          </v-btn>
          <v-btn
              color="primary"
              variant="tonal"
              :loading="saving"
              :disabled="saving"
              @click="saveUserChanges"
          >
            <v-icon icon="mdi-content-save" class="me-2" />
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Сообщение об ошибке -->
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
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '../../stores/userStore'
import { useApi } from '../../composables/useApi'
import { useRuntimeConfig } from '#imports'

/** Пример интерфейсов — упрощённо. Подставьте свои типы в нужной детализации. */
interface IKbzhuFormData {
  gender: string
  bodyType: string
  age: number
  height: number
  weight: number
  goal: string
  workoutsPerWeek: number
}
interface IKbzhuResult {
  calories: number
  extraCalories: number
  proteins: number
  fats: number
  carbs: number
}
interface IKbzhuHistory {
  _id?: string
  formData: IKbzhuFormData
  kbzhuResult: IKbzhuResult
  timestamp: number
}

interface ITrainingFormData {
  gender: string
  goal?: string
  splitType: string
  splitId: string
}
interface ITrainingHistory {
  _id?: string
  formData: ITrainingFormData
  timestamp: number
  isSended?: boolean
}

/** Аналогично для likes, referrals, etc. */
interface IBlogLike {
  postId: string
  liked: boolean
  date: number
}
interface IReferral {
  inviteeId?: number
  date?: number
}

interface IStarDonation {
  telegramId: number
  stars: number
  timestamp: number
  _id: string
}


interface IUser {
  _id: string
  telegramId: number
  firstName?: string
  lastName?: string
  username?: string
  role: 'admin'|'freeUser'|'paidUser'
  dateAdded: number
  kbzhuHistory?: IKbzhuHistory[]
  trainingHistory?: ITrainingHistory[]
  referrals?: IReferral[]
  blogLikes?: IBlogLike[]
  starDonationHistory?: IStarDonation[]
  telegramUsername?: string
}


/** ===== Основная логика ===== */
const userStore = useUserStore()
const { apiRequest } = useApi()

const users = ref<IUser[]>([])
const loading = ref(false)
const saving = ref(false)
const userError = ref<string|null>(null)

// Поиск и пагинация
const searchId = ref('')
const filteredUsers = ref<IUser[]>([])
const pagination = ref({ page: 1 })

const pageCount = computed(() => Math.ceil(computedFilteredUsers.value.length / 10))


const userDialog = ref(false)
const selectedUser = ref<IUser|null>(null)
const editingUser = ref<IUser|null>(null)
const activeTab = ref<string>('main')

const userHeaders = [
  { title: 'Telegram ID', key: 'telegramId', width: 150 },
  { title: 'TG Username', key: 'telegramUsername', width: 150 },
  { title: 'Роль', key: 'role', width: 100 },
  { title: 'Дата Добавления', key: 'dateAdded', width: 150 },
  { title: 'Действия', key: 'actions', sortable: false, width: 100 }
]
const kbzhuHeaders = [
  { title: 'Дата (timestamp)', key: 'timestamp', width: 140 },
  { title: 'Данные формы', key: 'formData' },
  { title: 'Результат КБЖУ', key: 'kbzhuResult' },
  { title: 'Действия', key: 'actions', sortable: false, width: 80 }
]
/**
 * Внимание: тут 3 колонки, потому что
 * (1) timestamp
 * (2) formData
 * (3) actions
 *
 * Но «isSended» мы выводим в самом #item.formData
 */
const trainingHeaders = [
  { title: 'Дата (timestamp)', key: 'timestamp', width: 140 },
  { title: 'Данные формы', key: 'formData' },
  { title: 'Действия', key: 'actions', sortable: false, width: 80 }
]

const roleItems = ['admin', 'freeUser', 'paidUser']
/** ========== Метрики ========== */
const metricItems = [
  { label: 'Количество тренировок', value: 'trainingCount' },
  { label: 'Количество КБЖУ записей', value: 'kbzhuCount' },
  { label: 'Среднее количество калорий (КБЖУ)', value: 'avgCalories' },
  { label: 'Количество старта', value: 'starCount' }
]
const selectedMetric = ref('trainingCount')

/** ========== Поля для ручного ввода дат ========== */
const startDate = ref<string>('')
const endDate = ref<string>('')
const startDateError = ref('')
const endDateError = ref('')

/** Преобразованные (валидные) даты */
let startDateParsed: Date | null = null
let endDateParsed: Date | null = null

/** Валидация и парсинг дат (DD.MM.YYYY) */
function parseDateDMY(dateStr: string): Date | null {
  if (!dateStr) return null
  // Разрешаем 1 или 2 цифры в дне/месяце и 4 цифры в годе
  const match = dateStr.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!match) return null

  const [_, d, m, y] = match
  const day = parseInt(d, 10)
  const month = parseInt(m, 10)
  const year = parseInt(y, 10)

  // Простая проверка границ
  if (year < 1900 || year > 2100) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null

  const dateObj = new Date(year, month - 1, day, 0, 0, 0)
  // Доп. проверка: совпадают ли реальный день/месяц/год
  if (
      dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getDate() !== day
  ) {
    return null
  }
  return dateObj
}

function validateStartDate() {
  startDateError.value = ''
  startDateParsed = parseDateDMY(startDate.value)
  if (startDate.value && !startDateParsed) {
    startDateError.value = 'Неверный формат даты (дд.мм.гггг)'
  }
}

function validateEndDate() {
  endDateError.value = ''
  endDateParsed = parseDateDMY(endDate.value)
  if (endDate.value && !endDateParsed) {
    endDateError.value = 'Неверный формат даты (дд.мм.гггг)'
  }
}

/** График (apexchart) */
const chartSeries = ref<any[]>([])
const chartOptions = ref<any>({
  chart: {
    id: 'user-analytics',
    toolbar: { show: true }
  },
  xaxis: { categories: [] },
  title: { text: 'Аналитика пользователей', align: 'center' }
})

/** ===================== Форматирование дат для таблицы ===================== */
function formatDate(timestamp: number) {
  if (!timestamp) return '—'
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
function formatTimestamp(ts: number) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

/** Фильтр + пагинация */
const computedFilteredUsers = computed(() => {
  if (!searchId.value.trim()) return users.value
  const numId = parseInt(searchId.value.trim())
  if (!isNaN(numId)) {
    return users.value.filter(u => u.telegramId === numId)
  }
  return users.value
})
watch(computedFilteredUsers, (newVal) => {
  pagination.value.page = 1
  filteredUsers.value = newVal.slice(0, 10)
})
watch(
    () => pagination.value.page,
    (newVal) => {
      const start = (newVal - 1) * 10
      const end = start + 10
      filteredUsers.value = computedFilteredUsers.value.slice(start, end)
    }
)
function searchUser() {
  pagination.value.page = 1
}

/** Fetch Telegram user info */
async function fetchUserInfo(telegramId: number) {
  const runtimeConfig = useRuntimeConfig()
  const key = runtimeConfig.public.telegramBotApiKey
  if (!key) {
    console.error('TELEGRAM_BOT_API_KEY отсутствует в Nuxt!')
    return {}
  }
  const url = `https://api.telegram.org/bot${key}/getChat?chat_id=${telegramId}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Telegram API вернул статус ${res.status}`)
    }
    const data = await res.json()
    if (!data.ok || !data.result) {
      return {}
    }
    return {
      firstName: data.result.first_name,
      lastName: data.result.last_name,
      username: data.result.username
    }
  } catch (err) {
    console.error('fetchUserInfo Error:', err)
    return {}
  }
}

/** Загрузка пользователей */
async function fetchUsers() {
  loading.value = true
  userError.value = null
  try {
    const data = await apiRequest<{ users: IUser[] }>('GET', 'users')
    users.value = data.users
    const requests = users.value.map(async (u) => {
      const info = await fetchUserInfo(u.telegramId)
      u.telegramUsername = info.username ? `@${info.username}` : ''
    })
    await Promise.all(requests)

    filteredUsers.value = users.value.slice(0, 10)
    pagination.value.page = 1
  } catch (err: any) {
    userError.value = 'Не удалось загрузить пользователей: ' + err.message
  } finally {
    loading.value = false
  }
}

/** Открыть диалог */
function openUserDialog(user: IUser) {
  userError.value = null
  loading.value = true
  fetchUserInfo(user.telegramId)
      .then(info => {
        editingUser.value = {
          ...user,
          firstName: info.firstName ?? user.firstName,
          lastName: info.lastName ?? user.lastName,
          username: info.username ?? user.username
        }
        selectedUser.value = editingUser.value
        activeTab.value = 'main'
        userDialog.value = true
      })
      .catch(err => {
        userError.value = `Ошибка при открытии пользователя: ${err.message}`
      })
      .finally(() => {
        loading.value = false
      })
}

function closeUserDialog() {
  userDialog.value = false
  selectedUser.value = null
  editingUser.value = null
}

/** Сохранить изменения (роль) */
async function saveUserChanges() {
  if (!editingUser.value) return
  saving.value = true
  userError.value = null
  try {
    const payload = {
      role: editingUser.value.role
    }
    await apiRequest('PATCH', `users/${editingUser.value._id}`, payload)

    const idx = users.value.findIndex(u => u._id === editingUser.value?._id)
    if (idx !== -1 && editingUser.value) {
      users.value[idx].role = editingUser.value.role
    }
    closeUserDialog()
  } catch (err: any) {
    userError.value = 'Ошибка при сохранении: ' + err.message
  } finally {
    saving.value = false
  }
}

/** Удалить пользователя */
async function deleteUser(userId: string) {
  if (!confirm('Удалить пользователя?')) return
  try {
    await apiRequest('DELETE', `users/${userId}`)
    users.value = users.value.filter(u => u._id !== userId)
    filteredUsers.value = computedFilteredUsers.value.slice(0, 10)
  } catch (err: any) {
    userError.value = 'Не удалось удалить: ' + err.message
  }
}

/** Удалить запись КБЖУ */
async function deleteKbzhuEntry(kbzhuId?: string) {
  if (!editingUser.value || !kbzhuId) return
  if (!confirm('Удалить запись из КБЖУ?')) return
  try {
    await apiRequest('DELETE', `users/${editingUser.value._id}/kbzhu/${kbzhuId}`)
    editingUser.value.kbzhuHistory = editingUser.value.kbzhuHistory?.filter(e => e._id !== kbzhuId)
  } catch (err: any) {
    userError.value = 'Ошибка при удалении КБЖУ: ' + err.message
  }
}

/** Удалить запись тренировки */
async function deleteTrainingEntry(trainId?: string) {
  if (!editingUser.value || !trainId) return
  if (!confirm('Удалить запись?')) return
  try {
    await apiRequest('DELETE', `users/${editingUser.value._id}/training/${trainId}`)
    editingUser.value.trainingHistory = editingUser.value.trainingHistory?.filter(e => e._id !== trainId)
  } catch (err: any) {
    userError.value = 'Ошибка при удалении тренировки: ' + err.message
  }
}

/** При монтировании компонента */
onMounted(() => {
  if (userStore.role === 'admin') {
    fetchUsers()
  } else {
    userError.value = 'У вас нет доступа к этой странице.'
  }
})
</script>

<style scoped>
/* Под тёмную тему Vuetify 3 */
.v-application .v-card,
.v-application .v-dialog,
.v-application .v-data-table {
  background-color: #1e1e1e !important;
  color: #fff !important;
}
.v-application .v-toolbar-title {
  font-weight: 600;
  color: #fff;
}
.v-application .v-icon {
  color: #fff;
}
.v-application .v-tabs {
  background-color: transparent;
}
.v-application .v-tab {
  color: #fff;
}
.v-application .v-tab--selected {
  color: #1976d2;
  font-weight: 500;
}
</style>
