<!-- components/AdminInfo.vue -->

<template>
  <v-container fluid>
    <v-card class="pa-4">
      <!-- Поиск по Telegram ID -->
      <v-text-field
          v-model="searchId"
          label="Поиск по Telegram ID"
          @input="searchUser"
          clearable
          variant="outlined"
          prepend-icon="mdi-magnify"
          class="mb-4"
      ></v-text-field>

      <!-- Таблица пользователей -->
      <v-data-table
          :headers="combinedHeaders"
          :items="processedUsers"
          :loading="loading"
          :items-per-page="10"
          class="elevation-1"
          hide-default-footer
          dense
      >
        <!-- Шаблон для форматирования поля dateAdded -->
        <template #item.dateAdded="{ item }">
          {{ formatDate(item.dateAdded) }}
        </template>

        <!-- Шаблон для действий -->
        <template #item.actions="{ item }">
          <v-btn
              icon
              @click="viewUser(item)"
              :disabled="loading"
          >
            <v-icon>mdi-eye</v-icon>
          </v-btn>
          <!-- Добавьте другие действия (например, редактирование, удаление) здесь -->
        </template>
      </v-data-table>

      <!-- Диалог для отображения информации о пользователе -->
      <v-dialog v-model="userDialog" max-width="800px">
        <v-card>
          <v-card-title class="headline">
            Информация о Пользователе
          </v-card-title>
          <v-card-text>
            <div v-if="selectedUser">
              <!-- Основная информация -->
              <v-row>
                <v-col cols="12" sm="6">
                  <p><strong>Telegram ID:</strong> {{ selectedUser.telegramId }}</p>
                  <p><strong>Имя:</strong> {{ selectedUser.firstName || 'Не указано' }}</p>
                  <p><strong>Фамилия:</strong> {{ selectedUser.lastName || 'Не указано' }}</p>
                  <p>
                    <strong>Username:</strong>
                    <span v-if="selectedUser.username">
                      <a
                          :href="`https://t.me/${selectedUser.username}`"
                          target="_blank"
                          rel="noopener noreferrer"
                      >
                        {{ selectedUser.username }}
                      </a>
                    </span>
                    <span v-else>Не указано</span>
                  </p>
                </v-col>
                <v-col cols="12" sm="6">
                  <p><strong>Роль:</strong> {{ selectedUser.role }}</p>
                  <p><strong>Дата Добавления:</strong> {{ formatDate(selectedUser.dateAdded) }}</p>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>

              <!-- История КБЖУ -->
              <div>
                <h3>История КБЖУ</h3>
                <v-data-table
                    :headers="kbzhuHeaders"
                    :items="selectedUser.kbzhuHistory"
                    :loading="kbzhuLoading"
                    :items-per-page="5"
                    class="elevation-1"
                    hide-default-footer
                    dense
                >
                  <!-- Шаблон для форматирования поля timestamp -->
                  <template #item.timestamp="{ item }">
                    {{ formatDate(item.timestamp) }}
                  </template>
                  <template #item.gender="{ item }">
                    {{ item.formData.gender }}
                  </template>
                  <template #item.bodyType="{ item }">
                    {{ item.formData.bodyType }}
                  </template>
                  <template #item.age="{ item }">
                    {{ item.formData.age }} лет
                  </template>
                  <template #item.height="{ item }">
                    {{ item.formData.height }} см
                  </template>
                  <template #item.weight="{ item }">
                    {{ item.formData.weight }} кг
                  </template>
                  <template #item.goal="{ item }">
                    {{ item.formData.goal }}
                  </template>
                  <template #item.workoutsPerWeek="{ item }">
                    {{ item.formData.workoutsPerWeek }}
                  </template>
                  <template #item.calories="{ item }">
                    {{ item.kbzhuResult.calories }} ккал
                  </template>
                  <template #item.extraCalories="{ item }">
                    {{ item.kbzhuResult.extraCalories }} ккал
                  </template>
                  <template #item.proteins="{ item }">
                    {{ item.kbzhuResult.proteins }} г
                  </template>
                  <template #item.fats="{ item }">
                    {{ item.kbzhuResult.fats }} г
                  </template>
                  <template #item.carbs="{ item }">
                    {{ item.kbzhuResult.carbs }} г
                  </template>
                </v-data-table>
              </div>
            </div>
            <div v-else>
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" text @click="closeUserDialog">
              Закрыть
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Сообщение об ошибке -->
      <v-alert
          v-if="userError"
          type="error"
          dismissible
          class="mt-4"
          @input="userError = null"
      >
        {{ userError }}
      </v-alert>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useApi } from '~/composables/useApi';
