<!-- components/AdminInfo.vue -->

<template>
  <v-tabs
      v-model="activeTab"
      background-color="primary"
      dark
      grow
  >
    <v-tab>Управление пользователями</v-tab>
  </v-tabs>

  <v-tabs-window v-model="activeTab" class="pa-0">
    <!-- Вкладка управления пользователями -->
    <v-container fluid>
      <v-tabs-window-item>
        <v-card class="pa-1">
          <v-card-text>
            <v-text-field
                v-model="searchId"
                label="Поиск по Telegram ID"
                @input="searchUser"
                clearable
            ></v-text-field>

            <v-data-table
                :headers="headers"
                :items="filteredUsers"
                :loading="loading"
                class="elevation-1"
            >
              <template #item.actions="{ item }">
                <v-btn variant="text" icon @click="viewUser(item)">
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
              </template>
            </v-data-table>

            <v-dialog v-model="userDialog" max-width="500">
              <v-card>
                <v-card-title>Информация о Пользователе</v-card-title>
                <v-card-text>
                  <div v-if="selectedUser">
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
                    <p><strong>Роль:</strong> {{ selectedUser.role }}</p>
                    <p><strong>Дата Добавления:</strong> {{ formatDate(selectedUser.dateAdded) }}</p>
                  </div>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="blue darken-1" text @click="userDialog = false">Закрыть</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <v-alert v-if="userError" type="error" dismissible>{{ userError }}</v-alert>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>
    </v-container>
  </v-tabs-window>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '~/stores/userStore';

// Интерфейс для пользователя в вашей локальной базе
interface User {
  _id: string;
  telegramId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  role: 'admin' | 'freeUser' | 'paidUser';
  dateAdded: number;
}

// Ответ, который приходит напрямую от Telegram при запросе getChat
interface TelegramGetChatResponse {
  ok: boolean;
  result?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    // можно дополнять полями при необходимости
  };
}


// Храним токен в переменной окружения
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_API_KEY;

// Основные реактивные переменные
const activeTab = ref<number>(0);
const userStore = useUserStore();
const users = ref<User[]>([]);
const loading = ref(false);
const userError = ref<string | null>(null);
const searchId = ref('');
const filteredUsers = ref<User[]>([]);
const userDialog = ref(false);
const selectedUser = ref<User | null>(null);

const headers = [
  { text: 'Telegram ID', value: 'telegramId' },
  { text: 'Роль', value: 'role' },
  { text: 'Дата Добавления', value: 'dateAdded' },
  { text: 'Действия', value: 'actions', sortable: false },
];

// Фильтрация пользователей на основе введённого ID
const computedFilteredUsers = computed(() => {
  if (searchId.value) {
    const id = parseInt(searchId.value);
    if (!isNaN(id)) {
      return users.value.filter((user) => user.telegramId === id);
    }
  }
  return users.value;
});

// Сразу устанавливаем начальное значение
filteredUsers.value = computedFilteredUsers.value;

/**
 * Получает информацию о пользователе напрямую из Telegram Bot API,
 * используя getChat?chat_id={telegramId}
 */
const fetchUserInfo = async (userId: number) => {
  // Здесь мы строим URL для запроса к Telegram Bot API
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=${userId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Если статус не 200, то выдаём ошибку или возвращаем заглушку
      console.error('Ошибка при обращении к Telegram API:', response.status);
      return { first_name: 'Неизвестно', last_name: '', username: 'unknown' };
    }

    // Парсим JSON
    const data: TelegramGetChatResponse = await response.json();

    // Если ответ валиден, возвращаем то, что пришло от Telegram
    if (data.ok && data.result) {
      return {
        first_name: data.result.first_name ?? 'Неизвестно',
        last_name: data.result.last_name ?? '',
        username: data.result.username ?? 'unknown',
      };
    } else {
      return {
        first_name: 'Неизвестно',
        last_name: '',
        username: 'unknown',
      };
    }
  } catch (error: any) {
    console.error('Ошибка при получении данных пользователя из Telegram:', error);
    return { first_name: 'Неизвестно', last_name: '', username: 'unknown' };
  }
};

// Вместо вашего API — используем локальную логику.
// Предположим, что загрузка массива users идёт из локального хранилища, файла или другого места.
const fetchUsers = async () => {
  loading.value = true;
  userError.value = null;
  try {
    // Здесь логика загрузки списка пользователей.
    // К примеру, вы можете заменить на реальный запрос к вашей базе данных или написать mock-данные.
    // Для примера используем фиктивные пользователи:
    users.value = [
      {
        _id: '1',
        telegramId: 123456789,
        role: 'admin',
        dateAdded: Math.floor(Date.now() / 1000),
      },
      {
        _id: '2',
        telegramId: 987654321,
        role: 'freeUser',
        dateAdded: Math.floor(Date.now() / 1000),
      },
    ];
    filteredUsers.value = users.value;
  } catch (err: any) {
    console.error('Ошибка при загрузке пользователей:', err);
    userError.value = 'Не удалось загрузить пользователей.';
  } finally {
    loading.value = false;
  }
};

// Фильтрация пользователей по вводимому ID
const searchUser = () => {
  const id = parseInt(searchId.value);
  if (!isNaN(id)) {
    filteredUsers.value = users.value.filter((user) => user.telegramId === id);
  } else {
    filteredUsers.value = users.value;
  }
};

// При нажатии на иконку "глаз" загружаем информацию из Telegram
const viewUser = async (user: User) => {
  loading.value = true;
  try {
    const userInfo = await fetchUserInfo(user.telegramId);
    selectedUser.value = {
      ...user,
      firstName: userInfo.first_name,
      lastName: userInfo.last_name,
      username: userInfo.username,
    };
    userDialog.value = true;
  } catch (error) {
    console.error('Ошибка при загрузке информации о пользователе:', error);
    userError.value = 'Не удалось загрузить информацию о пользователе.';
  } finally {
    loading.value = false;
  }
};

// Форматируем дату (timestamp в секундах) в удобочитаемую
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

onMounted(() => {
  // Загрузка пользователей только для администраторов
  if (userStore.role === 'admin') {
    fetchUsers();
  }
});
</script>

<style scoped>
.my-4 {
  margin-top: 16px;
  margin-bottom: 16px;
}

.v-card {
  display: flex;
  align-items: center;
}

.headline {
  font-weight: bold;
}

a {
  color: #1976d2;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

v-icon {
  margin-right: 4px;
}
</style>
