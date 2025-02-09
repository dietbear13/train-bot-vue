<!-- src/components/adminPanel/communicator/CreateEditSurveyDialog.vue -->
<template>
  <v-dialog v-model="modelValue" max-width="1000px">
    <v-card>
      <!-- Заголовок -->
      <v-card-title>
        <span v-if="internalSurvey._id">Редактирование рассылки</span>
        <span v-else>Создание рассылки</span>
      </v-card-title>

      <!-- Форма редактирования рассылки -->
      <v-card-text>
        <!-- Получатель или сохранённые фильтры -->
        <v-card-text class="text-h6">Данные получателя</v-card-text>
        <v-text-field
            label="Telegram ID (если нужно отправить одному пользователю)"
            v-model="internalSurvey.telegramId"
            type="number"
        />

        <!-- Если сохранены фильтры (для массовой рассылки), отображаем их в readonly-полях -->
        <v-row v-if="hasFilters">
          <v-col cols="12" sm="3">
            <v-text-field label="Роль" v-model="userFilters.role" readonly />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field label="Пол" v-model="userFilters.gender" readonly />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field label="Тип телосложения" v-model="userFilters.bodyType" readonly />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field label="Цель" v-model="userFilters.goal" readonly />
          </v-col>
          <!-- Если есть числовые фильтры, их тоже можно добавить -->
        </v-row>

        <v-divider class="my-3"></v-divider>

        <!-- Фильтры для массовой рассылки (редактируемые) -->
        <v-expansion-panels class="mb-4" multiple>
          <v-expansion-panel>
            <v-expansion-panel-title>
              Редактировать фильтры массовой рассылки
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                      v-model="userFilters.role"
                      :items="['admin', 'freeUser', 'paidUser', 'coach']"
                      label="Роль пользователя"
                      clearable
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                      v-model="userFilters.gender"
                      :items="['мужчина', 'женщина']"
                      label="Пол (из истории)"
                      clearable
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                      v-model="userFilters.bodyType"
                      :items="['худое', 'среднее', 'полное']"
                      label="Тип телосложения"
                      clearable
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                      v-model="userFilters.goal"
                      :items="['похудение', 'удержание', 'массонабор', 'общие']"
                      label="Цель (из истории)"
                      clearable
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                      v-model.number="userFilters.ageMin"
                      type="number"
                      label="Возраст от"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                      v-model.number="userFilters.ageMax"
                      type="number"
                      label="Возраст до"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-switch
                      v-model="userFilters.hasTrainingHistory"
                      label="Есть тренировки?"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-switch
                      v-model="userFilters.hasReferrals"
                      label="Есть рефералы?"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-switch
                      v-model="userFilters.hasStarDonations"
                      label="Есть звёздные донаты?"
                  />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Дата отправки -->
        <v-text-field
            v-model="internalSurvey.scheduledAt"
            label="Дата и время отправки (ISO)"
            helper="Например: 2025-01-05T14:00:00Z"
            :error="!isDateValid"
            error-messages="Неверный формат даты"
        />

        <!-- Сообщения рассылки -->
        <v-card-text class="text-h6">Сообщения</v-card-text>
        <div
            v-for="(msg, msgIdx) in internalSurvey.messages"
            :key="msgIdx"
            class="pa-3 mb-3"
            style="border: 1px solid #ccc; border-radius: 4px;"
        >
          <v-text-field
              label="Текст сообщения"
              v-model="msg.text"
              :error="!msg.text"
              error-messages="Текст обязателен"
          />
          <v-switch
              v-model="msg.waitForResponse"
              label="Ждать ответа перед отправкой следующего сообщения?"
          />
          <v-card-text class="text-h6">Инлайн-кнопки</v-card-text>
          <div
              v-for="(btn, bIdx) in msg.inlineButtons"
              :key="bIdx"
              class="d-flex align-center mb-2"
              style="gap: 8px;"
          >
            <v-text-field
                label="Текст кнопки"
                v-model="btn.text"
                @change="handleButtonTextChange(msgIdx, bIdx)"
            />
            <v-text-field
                label="Callback (генерируется автоматически)"
                v-model="btn.callbackData"
                readonly
            />
            <v-btn color="error" icon @click="removeButton(msgIdx, bIdx)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
          <v-btn color="primary" size="small" class="mb-2" @click="addButton(msgIdx)">
            Добавить кнопку
          </v-btn>
          <v-btn color="error" size="small" class="mt-2" @click="removeMessage(msgIdx)">
            Удалить сообщение
          </v-btn>
        </div>
        <v-btn color="secondary" @click="addMessage">Добавить сообщение</v-btn>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" @click="close">Закрыть</v-btn>
        <v-btn color="primary" @click="onSubmit">Сохранить</v-btn>
        <v-btn color="accent" @click="sendTestMessage">Тестово отправить</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useApi } from '../../../composables/useApi';