import { useUserStore } from '~/stores/userStore';

// Интерфейсы
interface User {
  _id: string;
  telegramId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  role: 'admin' | 'freeUser' | 'paidUser';
  dateAdded: number; // Unix timestamp (секунды)
  kbzhuHistory: KbzhuHistoryEntry[];
}

interface KbzhuHistoryEntry {
  formData: FormData;
  kbzhuResult: KbzhuResult;
  timestamp: number; // Unix timestamp в миллисекундах
  _id: string;
}

interface FormData {
  gender: string;
  bodyType: string;
  age: number;
  height: number;
  weight: number;
  goal: string;
  workoutsPerWeek: number;
}

interface KbzhuResult {
  calories: number;
  extraCalories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

interface TelegramGetChatResponse {
  ok: boolean;
  result?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    // Дополнительные поля при необходимости
  };
}

const config = useRuntimeConfig();
const TELEGRAM_BOT_TOKEN = config.public.telegramBotApiKey;

// Реактивные переменные
const userStore = useUserStore();
const users = ref<User[]>([]);
const loading = ref<boolean>(false);
const userError = ref<string | null>(null);
const searchId = ref<string>('');
const filteredUsers = ref<User[]>([]);
const userDialog = ref<boolean>(false);
const selectedUser = ref<User | null>(null);
const kbzhuLoading = ref<boolean>(false);

// Заголовки таблицы пользователей
const userHeaders = [
  { text: 'Telegram ID', value: 'telegramId' },
  { text: 'Роль', value: 'role' },
  { text: 'Дата Добавления', value: 'dateAdded' },
  // KbzhuHeaders будут добавлены динамически
  { text: 'Действия', value: 'actions', sortable: false },

];

// Заголовки таблицы КБЖУ (для диалога)
const kbzhuHeaders = [
  { text: 'Дата', value: 'timestamp' },
  { text: 'Пол', value: 'gender' },
  { text: 'Телосложение', value: 'bodyType' },
  { text: 'Возраст', value: 'age' },
  { text: 'Рост (см)', value: 'height' },
  { text: 'Вес (кг)', value: 'weight' },
  { text: 'Цель', value: 'goal' },
  { text: 'Тренировок в неделю', value: 'workoutsPerWeek' },
  { text: 'Калории (ккал)', value: 'calories' },
  { text: 'Доп. Калории (ккал)', value: 'extraCalories' },
  { text: 'Белки (г)', value: 'proteins' },
  { text: 'Жиры (г)', value: 'fats' },
  { text: 'Углеводы (г)', value: 'carbs' },
];

// Динамическое объединение заголовков
const combinedHeaders = computed(() => {
  // Добавляем KbzhuHeaders к userHeaders, исключая последний элемент ('Действия')
  const kbzhuFields = [
    'gender',
    'bodyType',
    'age',
    'height',
    'weight',
    'goal',
    'workoutsPerWeek',
    'calories',
    'extraCalories',
    'proteins',
    'fats',
    'carbs',
  ];

  const kbzhuColumns = kbzhuFields.map((field) => ({
    text: getHeaderText(field),
    value: field,
  }));

  return [...userHeaders.slice(0, -1), ...kbzhuColumns, userHeaders[userHeaders.length - 1]];
});

