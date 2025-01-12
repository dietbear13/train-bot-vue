<!-- components/AdminInfo.vue -->

<template>
    <v-tabs
        v-model="activeTab"
        background-color="primary"
        dark
        grow
    >
      <v-tab>Публикация поста</v-tab>
      <v-tab>Управление пользователями</v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab" class="pa-0">
      <!-- Вкладка публикации поста -->
      <v-tabs-window-item>
        <v-container fluid>
          <v-form ref="postForm" @submit.prevent="submitPost">
            <!-- Выбор канала -->
            <v-autocomplete
                v-model="selectedChannel"
                :items="channels"
                variant="outlined"
                hint="none"
                item-text="title"
                item-value="id"
                label="Выберите канал"
                required
                class="my-0"
                @change="checkBotAccess"
                :persistent-hint="false"
            ></v-autocomplete>

            <!-- Сообщение о проверке доступа -->
            <v-alert
                v-if="!hasAccess"
                type="error"
                dismissible
            >
              У бота нет доступа к этому каналу. Добавьте бота в администраторы канала.
            </v-alert>

            <!-- Выбор темы поста -->
            <v-select
                v-model="postTopic"
                :items="topics"
                label="Тема поста"
                required
                class="my-0"
                variant="outlined"
                :persistent-hint="false"
            ></v-select>

            <!-- Заголовок поста -->
            <v-text-field
                v-model="postTitle"
                label="Заголовок поста"
                required
                class="my-0"
                variant="outlined"
                :persistent-hint="false"
            ></v-text-field>

            <!-- Кастомная панель форматирования -->
            <v-card class="mt-0" outlined>
              <v-card-text>
                <v-btn
                    icon
                    @click="applyFormatting('bold')"
                    title="Жирный ( *текст* )"
                    variant="text"
                >
                  <v-icon class="ml-2">mdi-format-bold</v-icon>
                </v-btn>
                <v-btn
                    icon
                    @click="applyFormatting('italic')"
                    title="Курсив ( _текст_ )"
                    variant="text"
                >
                  <v-icon class="ml-2">mdi-format-italic</v-icon>
                </v-btn>
                <v-btn
                    icon
                    @click="applyFormatting('underline')"
                    title="Подчеркивание ( __текст__ )"
                    variant="text"
                >
                  <v-icon class="ml-2">mdi-format-underline</v-icon>
                </v-btn>
                <v-btn
                    icon
                    @click="applyFormatting('strikethrough')"
                    title="Зачёркивание ( ~текст~ )"
                    variant="text"
                >
                  <v-icon class="ml-2">mdi-format-strikethrough</v-icon>
                </v-btn>
                <v-btn
                    icon
                    @click="applyFormatting('code')"
                    title="Код ( `текст` )"
                    variant="text"
                >
                  <v-icon class="ml-2">mdi-code-tags</v-icon>
                </v-btn>
                <v-btn
                    icon
                    @click="applyFormatting('code-block')"
                    title="Блок кода ( ```код``` )"
                    variant="text"
                >
                  <v-icon class="ml-2">mdi-code-brackets</v-icon>
                </v-btn>
                <v-btn
                    icon
                    @click="applyFormatting('spoiler')"
                    title="Скрытый текст ( ||текст|| )"
                    variant="text"
                >
                  <v-icon class="ml-2">mdi-eye-off</v-icon>
                </v-btn>
                <v-btn
                    icon
                    @click="applyLink"
                    title="Ссылка ( [текст](url) )"
                    variant="text"
                >
                  <v-icon class="ml-2">mdi-link-variant</v-icon>
                </v-btn>
                <!-- Добавьте другие кнопки форматирования по необходимости -->
              </v-card-text>
            </v-card>

            <!-- Текстовое поле для ввода сообщения -->
            <v-textarea
                v-model="postBody"
                label="Тело поста"
                variant="outlined"
                required
                class="mb-1"
                rows="10"
                auto-grow
                :persistent-hint="false"
            ></v-textarea>

            <!-- Ссылка на картинку -->
            <v-text-field
                v-model="imageUrl"
                variant="outlined"
                label="Ссылка на картинку"
                prepend-inner-icon="mdi-image"
                class="my-0"
                :persistent-hint="false"
            ></v-text-field>

            <!-- Время публикации -->
            <v-radio-group
                v-model="publishNow"
                class="my-1"
            >
              <v-radio
                  label="Публиковать сейчас"
                  :value="true"
              ></v-radio>
              <v-radio
                  label="Запланировать публикацию"
                  :value="false"
              ></v-radio>
            </v-radio-group>

            <v-menu
                v-model="datePicker"
                :close-on-content-click="false"
                :nudge-right="40"
                transition="scale-transition"
                offset-y
                min-width="auto"
            >
              <template #activator="{ props }">
                <v-text-field
                    v-if="!publishNow"
                    v-model="scheduledTime"
                    label="Дата и время публикации"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="props"
                ></v-text-field>
              </template>
              <v-date-picker
                  v-model="selectedDate"
                  @input="saveDate"
                  no-title
              >
                <v-spacer></v-spacer>
                <v-btn
                    text
                    color="primary"
                    @click="datePicker = false"
                >
                  Отмена
                </v-btn>
                <v-btn
                    text
                    color="primary"
                    @click="saveDate"
                >
                  ОК
                </v-btn>
              </v-date-picker>
            </v-menu>

            <!-- Кнопка отправки -->
            <v-btn
                color="primary"
                type="submit"
                :disabled="!canSubmit"
                class="my-2"
            >
              Опубликовать
            </v-btn>

            <!-- Сообщения об успехе/ошибке -->
            <v-alert
                v-if="successMessage"
                type="success"
                dismissible
                class="my-2"
            >
              {{ successMessage }}
            </v-alert>

            <v-alert
                v-if="errorMessage"
                type="error"
                dismissible
                class="my-2"
            >
              {{ errorMessage }}
            </v-alert>
          </v-form>
        </v-container>
      </v-tabs-window-item>

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
                        <a :href="`https://t.me/${selectedUser.username}`" target="_blank" rel="noopener noreferrer">
                          {{ selectedUser.username }}
                        </a>
                      </span>
                      <span v-else>Не указано</span>
                    </p>
                    <p><strong>Роль:</strong> {{ selectedUser.role }}</p>
                    <p><strong>Дата Добавления:</strong> {{ formatDate(selectedUser.dateAdded) }}</p>
                    <!-- Добавьте другие поля по необходимости -->
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

    <!-- Диалог для ввода ссылки -->
    <v-dialog v-model="linkDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Вставить ссылку</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
              v-model="linkURL"
              label="URL"
              type="url"
              required
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeLinkDialog">Отмена</v-btn>
          <v-btn color="primary" @click="insertLink">Вставить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '~/stores/userStore';
