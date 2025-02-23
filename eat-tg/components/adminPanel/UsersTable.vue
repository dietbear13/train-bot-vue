<template>
  <div>
    <!-- Поиск по telegramId (при необходимости) -->
    <v-text-field
        v-model="searchId"
        label="Поиск по Telegram ID"
        variant="outlined"
        class="mb-4"
    />

    <!-- Таблица пользователей -->
    <v-data-table
        :headers="userHeaders"
        :items="pagedUsers"
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
    <v-dialog v-model="userDialog" persistent max-width="900px">
      <v-card>
        <v-card-title class="text-h6">Управление пользователем</v-card-title>

        <v-card-text v-if="selectedUser && editingUser">
          <!-- Табы -->
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
            <v-tab value="stars">Star Donations</v-tab>
            <v-tab value="surveys">Survey Callbacks</v-tab>
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
                  Тренировок в неделю: {{ item.formData.workoutsPerWeek }}
                </template>
                <template #item.kbzhuResult="{ item }">
                  Калории: {{ item.kbzhuResult.calories }},
                  Белки: {{ item.kbzhuResult.proteins }},
                  Жиры: {{ item.kbzhuResult.fats }},
                  Углеводы: {{ item.kbzhuResult.carbs }}
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
            <v-tabs-window-item value="training">
              <v-data-table
                  :headers="trainingHeaders"
                  :items="editingUser.trainingHistory ?? []"
                  class="elevation-1"
                  dense
                  hide-default-footer
              >
                <template #item.timestamp="{ item }">
                  {{ formatTimestamp(item.timestamp) }}
                </template>
                <template #item.formData="{ item }">
                  Пол: {{ item.formData.gender }}<br />
                  Цель: {{ item.formData.goal }}<br />
                  Тип сплита: {{ item.formData.splitType }}<br />
                  Отправлена: <strong>{{ item.isSended ? 'Да' : 'Нет' }}</strong>
                </template>
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
                    postId: {{ like.postId }} —
                    liked: {{ like.liked ? 'Да' : 'Нет' }}
                    ({{ formatTimestamp(like.date) }})
                  </li>
                </ul>
              </div>
            </v-tabs-window-item>

            <!-- Вкладка: Star Donations -->
            <v-tabs-window-item value="stars">
              <div>
                <p
                    v-if="editingUser.starDonationHistory && editingUser.starDonationHistory.length"
                >
                  История донатов (звёзд):
                </p>
                <p v-else>Нет пожертвований</p>

                <v-data-table
                    :items="editingUser.starDonationHistory || []"
                    :headers="starHeaders"
                    dense
                    hide-default-footer
                    class="elevation-1 mt-3"
                >
                  <template #item.timestamp="{ item }">
                    {{ formatTimestamp(item.timestamp) }}
                  </template>
                </v-data-table>
              </div>
            </v-tabs-window-item>

            <!-- Вкладка: Survey Callbacks -->
            <v-tabs-window-item value="surveys">
              <div>
                <p
                    v-if="editingUser.surveyCallbacks && editingUser.surveyCallbacks.length"
                >
                  Обратные вызовы опросов:
                </p>
                <p v-else>Нет данных</p>

                <v-data-table
                    :items="editingUser.surveyCallbacks || []"
                    :headers="surveyHeaders"
                    dense
                    hide-default-footer
                    class="elevation-1 mt-3"
                >
                  <template #item.callbackAt="{ item }">
                    {{ formatDateTime(item.callbackAt) }}
                  </template>
                </v-data-table>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>

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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios' // NEW: импортируем axios
import { useUserStore } from '../../stores/userStore'
import { useApi } from '../../composables/useApi'

/** Ожидаем, что ключ бота лежит в process.env.TELEGRAM_BOT_API_KEY */
const TELEGRAM_BOT_API_KEY = process.env.TELEGRAM_BOT_API_KEY

interface IUser {
  _id: string
  telegramId: number
  firstName?: string
  lastName?: string
  username?: string
  role: 'admin' | 'freeUser' | 'paidUser'
  dateAdded: number
  kbzhuHistory?: Array<{
    _id: string
    timestamp: number
    formData: {
      gender: string
      bodyType: string
      age: number
      height: number
      weight: number
      goal: string
      workoutsPerWeek: number
    }
    kbzhuResult: {
      calories: number
      extraCalories?: number
      proteins: number
      fats: number
      carbs: number
    }
  }>
  trainingHistory?: Array<{
    _id: string
    timestamp: number
    isSended?: boolean
    formData: {
      gender: string
      goal: string
      splitType?: string
      splitId?: string
      // ... и т.д.
    }
  }>
  referrals?: string[]
  blogLikes?: Array<{
    postId: string
    liked: boolean
    date: number
    _id?: string
  }>
  starDonationHistory?: Array<{
    telegramId: number
    stars: number
    timestamp: number
    _id: string
  }>
  surveyCallbacks?: Array<{
    surveyId: string
    messageId: string
    userChoice: string
    callbackAt: string
    _id: string
  }>
}

const userStore = useUserStore()
const { apiRequest } = useApi()

/** Локальный стейт */
const users = ref<IUser[]>([])
const loading = ref(false)
const saving = ref(false)
const userError = ref<string|null>(null)