// Функция для получения текстовых меток заголовков на русском языке
const getHeaderText = (field: string): string => {
  const mapping: Record<string, string> = {
    gender: 'Пол',
    bodyType: 'Телосложение',
    age: 'Возраст',
    height: 'Рост (см)',
    weight: 'Вес (кг)',
    goal: 'Цель',
    workoutsPerWeek: 'Тренировок в неделю',
    calories: 'Калории (ккал)',
    extraCalories: 'Доп. Калории (ккал)',
    proteins: 'Белки (г)',
    fats: 'Жиры (г)',
    carbs: 'Углеводы (г)',
  };

  return mapping[field] || field.charAt(0).toUpperCase() + field.slice(1);
};

// Обработка пользователей для отображения в таблице
const processedUsers = computed(() => {
  return filteredUsers.value.map((user) => {
    // Извлекаем последнюю запись KbzhuHistory
    const latestKbzhu = user.kbzhuHistory.reduce((latest, current) => {
      return current.timestamp > (latest?.timestamp || 0) ? current : latest;
    }, null as KbzhuHistoryEntry | null);

    return {
      ...user,
      // Добавляем поля Kbzhu
      gender: latestKbzhu ? latestKbzhu.formData.gender : '',
      bodyType: latestKbzhu ? latestKbzhu.formData.bodyType : '',
      age: latestKbzhu ? latestKbzhu.formData.age : '',
      height: latestKbzhu ? latestKbzhu.formData.height : '',
      weight: latestKbzhu ? latestKbzhu.formData.weight : '',
      goal: latestKbzhu ? latestKbzhu.formData.goal : '',
      workoutsPerWeek: latestKbzhu ? latestKbzhu.formData.workoutsPerWeek : '',
      calories: latestKbzhu ? latestKbzhu.kbzhuResult.calories : '',
      extraCalories: latestKbzhu ? latestKbzhu.kbzhuResult.extraCalories : '',
      proteins: latestKbzhu ? latestKbzhu.kbzhuResult.proteins : '',
      fats: latestKbzhu ? latestKbzhu.kbzhuResult.fats : '',
      carbs: latestKbzhu ? latestKbzhu.kbzhuResult.carbs : '',
    };
  });
});

// Используем composable для API-запросов
const { apiRequest } = useApi();

// Фильтрация пользователей на основе введённого ID
const computedFilteredUsers = computed(() => {
  if (searchId.value.trim() === '') {
    return users.value;
  }
  const id = parseInt(searchId.value);
  if (!isNaN(id)) {
    return users.value.filter((user) => user.telegramId === id);
  }
  return users.value;
});

// Обновляем filteredUsers при изменении computedFilteredUsers
watch(computedFilteredUsers, (newVal) => {
  filteredUsers.value = newVal;
});

// Получает информацию о пользователе напрямую из Telegram Bot API,
// используя getChat?chat_id={telegramId}
const fetchUserInfo = async (userId: number) => {
  // Строим URL для запроса к Telegram Bot API
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=${userId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Если статус не 200, выдаём ошибку
      throw new Error(`Telegram API ответил со статусом ${response.status}`);
    }

    // Парсим JSON
    const data: TelegramGetChatResponse = await response.json();

    // Если ответ валиден, возвращаем то, что пришло от Telegram
    if (data.ok && data.result) {
      return {
        firstName: data.result.first_name ?? 'Неизвестно',
        lastName: data.result.last_name ?? '',
        username: data.result.username ?? 'unknown',
      };
    } else {
      throw new Error('Неверный ответ от Telegram API');
    }
  } catch (error: any) {
    console.error('Ошибка при получении данных пользователя из Telegram:', error);
    throw new Error('Не удалось получить данные пользователя из Telegram.');
  }
};