// ==== Типы данных для рассылки ====
// Добавляем _id в интерфейс сообщения для сохранённых записей
interface InlineButton {
  text: string;
  callbackData: string;
}

interface SurveyMessage {
  _id?: string; // Это поле появится после сохранения
  order: number;
  text: string;
  waitForResponse: boolean;
  inlineButtons: InlineButton[];
}

interface SurveyForm {
  _id?: string;
  telegramId?: number;
  scheduledAt: string;
  messages: SurveyMessage[];
  // Если сохраняются фильтры, можно добавить поле userFilters
  userFilters?: UserFilters;
}

// ==== Типы данных для фильтров ====
interface UserFilters {
  role?: string;
  gender?: string;
  bodyType?: string;
  goal?: string;
  ageMin?: number;
  ageMax?: number;
  hasTrainingHistory?: boolean;
  hasReferrals?: boolean;
  hasStarDonations?: boolean;
}

// ==== Упрощённый интерфейс пользователя ====
interface User {
  telegramId: number;
  role: string;
  age?: number;
  gender?: string;
  bodyType?: string;
  goal?: string;
  hasTrainingHistory?: boolean;
  hasReferrals?: boolean;
  hasStarDonations?: boolean;
}

const props = defineProps<{
  modelValue: boolean;
  editingSurvey?: SurveyForm | null;
}>();

const emits = defineEmits(['update:modelValue', 'saved']);
const { apiRequest } = useApi();

// Основное хранилище рассылки
const internalSurvey = ref<SurveyForm>({
  scheduledAt: '',
  messages: [],
  userFilters: {},
});
// Фильтры для пользователей (UI)
const userFilters = ref<UserFilters>({});

console.log('userFilters', userFilters)
// Если редактируется существующая рассылка, копируем данные из props
if (props.editingSurvey) {
  internalSurvey.value = JSON.parse(JSON.stringify(props.editingSurvey));
  // Если в редактируемой рассылке сохранены фильтры, копируем их
  if (props.editingSurvey.userFilters) {
    userFilters.value = { ...props.editingSurvey.userFilters };
  }
  updateAllCallbackData();
}


// Полный список пользователей, полученных с сервера
const allUsers = ref<User[]>([]);
const loadingUsers = ref<boolean>(false);
const filtersError = ref<boolean>(false);

// Флаг для определения, заданы ли фильтры (используется для отображения readonly-полей)
const hasFilters = computed(() => {
  const f = userFilters.value;
  return (
      f.role ||
      f.gender ||
      f.bodyType ||
      f.goal ||
      f.ageMin !== undefined ||
      f.ageMax !== undefined ||
      f.hasTrainingHistory ||
      f.hasReferrals ||
      f.hasStarDonations
  );
});

// Список текущих рассылок (если требуется отображать)
const surveys = ref<SurveyForm[]>([]);
const loadingSurveys = ref<boolean>(false);
async function fetchSurveys() {
  loadingSurveys.value = true;
  try {
    const resp = await apiRequest<SurveyForm[]>('GET', 'surveys');
    surveys.value = resp || [];
  } catch (err) {
    console.error('Ошибка получения рассылок:', err);
  } finally {
    loadingSurveys.value = false;
  }
}

// Получаем пользователей и рассылки при монтировании
onMounted(() => {
  fetchAllUsers();
  fetchSurveys();
});
async function fetchAllUsers() {
  loadingUsers.value = true;
  try {
    const resp = await apiRequest<User[]>('GET', 'users/matches');
    allUsers.value = resp || [];
  } catch (err) {
    console.error('Ошибка получения пользователей:', err);
    filtersError.value = true;
    allUsers.value = [];
  } finally {
    loadingUsers.value = false;
  }
}

// Локальная фильтрация пользователей
const filteredUsers = computed(() => {
  const filters = userFilters.value;
  const filterApplied =
      filters.role ||
      filters.gender ||
      filters.bodyType ||
      filters.goal ||
      (filters.ageMin !== undefined && filters.ageMin !== null) ||
      (filters.ageMax !== undefined && filters.ageMax !== null) ||
      filters.hasTrainingHistory ||
      filters.hasReferrals ||
      filters.hasStarDonations;
  if (!filterApplied) return [];
  return allUsers.value.filter(user => {
    if (filters.role && user.role !== filters.role) return false;
    if (filters.gender && user.gender !== filters.gender) return false;
    if (filters.bodyType && user.bodyType !== filters.bodyType) return false;
    if (filters.goal && user.goal !== filters.goal) return false;
    if (filters.ageMin !== undefined && (user.age === undefined || user.age < filters.ageMin)) return false;
    if (filters.ageMax !== undefined && (user.age === undefined || user.age > filters.ageMax)) return false;
    if (filters.hasTrainingHistory && !user.hasTrainingHistory) return false;
    if (filters.hasReferrals && !user.hasReferrals) return false;
    if (filters.hasStarDonations && !user.hasStarDonations) return false;
    return true;
  });
});