import { useApi } from '~/composables/useApi';

// Интерфейсы
interface Channel {
  id: string;
  title: string;
}

interface TopicEmojis {
  [key: string]: string;
}

interface TopicHashtags {
  [key: string]: string;
}

interface User {
  _id: string;
  telegramId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  role: 'admin' | 'freeUser' | 'paidUser';
  dateAdded: number;
  // Добавьте другие поля по необходимости
}

interface TelegramUserInfo {
  first_name?: string;
  last_name?: string;
  username?: string;
  // Добавьте другие поля, если необходимо
}

const { apiRequest } = useApi();

// Реактивные переменные для первой вкладки (публикация поста)
const activeTab = ref<number>(0);
const selectedChannel = ref<string | null>(null);
const channels = ref<Channel[]>([]);
const hasAccess = ref<boolean>(true);
const postTopic = ref<string>('');
const topics: string[] = ['Питание', 'Тренировки', 'Здоровье'];
const postTitle = ref<string>('');
const postBody = ref<string>('');
const imageUrl = ref<string>('');
const publishNow = ref<boolean>(true);
const datePicker = ref<boolean>(false);
const scheduledTime = ref<string>('');
const selectedDate = ref<string>('');
const successMessage = ref<string>('');
const errorMessage = ref<string>(''); // Исправлено

// Диалог для ввода ссылки
const linkDialog = ref<boolean>(false);
const linkURL = ref<string>('');

// Реактивные переменные для второй вкладки (управление пользователями)
const userStore = useUserStore();

const users = ref<User[]>([]);
const loading = ref(false);
const userError = ref<string | null>(null); // Переименовали error в userError
const searchId = ref('');
const filteredUsers = ref<User[]>([]);
const userDialog = ref(false); // Переименовали dialog в userDialog
const selectedUser = ref<User | null>(null);

const headers = [
  { text: 'Telegram ID', value: 'telegramId' },
  { text: 'Роль', value: 'role' },
  { text: 'Дата Добавления', value: 'dateAdded' },
  { text: 'Действия', value: 'actions', sortable: false },
];

