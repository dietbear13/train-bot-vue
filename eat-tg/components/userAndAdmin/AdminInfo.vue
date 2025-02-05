<!-- AdminInfo.vue (Vuetify 3, Nuxt 3) -->
<template>
  <v-container fluid>
    <v-card class="pa-2">
      <!-- Заголовок + кнопка "Обновить" -->
      <v-app-bar color="transparent" flat>
        <v-toolbar-title>Админ-панель: список пользователей</v-toolbar-title>
        <v-spacer />
        <v-btn color="primary" :loading="loading" @click="fetchUsers">
          <v-icon icon="mdi-reload" class="me-2" />
          Обновить
        </v-btn>
      </v-app-bar>

      <!-- Поиск по Telegram ID -->
      <v-text-field
          v-model="searchId"
          label="Поиск по Telegram ID"
          clearable
          variant="outlined"
          :prepend-inner-icon="'mdi-magnify'"
          class="my-4"
          @input="searchUser"
      />

      <!-- Основная таблица (список пользователей) -->
      <v-data-table
          :headers="userHeaders"
          :items="filteredUsers"
          :items-per-page="10"
          :loading="loading"
          class="elevation-1"
          hide-default-footer
      >
        <!-- Колонка dateAdded -->
        <template #item.dateAdded="{ item }">
          {{ formatDate(item.dateAdded) }}
        </template>

        <!-- Колонка действий -->
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

          <!-- Основная часть диалога -->
          <v-card-text v-if="selectedUser && editingUser">
            <!-- Вкладки -->
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
              <!-- TAB: Основное -->
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

              <!-- TAB: История КБЖУ -->
              <v-tabs-window-item value="kbzhu">
                <v-data-table
                    :headers="kbzhuHeaders"
                    :items="editingUser.kbzhuHistory ?? []"
                    class="elevation-1"
                    dense
                    hide-default-footer
                >
                  <!-- Колонка timestamp (КБЖУ) -->
                  <template #item.timestamp="{ item }">
                    {{ formatTimestamp(item.timestamp) }}
                  </template>

                  <!-- Колонка formData (данные формы) -->
                  <template #item.formData="{ item }">
                    Пол: {{ item.formData.gender }},
                    Телосложение: {{ item.formData.bodyType }},
                    Возраст: {{ item.formData.age }},
                    Рост: {{ item.formData.height }},
                    Вес: {{ item.formData.weight }},
                    Цель: {{ item.formData.goal }},
                    Тренировок: {{ item.formData.workoutsPerWeek }}
                  </template>

                  <!-- Колонка kbzhuResult -->
                  <template #item.kbzhuResult="{ item }">
                    Кал: {{ item.kbzhuResult.calories }},
                    Доп.ккал: {{ item.kbzhuResult.extraCalories }},
                    Б: {{ item.kbzhuResult.proteins }},
                    Ж: {{ item.kbzhuResult.fats }},
                    У: {{ item.kbzhuResult.carbs }}
                  </template>

                  <!-- Колонка actions (удалить) -->
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

              <!-- TAB: История тренировок -->
              <v-tabs-window-item value="training">
                <v-data-table
                    :headers="trainingHeaders"
                    :items="editingUser.trainingHistory ?? []"
                    class="elevation-1"
                    dense
                    hide-default-footer
                >
                  <!-- 1) timestamp -->
                  <template #item.timestamp="{ item }">
                    {{ formatTimestamp(item.timestamp) }}
                  </template>

                  <!-- 2) formData -->
                  <template #item.formData="{ item }">
                    Пол: {{ item.formData.gender }}<br />
                    Цель: {{ item.formData.goal }}<br />
                    Сплит: {{ item.formData.splitType }}<br />
                    ID Сплита: {{ item.formData.splitId }}<br />
                    Отправлена: {{ item.isSended ? 'Отправлена' : 'Сгенерирована' }}
                  </template>

                  <!-- 3) actions (удалить) -->
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

              <!-- TAB: Referrals -->
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

              <!-- TAB: Blog Likes -->
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

          <!-- Прелоадер, если нет editingUser -->
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

      <!-- Ошибка, если есть -->
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
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '../../stores/userStore'
import { useApi } from '../../composables/useApi'

/** ===== Типы для КБЖУ ===== */
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

/** ===== Типы для тренировок ===== */
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
  isSended?: boolean  // <-- поле "Отправлена?"
}

/** ===== Типы для Likes / Referrals ===== */
interface IBlogLike {
  postId: string
  liked: boolean
  date: number
}
interface IReferral {
  inviteeId?: number
  date?: number
}

/** ===== Основной интерфейс IUser ===== */
interface IUser {
  _id: string
  telegramId: number
  firstName?: string
  lastName?: string
  username?: string
  role: 'admin' | 'freeUser' | 'paidUser'
  dateAdded: number
  kbzhuHistory?: IKbzhuHistory[]
  trainingHistory?: ITrainingHistory[]
  referrals?: IReferral[]
  blogLikes?: IBlogLike[]
  starDonationHistory?: any[]
  telegramUsername?: string
}