// Проверка корректности даты
const isDateValid = computed(() => {
  const d = new Date(internalSurvey.value.scheduledAt);
  return d.toString() !== 'Invalid Date';
});

// Функция автогенерации callback_data из текста кнопки
function makeCallbackDataFromText(txt: string): string {
  let result = txt.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  if (result.length > 64) result = result.substring(0, 64);
  return result;
}

// Функция обновления callback_data для всех inline-кнопок текущей рассылки
function updateAllCallbackData() {
  if (internalSurvey.value._id) {
    internalSurvey.value.messages.forEach((msg) => {
      if (msg._id) {
        msg.inlineButtons.forEach((btn) => {
          btn.callbackData = `SURVEY|${internalSurvey.value._id}|${msg._id}|${makeCallbackDataFromText(btn.text)}`;
        });
      }
    });
  }
}

// При изменении текста кнопки автоматически генерируем callback_data
function handleButtonTextChange(msgIdx: number, bIdx: number) {
  const btn = internalSurvey.value.messages[msgIdx].inlineButtons[bIdx];
  if (internalSurvey.value._id && internalSurvey.value.messages[msgIdx]._id) {
    btn.callbackData = `SURVEY|${internalSurvey.value._id}|${internalSurvey.value.messages[msgIdx]._id}|${makeCallbackDataFromText(btn.text)}`;
  } else {
    btn.callbackData = makeCallbackDataFromText(btn.text);
  }
}

// Если редактируется существующая рассылка, обновляем callback_data для всех кнопок
watch(
    () => internalSurvey.value._id,
    (newVal) => {
      if (newVal) {
        updateAllCallbackData();
      }
    }
);

// Управление сообщениями и кнопками
function addMessage() {
  internalSurvey.value.messages.push({
    order: internalSurvey.value.messages.length,
    text: '',
    waitForResponse: false,
    inlineButtons: [],
  });
}

function removeMessage(idx: number) {
  internalSurvey.value.messages.splice(idx, 1);
}

function addButton(msgIdx: number) {
  const defaultText = 'button';
  let callbackData = makeCallbackDataFromText(defaultText);
  if (internalSurvey.value._id && internalSurvey.value.messages[msgIdx]._id) {
    callbackData = `SURVEY|${internalSurvey.value._id}|${internalSurvey.value.messages[msgIdx]._id}|${callbackData}`;
  }
  internalSurvey.value.messages[msgIdx].inlineButtons.push({
    text: defaultText,
    callbackData,
  });
}

function removeButton(msgIdx: number, bIdx: number) {
  internalSurvey.value.messages[msgIdx].inlineButtons.splice(bIdx, 1);
}

// Закрыть диалог
function close() {
  emits('update:modelValue', false);
}

// Сохранение рассылки – отправляем данные, включая отфильтрованный список telegramId
async function onSubmit() {
  if (!isDateValid.value) {
    alert('Неверная дата!');
    return;
  }
  if (!internalSurvey.value.messages.length) {
    alert('Нужно добавить хотя бы одно сообщение');
    return;
  }
  if (!internalSurvey.value.telegramId && filteredUsers.value.length === 0) {
    alert('Укажите либо конкретный telegramId, либо задайте фильтры, чтобы получить пользователей');
    return;
  }
  try {
    const payload = {
      ...internalSurvey.value,
      userFilters: userFilters.value,
      filteredUsers: filteredUsers.value.map(u => u.telegramId),
    };
    if (!internalSurvey.value._id) {
      await apiRequest('POST', 'surveys', payload);
    } else {
      await apiRequest('PATCH', `surveys/${internalSurvey.value._id}`, payload);
    }
    emits('saved');
    close();
  } catch (err) {
    console.error('Ошибка при сохранении рассылки:', err);
    alert('Ошибка при сохранении, см. консоль');
  }
}

// Тестовая отправка (без сохранения)
async function sendTestMessage() {
  try {
    if (!internalSurvey.value.messages.length) {
      alert('Нет сообщений для отправки');
      return;
    }
    const target =
        internalSurvey.value.telegramId ||
        filteredUsers.value.map(u => u.telegramId);
    const payload = {
      telegramId: target,
      userFilters: userFilters.value,
      messages: internalSurvey.value.messages,
    };
    const resp = await apiRequest('POST', 'surveys/testSend', payload);
    console.log('Тестовое отправление: ответ сервера', resp);
    alert('Тестовое сообщение отправлено!');
  } catch (err) {
    console.error('Ошибка при тестовой отправке:', err);
    alert('Ошибка при тестовой отправке. Смотрите консоль.');
  }
}
</script>