// Соответствие эмодзи и хэштегов темам
const topicEmojis: TopicEmojis = {
  безТега: '🏻',
  Тренировки: '🏋',
  Питание: '🍏',
};

const topicHashtags: TopicHashtags = {
  безТега: '',
  Тренировки: '#тренировки',
  Питание: '#питание',
};

// Вычисляемые свойства
const canSubmit = computed(() => {
  return (
      selectedChannel.value &&
      hasAccess.value &&
      postTopic.value &&
      postTitle.value &&
      postBody.value
  );
});

// Фильтрация пользователей на основе поиска (для второй вкладки)
const computedFilteredUsers = computed(() => {
  if (searchId.value) {
    const id = parseInt(searchId.value);
    if (!isNaN(id)) {
      return users.value.filter((user) => user.telegramId === id);
    }
  }
  return users.value;
});

// Автоматическая фильтрация
filteredUsers.value = computedFilteredUsers.value;

// Методы для первой вкладки
const checkBotAccess = async () => {
  if (!selectedChannel.value) {
    hasAccess.value = false;
    return;
  }

  try {
    // Проверяем доступ бота к каналу через API
    const response = await apiRequest<{ hasAccess: boolean }>('post', 'check-bot-access', {
      channelId: selectedChannel.value,
    });
    hasAccess.value = response.hasAccess;
  } catch (error: any) {
    console.error('Ошибка при проверке доступа бота:', error);
    hasAccess.value = false;
    errorMessage.value = 'Не удалось проверить доступ бота к каналу.';
  }
};

const saveDate = () => {
  scheduledTime.value = selectedDate.value;
  datePicker.value = false;
};

/**
 * Функция для экранирования всех специальных символов MarkdownV2,
 * включая символы для скрытого текста ||текст||.
 */
const escapeMarkdownV2 = (text: string): string => {
  // Регулярное выражение для поиска ссылок [текст](url)
  const regex = /\[([^\]]+)\\]\(([^)]+)\)/g;

  // Функция для экранирования текста
  const escapeText = (str: string) => {
    return str.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
  };

  // Обработка ссылок
  const escapedText = text.replace(regex, (match, p1, p2) => {
    const escapedP1 = escapeText(p1);
    return `[${escapedP1}](${p2})`;
  });

  // Экранирование скрытого текста ||текст|| и остальных символов
  return escapedText
      .replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1') // Общие символы
      .replace(/\|\|/g, '\\|\\|'); // Обработка скрытого текста
};

/**
 * Функция для экранирования хэштегов
 */
const escapeHashtags = (hashtags: string): string => {
  return escapeMarkdownV2(hashtags);
};

const submitPost = async () => {
  try {
    // Формируем содержимое поста без экранирования на клиенте
    const emoji = topicEmojis[postTopic.value] || '';
    const hashtags = topicHashtags[postTopic.value] || '';
    const formattedPost = `${emoji} ${postTitle.value}\n${postBody.value}\n\n[Генератор тренировок](https://t.me/freeload_top_bot)\n\n${hashtags}`;

    // Подготавливаем данные для отправки на сервер
    const payload = {
      channelId: selectedChannel.value,
      postContent: formattedPost,
      imageUrl: imageUrl.value,
      publishNow: publishNow.value,
      scheduledTime: publishNow.value ? null : new Date(scheduledTime.value).toISOString(),
    };

    // Отправляем данные через API
    await apiRequest('post', 'publish-post', payload);

    successMessage.value = 'Пост успешно опубликован!';
    errorMessage.value = '';
    // Сбрасываем форму
    resetForm();
  } catch (error: any) {
    console.error('Ошибка при публикации поста:', error);
    errorMessage.value = 'Ошибка при публикации поста на серверах.';
    successMessage.value = '';
  }
};

const resetForm = () => {
  postTitle.value = '';
  postBody.value = '';
  imageUrl.value = '';
  publishNow.value = true;
  scheduledTime.value = '';
  selectedDate.value = '';
};

// Получаем доступные каналы (в которых бот является администратором)
const fetchChannels = async () => {
  try {
    const response = await apiRequest<{ channels: Channel[] }>('get', 'get-channels');
    channels.value = response.channels;
  } catch (error: any) {
    console.error('Ошибка при получении каналов:', error);
    errorMessage.value = 'Не удалось получить список каналов с серверов.';
  }
};

// Методы для второй вкладки (управление пользователями)

