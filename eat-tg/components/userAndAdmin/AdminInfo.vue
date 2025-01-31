<!-- AdminInfo.vue (Vuetify 3, Nuxt 3) -->
<template>
  <v-container fluid>
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

      <!-- Поле поиска по Telegram ID -->
      <v-text-field
          v-model="searchId"
          label="Поиск по Telegram ID"
          clearable
          variant="outlined"
          :prepend-inner-icon="'mdi-magnify'"
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
      >
        <!-- Вывод dateAdded -->
        <template #item.dateAdded="{ item }">
          {{ formatDate(item.dateAdded) }}
        </template>

        <!-- Действия (глаз / удалить) -->
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

          <!-- Основное содержимое диалога -->
          <v-card-text v-if="selectedUser && editingUser">
            <!-- Первый блок вкладок (только названия вкладок) -->
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

            <!-- Второй блок заменён на v-tabs-window -->
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

              <!-- TAB: История тренировок -->
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
                    Сплит: {{ item.formData.splitType }}<br />
                    ID Сплита: {{ item.formData.splitId }}
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

          <!-- Прелоадер, если selectedUser ещё не загрузился -->
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
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { useApi } from '~/composables/useApi'

/** ====== Типы ====== */
interface IKbzhuFormData {
  gender: string;
  bodyType: string;
  age: number;
  height: number;
  weight: number;
  goal: string;
  workoutsPerWeek: number;
}
interface IKbzhuResult {
  calories: number;
  extraCalories: number;
  proteins: number;
  fats: number;
  carbs: number;
}
interface IKbzhuHistory {
  _id?: string;
  formData: IKbzhuFormData;
  kbzhuResult: IKbzhuResult;
  timestamp: number; // в миллисекундах
}

interface ITrainingFormData {
  gender: string;
  splitType: string;
  splitId: string;
}
interface ITrainingHistory {
  _id?: string;
  formData: ITrainingFormData;
  timestamp: number;
}

interface IBlogLike {
  postId: number;
  liked: boolean;
  date: number;
}

interface IUser {
  _id: string;
  telegramId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  role: 'admin' | 'freeUser' | 'paidUser';
  dateAdded: number;
  kbzhuHistory?: IKbzhuHistory[];
  trainingHistory?: ITrainingHistory[];
  referrals?: string[];
  blogLikes?: IBlogLike[];
}

interface IApiUsersResponse {
  users: IUser[];
}

interface TelegramGetChatResponse {
  ok: boolean;
  result?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
}

/** ====== Основная логика ====== */
const userStore = useUserStore();
const { apiRequest } = useApi();

const users = ref<IUser[]>([]);
const loading = ref(false);
const saving = ref(false);
const userError = ref<string|null>(null);

// Для поиска / пагинации
const searchId = ref('');
const filteredUsers = ref<IUser[]>([]);
const pagination = ref({ page: 1 });
const pageCount = computed(() => Math.ceil(filteredUsers.value.length / 10));

// Диалог + выбранный пользователь
const userDialog = ref(false);
const selectedUser = ref<IUser|null>(null);
// editingUser — копия, которую редактируем
const editingUser = ref<IUser|null>(null);

// Текущая вкладка
const activeTab = ref<string>('main');

// Заголовки для таблиц
const userHeaders = [
  { text: 'Telegram ID', value: 'telegramId', width: 150 },
  { text: 'Роль', value: 'role', width: 100 },
  { text: 'Дата Добавления', value: 'dateAdded', width: 150 },
  { text: 'Действия', value: 'actions', sortable: false, width: 100 },
];

const kbzhuHeaders = [
  { text: 'Дата (timestamp)', value: 'timestamp', width: 140 },
  { text: 'Данные формы', value: 'formData' },
  { text: 'Результат КБЖУ', value: 'kbzhuResult' },
  { text: 'Действия', value: 'actions', sortable: false, width: 80 },
];

const trainingHeaders = [
  { text: 'Дата (timestamp)', value: 'timestamp', width: 140 },
  { text: 'Данные формы', value: 'formData' },
  { text: 'Действия', value: 'actions', sortable: false, width: 80 },
];

const roleItems = ['admin', 'freeUser', 'paidUser'];

/** ====== Computed & Watch ====== */
const computedFilteredUsers = computed(() => {
  const search = searchId.value.trim();
  if (!search) return users.value;
  const idNum = parseInt(search);
  if (!isNaN(idNum)) {
    return users.value.filter(u => u.telegramId === idNum);
  }
  return users.value; // Или поиск по другим критериям
});

watch(computedFilteredUsers, (newVal) => {
  // При изменении фильтра сбрасываем пагинацию
  pagination.value.page = 1;
  filteredUsers.value = newVal.slice(0, 10);
});