/** Пагинация и поиск */
const pagination = ref({ page: 1 })
const searchId = ref('')
const filteredUsers = computed(() => {
  if (!searchId.value.trim()) return users.value
  const numId = parseInt(searchId.value.trim())
  if (!isNaN(numId)) {
    return users.value.filter(u => u.telegramId === numId)
  }
  return users.value
})
const pageCount = computed(() => Math.ceil(filteredUsers.value.length / 10))
const pagedUsers = computed(() => {
  const start = (pagination.value.page - 1) * 10
  return filteredUsers.value.slice(start, start + 10)
})
watch(
    () => pagination.value.page,
    () => {
      // просто реагируем на изменение страницы
    }
)

/** Заголовки таблиц */
const userHeaders = [
  { title: 'Telegram ID', key: 'telegramId', width: 150 },
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
const trainingHeaders = [
  { title: 'Дата (timestamp)', key: 'timestamp', width: 140 },
  { title: 'Данные формы', key: 'formData' },
  { title: 'Действия', key: 'actions', sortable: false, width: 80 }
]
const starHeaders = [
  { title: 'Telegram ID', key: 'telegramId', width: 140 },
  { title: 'Stars', key: 'stars', width: 60 },
  { title: 'Дата (timestamp)', key: 'timestamp', width: 140 }
]
const surveyHeaders = [
  { title: 'Survey ID', key: 'surveyId' },
  { title: 'Message ID', key: 'messageId' },
  { title: 'Ответ пользователя', key: 'userChoice' },
  { title: 'Время', key: 'callbackAt' }
]

const roleItems = ['admin', 'freeUser', 'paidUser']

/** Диалог и выбор пользователя */
const userDialog = ref(false)
const selectedUser = ref<IUser|null>(null)
const editingUser = ref<IUser|null>(null)
const activeTab = ref<string>('main')

/** При открытии диалога грузим данные из Telegram (если есть ключ бота и корректный telegramId) */
async function openUserDialog(user: IUser) {
  selectedUser.value = user
  editingUser.value = JSON.parse(JSON.stringify(user)) // копия


  // NEW: Пытаемся подтянуть реальные имя/фамилию/username из Телеграма
  if (TELEGRAM_BOT_API_KEY && user.telegramId) {
    try {
      await fetchTelegramUserData(user.telegramId)
    } catch (err: any) {
      console.warn('Ошибка при запросе к TG API:', err.message)
    }
  }

  userDialog.value = true
}

/** Запрос к Telegram API, чтобы получить getChat(...) */
async function fetchTelegramUserData(telegramId: number) {
  console.log('📌 TELEGRAM_BOT_API_KEY, telegramId:', TELEGRAM_BOT_API_KEY, telegramId)
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_API_KEY}/getChat?chat_id=${telegramId}`
  const response = await axios.get(url)
  console.log('📌 response:', response)

  if (response.data?.ok && response.data.result) {
    const result = response.data.result
    // Заполняем поля в editingUser
    if (editingUser.value) {
      editingUser.value.firstName = result.first_name ?? ''
      editingUser.value.lastName = result.last_name ?? ''
      editingUser.value.username = result.username ?? ''
    }
  }
}

function closeUserDialog() {
  userDialog.value = false
  selectedUser.value = null
  editingUser.value = null
}

/** Пример сохранения изменений (меняем роль) */
async function saveUserChanges() {
  if (!editingUser.value) return
  saving.value = true
  userError.value = null
  try {
    const payload = {
      role: editingUser.value.role
      // Вы можете также сохранить firstName/lastName/username, если захотите
      // но по условию они не хранятся в БД, значит, не нужно
    }
    await apiRequest('PATCH', `users/${editingUser.value._id}`, payload)

    // Обновляем локально
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

/** Удаление пользователя */
async function deleteUser(userId: string) {
  if (!confirm('Удалить пользователя?')) return
  try {
    await apiRequest('DELETE', `users/${userId}`)
    users.value = users.value.filter(u => u._id !== userId)
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
  if (!confirm('Удалить запись тренировки?')) return
  try {
    await apiRequest('DELETE', `users/${editingUser.value._id}/training/${trainId}`)
    editingUser.value.trainingHistory = editingUser.value.trainingHistory?.filter(e => e._id !== trainId)
  } catch (err: any) {
    userError.value = 'Ошибка при удалении тренировки: ' + err.message
  }
}

/** Форматирование дат */
function formatDate(timestamp: number) {
  if (!timestamp) return '—'
  // У нас dateAdded вроде бы в секундах, умножим на 1000
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
function formatTimestamp(ts: number) {
  if (!ts) return '—'
  // kbzhuHistory и др. timestamps в миллисекундах
  const d = new Date(ts)
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
function formatDateTime(str: string) {
  if (!str) return '—'
  const d = new Date(str)
  return d.toLocaleString('ru-RU')
}

onMounted(async () => {
  loading.value = true
  try {
    // Загружаем список пользователей
    const data = await apiRequest<{ users: IUser[] }>('GET', 'users')
    users.value = data.users
  } catch (err: any) {
    userError.value = 'Не удалось загрузить пользователей: ' + err.message
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.v-application .v-data-table {
  background-color: #1e1e1e !important;
  color: #fff !important;
}
</style>