// Функция для получения информации о пользователе из Telegram API через сервер
const fetchUserInfo = async (userId: number): Promise<TelegramUserInfo> => {
  try {
    const response = await apiRequest<TelegramUserInfo>('post', 'get-user-info', {
      telegramId: userId,
    });

    if (response) {
      console.log('Данные пользователя из Telegram API:', response);
      return response;
    } else {
      console.error('Нет данных в ответе от Telegram API');
      return { first_name: 'Неизвестно', last_name: '', username: 'unknown' };
    }
  } catch (error: any) {
    console.error('Ошибка при получении данных пользователя:', error.message);
    return { first_name: 'Неизвестно', last_name: '', username: 'unknown' };
  }
};

const fetchUsers = async () => {
  loading.value = true;
  userError.value = null;
  try {
    const response = await apiRequest<{ users: User[] }>('get', 'users', null, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_TELEGRAM_BOT_API_KEY}`,
      },
    });
    users.value = response.users;
    filteredUsers.value = users.value;
  } catch (err: any) {
    console.error('Ошибка при загрузке пользователей:', err);
    userError.value = 'Не удалось загрузить пользователей.';
  } finally {
    loading.value = false;
  }
};

const searchUser = () => {
  const id = parseInt(searchId.value);
  if (!isNaN(id)) {
    filteredUsers.value = users.value.filter((user) => user.telegramId === id);
  } else {
    filteredUsers.value = users.value;
  }
};

const viewUser = async (user: User) => {
  loading.value = true;
  try {
    // Загружаем данные пользователя из Telegram API через серверный эндпоинт
    const userInfo = await fetchUserInfo(user.telegramId);

    // Обновляем данные выбранного пользователя
    selectedUser.value = {
      ...user,
      firstName: userInfo.first_name || 'Не указано',
      lastName: userInfo.last_name || 'Не указано',
      username: userInfo.username || 'Не указано',
    };
    userDialog.value = true;
  } catch (error) {
    console.error('Ошибка при загрузке информации о пользователе:', error);
    userError.value = 'Не удалось загрузить информацию о пользователе.';
  } finally {
    loading.value = false;
  }
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

// Загрузка данных при монтировании компонента
onMounted(() => {
  fetchChannels();

  // Загрузка пользователей только для администраторов
  if (userStore.role === 'admin') {
    fetchUsers();
  }
});

// Функции форматирования (остаются без изменений)
const applyFormatting = (type: string) => {
  const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = postBody.value.slice(start, end);
  let formattedText = selectedText;

  switch (type) {
    case 'bold':
      formattedText = `*${selectedText}*`;
      break;
    case 'italic':
      formattedText = `_${selectedText}_`;
      break;
    case 'underline':
      formattedText = `__${selectedText}__`;
      break;
    case 'strikethrough':
      formattedText = `~${selectedText}~`;
      break;
    case 'code':
      formattedText = `\`${selectedText}\``;
      break;
    case 'code-block':
      formattedText = `\`\`\`${selectedText}\`\`\``;
      break;
    case 'spoiler':
      formattedText = `||${selectedText}||`;
      break;
      // Добавьте другие типы форматирования по необходимости
    default:
      break;
  }

  // Обновляем значение текста с примененным форматированием
  postBody.value =
      postBody.value.substring(0, start) +
      formattedText +
      postBody.value.substring(end);

  // Устанавливаем курсор после вставленного текста
  textarea.selectionStart = textarea.selectionEnd = start + formattedText.length;
};

const applyLink = () => {
  const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = postBody.value.slice(start, end);

  if (selectedText.length === 0) {
    alert('Выделите текст для вставки ссылки.');
    return;
  }

  // Открываем диалог для ввода URL
  linkDialog.value = true;
};

const insertLink = () => {
  if (!linkURL.value) {
    alert('Введите URL.');
    return;
  }

  const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = postBody.value.slice(start, end);
  const formattedText = `[${selectedText}](${linkURL.value})`;

  // Обновляем значение текста с вставленной ссылкой
  postBody.value =
      postBody.value.substring(0, start) +
      formattedText +
      postBody.value.substring(end);

  // Устанавливаем курсор после вставленной ссылки
  textarea.selectionStart = textarea.selectionEnd = start + formattedText.length;

  // Закрываем диалог и очищаем URL
  linkDialog.value = false;
  linkURL.value = '';
};

const closeLinkDialog = () => {
  linkDialog.value = false;
  linkURL.value = '';
};
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

/* Добавьте стили по необходимости */
a {
  color: #1976d2; /* Цвет ссылки (соответствует основному цвету Vuetify) */
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

v-icon {
  margin-right: 4px;
}
</style>