// Следим за сменой страницы
watch(
    () => pagination.value.page,
    (newPage) => {
      const start = (newPage - 1) * 10;
      const end = start + 10;
      filteredUsers.value = computedFilteredUsers.value.slice(start, end);
    }
);

/** ====== Методы ====== */
function searchUser() {
  // При любом вводе сбрасываем страницу
  pagination.value.page = 1;
}

function formatDate(timestamp: number) {
  if (!timestamp) return '—';
  const date = new Date(timestamp * 1000); // если timestamp в секундах
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTimestamp(ts: number) {
  if (!ts) return '—';
  const date = new Date(ts); // тут предполагаем, что ts в мс
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function fetchUserInfo(telegramId: number) {
  try {
    const key = useRuntimeConfig().public.telegramBotApiKey;
    const url = `https://api.telegram.org/bot${key}/getChat?chat_id=${telegramId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Telegram API вернул статус ${res.status}`);
    const data: TelegramGetChatResponse = await res.json();
    if (!data.ok || !data.result) return {};
    return {
      firstName: data.result.first_name,
      lastName: data.result.last_name,
      username: data.result.username,
    };
  } catch (err) {
    console.error('fetchUserInfo Error:', err);
    return {};
  }
}

async function fetchUsers() {
  loading.value = true;
  userError.value = null;
  try {
    const data = await apiRequest<IApiUsersResponse>('GET', 'users');
    users.value = data.users;
    filteredUsers.value = users.value.slice(0, 10);
    pagination.value.page = 1;
  } catch (err: any) {
    userError.value = 'Не удалось загрузить пользователей: ' + err.message;
  } finally {
    loading.value = false;
  }
}

function openUserDialog(user: IUser) {
  userError.value = null;
  loading.value = true;
  fetchUserInfo(user.telegramId)
      .then(info => {
        // Создаём копию
        editingUser.value = {
          ...user,
          firstName: info.firstName ?? user.firstName,
          lastName: info.lastName ?? user.lastName,
          username: info.username ?? user.username,
        };
        selectedUser.value = editingUser.value;
        activeTab.value = 'main';
        userDialog.value = true;
      })
      .catch(err => {
        userError.value = `Ошибка при открытии пользователя: ${err.message}`;
      })
      .finally(() => {
        loading.value = false;
      });
}

function closeUserDialog() {
  userDialog.value = false;
  selectedUser.value = null;
  editingUser.value = null;
}

async function saveUserChanges() {
  if (!editingUser.value) return;
  saving.value = true;
  userError.value = null;
  try {
    const payload = {
      role: editingUser.value.role,
      // добавьте другие поля, если хотите редактировать
    };
    await apiRequest('PATCH', `users/${editingUser.value._id}`, payload);
    // Обновляем в списке
    const idx = users.value.findIndex(u => u._id === editingUser.value?._id);
    if (idx !== -1 && editingUser.value) {
      users.value[idx].role = editingUser.value.role;
    }
    closeUserDialog();
  } catch (err: any) {
    userError.value = 'Ошибка при сохранении: ' + err.message;
  } finally {
    saving.value = false;
  }
}

async function deleteUser(userId: string) {
  if (!confirm('Удалить пользователя?')) return;
  try {
    await apiRequest('DELETE', `users/${userId}`);
    users.value = users.value.filter(u => u._id !== userId);
    filteredUsers.value = computedFilteredUsers.value.slice(0, 10);
  } catch (err: any) {
    userError.value = 'Не удалось удалить: ' + err.message;
  }
}

async function deleteKbzhuEntry(kbzhuId?: string) {
  if (!editingUser.value || !kbzhuId) return;
  if (!confirm('Удалить запись из КБЖУ?')) return;
  try {
    await apiRequest('DELETE', `users/${editingUser.value._id}/kbzhu/${kbzhuId}`);
    editingUser.value.kbzhuHistory = editingUser.value.kbzhuHistory?.filter(e => e._id !== kbzhuId);
  } catch (err: any) {
    userError.value = 'Ошибка при удалении КБЖУ: ' + err.message;
  }
}

async function deleteTrainingEntry(trainId?: string) {
  if (!editingUser.value || !trainId) return;
  if (!confirm('Удалить запись из тренировок?')) return;
  try {
    await apiRequest('DELETE', `users/${editingUser.value._id}/training/${trainId}`);
    editingUser.value.trainingHistory = editingUser.value.trainingHistory?.filter(e => e._id !== trainId);
  } catch (err: any) {
    userError.value = 'Ошибка при удалении тренировки: ' + err.message;
  }
}

/** Хук onMounted */
onMounted(() => {
  if (userStore.role === 'admin') {
    fetchUsers();
  } else {
    userError.value = 'У вас нет доступа к этой странице.';
  }
});
</script>

<style scoped>
/* Пример под тёмную тему Vuetify 3 + небольшие правки */
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