/** Тип ответа API */
interface IApiUsersResponse {
  users: IUser[]
}

/** Telegram getChat */
interface TelegramGetChatResponse {
  ok: boolean
  result?: {
    id?: number
    first_name?: string
    last_name?: string
    username?: string
  }
}

/** ===== Основная логика ===== */
const userStore = useUserStore()
const { apiRequest } = useApi()

const users = ref<IUser[]>([])
const loading = ref(false)
const saving = ref(false)
const userError = ref<string|null>(null)

// Поиск + пагинация
const searchId = ref('')
const filteredUsers = ref<IUser[]>([])
const pagination = ref({ page: 1 })
const pageCount = computed(() =>
    Math.ceil(computedFilteredUsers.value.length / 10)
)

// Диалог + выбор пользователя
const userDialog = ref(false)
const selectedUser = ref<IUser|null>(null)
const editingUser = ref<IUser|null>(null)

// Управление вкладками
const activeTab = ref<'main'|'kbzhu'|'training'|'referrals'|'likes'>('main')

/** Заголовки (Headers) таблицы пользователей */
const userHeaders = [
  { title: 'Telegram ID', key: 'telegramId', width: 150 },
  { title: 'TG Username', key: 'telegramUsername', width: 150 },
  { title: 'Роль', key: 'role', width: 100 },
  { title: 'Дата Добавления', key: 'dateAdded', width: 150 },
  { title: 'Действия', key: 'actions', sortable: false, width: 100 }
]

/** Заголовки для KБЖУ */
const kbzhuHeaders = [
  { title: 'Дата (timestamp)', key: 'timestamp', width: 140, sortable: false },
  { title: 'Данные формы', key: 'formData', sortable: false },
  { title: 'Результат КБЖУ', key: 'kbzhuResult', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false, width: 80 }
]

/** Заголовки для Тренировок (4 столбца) */
const trainingHeaders = [
  { title: 'Дата (timestamp)', key: 'timestamp', width: 140, sortable: false },
  { title: 'Данные формы', key: 'formData', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false, width: 80 }
]

const roleItems = ['admin', 'freeUser', 'paidUser']

const computedFilteredUsers = computed(() => {
  const search = searchId.value.trim()
  if (!search) return users.value
  const idAsNumber = parseInt(search)
  if (!isNaN(idAsNumber)) {
    return users.value.filter(u => u.telegramId === idAsNumber)
  }
  return users.value
})

watch(computedFilteredUsers, newVal => {
  pagination.value.page = 1
  filteredUsers.value = newVal.slice(0, 10)
})

watch(
    () => pagination.value.page,
    newVal => {
      const start = (newVal - 1) * 10
      const end = start + 10
      filteredUsers.value = computedFilteredUsers.value.slice(start, end)
    }
)

/** Сброс страницы при вводе поиска */
function searchUser() {
  pagination.value.page = 1
}

/** Дата, если dateAdded в секундах */
function formatDate(timestamp: number) {
  if (!timestamp) return '—'
  const date = new Date(timestamp)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

/** Дата в мс */
function formatTimestamp(ts: number) {
  if (!ts) return '—'
  const date = new Date(ts)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

/** Запрос к Telegram API */
async function fetchUserInfo(telegramId: number) {
  const runtimeConfig = useRuntimeConfig()
  const key = runtimeConfig.public.telegramBotApiKey
  if (!key) {
    console.error('Нет TELEGRAM_BOT_API_KEY в Nuxt!')
    return {}
  }

  const url = `https://api.telegram.org/bot${key}/getChat?chat_id=${telegramId}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Telegram API вернул статус ${res.status}`)
    }
    const data: TelegramGetChatResponse = await res.json()
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

/** Загрузка списка пользователей + usernames */
async function fetchUsers() {
  loading.value = true
  userError.value = null
  try {
    const data = await apiRequest<IApiUsersResponse>('GET', 'users')
    users.value = data.users

    // Параллельные запросы к Telegram
    const requests = users.value.map(async (user) => {
      const info = await fetchUserInfo(user.telegramId)
      user.telegramUsername = info.username ? `@${info.username}` : ''
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

/** Открыть диалог редактирования */
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

/** Закрыть диалог */
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
    const payload = { role: editingUser.value.role }
    await apiRequest('PATCH', `users/${editingUser.value._id}`, payload)

    // Отразить сразу в списке
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

/** Удалить пользователя целиком */
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

/** Удалить запись Тренировки */
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

/** При монтировании (если admin) - загружаем пользователей */
onMounted(() => {
  if (userStore.role === 'admin') {
    fetchUsers()
  } else {
    userError.value = 'У вас нет доступа к этой странице.'
  }
})
</script>

<style scoped>
/* Тёмная тема Vuetify 3 + небольшие правки */
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