// Функция для получения списка пользователей из бэкенда
const fetchUsers = async () => {
  loading.value = true;
  userError.value = null;
  try {
    // Предполагается, что у вас есть эндпоинт GET /api/users
    const data = await apiRequest('GET', 'users');
    console.log('Полученные данные пользователей:', data);

    // Проверяем, что data.users является массивом
    if (data && Array.isArray(data.users)) {
      users.value = data.users;
    } else if (Array.isArray(data)) {
      // Альтернативный случай, если API вернёт просто массив
      users.value = data;
    } else if (data && Array.isArray(data.data)) {
      // Дополнительная проверка на наличие data.data
      users.value = data.data;
    } else {
      throw new Error('Неизвестный формат данных от API');
    }

    filteredUsers.value = users.value;
  } catch (err: any) {
    console.error('Ошибка при загрузке пользователей:', err);
    userError.value = 'Не удалось загрузить пользователей.';
  } finally {
    loading.value = false;
  }
};

// Поиск пользователей по Telegram ID
const searchUser = () => {
  // Фильтрация происходит через computed
};

// При нажатии на иконку "глаз" загружаем информацию из Telegram
const viewUser = async (user: User) => {
  loading.value = true;
  userError.value = null;
  kbzhuLoading.value = true;
  try {
    const userInfo = await fetchUserInfo(user.telegramId);
    // Обновляем выбранного пользователя с дополнительными данными
    selectedUser.value = {
      ...user,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      username: userInfo.username,
      // Здесь мы не выбираем только latestKbzhu, а оставляем всю историю
    };
    userDialog.value = true;
  } catch (error: any) {
    console.error('Ошибка при загрузке информации о пользователе:', error);
    userError.value = error.message || 'Не удалось загрузить информацию о пользователе.';
  } finally {
    loading.value = false;
    kbzhuLoading.value = false;
  }
};

// Форматируем дату (timestamp в секундах) в вид "23 сентября 2024"
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Форматируем timestamp в миллисекундах для KbzhuHistory
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Закрытие диалога пользователя
const closeUserDialog = () => {
  userDialog.value = false;
  selectedUser.value = null;
};

// Загрузка пользователей при монтировании компонента, только для администраторов
onMounted(() => {
  if (userStore.role === 'admin') {
    fetchUsers().then(() => {
      console.log('Combined Headers:', combinedHeaders.value);
      console.log('Processed Users:', processedUsers.value);
    });
  } else {
    userError.value = 'У вас нет доступа к этой странице.';
  }
});
</script>

<style scoped>
/* Дополнительные стили для тёмной темы */
.dark-background {
  background-color: #121212 !important;
}

/* Стили для кнопок */
.gender-button,
.group-button {
  min-width: 45%;
}

.selected-button {
  background-color: var(--v-primary-base);
  color: white;
}

/* Стили для ссылок */
a {
  color: #1976d2;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

/* Стили для иконок */
.v-icon {
  margin-right: 4px;
}

/* Стили для таблицы */
.v-data-table {
  background-color: #1e1e1e;
}

.v-data-table-header th {
  color: #fff;
}

.v-data-table tbody tr {
  color: #fff;
}

.v-data-table .v-data-table__wrapper {
  max-height: 400px; /* Ограничение высоты таблицы */
}

/* Стили для диалога */
.v-dialog .v-card {
  background-color: #1e1e1e;
  color: #fff;
}

/* Стили для заголовка */
.headline {
  font-weight: bold;
  color: #fff;
}

/* Стили для alert */
.v-alert {
  background-color: #d32f2f;
  color: #fff;
}

/* Прочие стили */
.my-4 {
  margin-top: 16px;
  margin-bottom: 16px;
}

.v-card {
  /* Удаляем выравнивание элементов, чтобы контент отображался корректно */
  display: block;
}

.chart-container {
  max-width: 300px;
  margin: 20px auto;
}

.rounded-bottom-sheet {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
}

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
