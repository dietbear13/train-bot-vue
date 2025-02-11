<!-- components/adminPanel/communicator/CreateSurveyDialog.vue -->
<template>
  <v-dialog v-model="modelValue" max-width="1000px">
    <v-card>
      <!-- Заголовок всегда "Создание рассылки" -->
      <v-card-title>Создание рассылки</v-card-title>

      <!-- Форма создания рассылки -->
      <v-card-text>
        <!-- Данные получателя -->
        <v-card-text class="text-h6">Данные получателя</v-card-text>
        <v-text-field
            label="Telegram ID (если нужно отправить одному пользователю)"
            v-model="internalSurvey.telegramId"
            type="number"
        />

        <v-divider class="my-3"></v-divider>
        <!-- Если есть фильтры для массовой рассылки -->
        <v-row v-if="hasFilters">
          <v-col cols="12" sm="3">
            <v-text-field
                label="Роль"
                v-model="userFilters.role"
                readonly
                variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
                label="Пол"
                v-model="userFilters.gender"
                readonly
                variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
                label="Тип телосложения"
                v-model="userFilters.bodyType"
                readonly
                variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
                label="Цель"
                v-model="userFilters.goal"
                readonly
                variant="outlined"
            />
          </v-col>
        </v-row>

        <!-- Редактируемые фильтры для массовой рассылки -->
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
                      variant="outlined"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                      v-model="userFilters.gender"
                      :items="['мужчина', 'женщина']"
                      label="Пол (из истории)"
                      clearable
                      variant="outlined"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                      v-model="userFilters.bodyType"
                      :items="['худое', 'среднее', 'полное']"
                      label="Тип телосложения"
                      clearable
                      variant="outlined"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                      v-model="userFilters.goal"
                      :items="['похудение', 'удержание', 'массонабор', 'общие']"
                      label="Цель (из истории)"
                      clearable
                      variant="outlined"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                      v-model.number="userFilters.ageMin"
                      type="number"
                      label="Возраст от"
                      variant="outlined"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                      v-model.number="userFilters.ageMax"
                      type="number"
                      label="Возраст до"
                      variant="outlined"
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

        <!-- Список пользователей, отфильтрованных локально -->
        <div class="mb-4">
          <v-card-text class="text-h6">Список пользователей по фильтрам</v-card-text>
          <div v-if="loadingUsers" class="d-flex justify-center my-3">
            <v-progress-circular indeterminate />
          </div>
          <div v-else>
            <div v-if="filteredUsers.length">
              <div class="mb-2">
                Под текущие фильтры подходит пользователей:
                <strong>{{ filteredUsers.length }}</strong>
              </div>
              <v-table dense>
                <thead>
                <tr>
                  <th>Telegram ID</th>
                  <th>Роль</th>
                  <th>Возраст</th>
                  <th>Пол</th>
                  <th>Тип телосложения</th>
                  <th>Цель</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="user in filteredUsers" :key="user.telegramId">
                  <td>{{ user.telegramId }}</td>
                  <td>{{ user.role }}</td>
                  <td>{{ user.age ?? '—' }}</td>
                  <td>{{ user.gender ?? '—' }}</td>
                  <td>{{ user.bodyType ?? '—' }}</td>
                  <td>{{ user.goal ?? '—' }}</td>
                </tr>
                </tbody>
              </v-table>
            </div>
            <div v-else class="my-3">
              <span>Нет пользователей, удовлетворяющих текущим фильтрам.</span>
            </div>
          </div>
          <div v-if="filtersError" class="red--text mt-2">
            Ошибка при загрузке данных пользователей.
          </div>
        </div>


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
              variant="outlined"
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
                variant="outlined"
            />
            <v-text-field
                label="Callback (генерируется автоматически)"
                v-model="btn.callbackData"
                variant="outlined"
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
import { ref, computed } from 'vue';
import { useApi } from '../../../composables/useApi';

// ==== Интерфейсы данных для рассылки ====
interface InlineButton {
  text: string;
  callbackData: string;
}

interface SurveyMessage {
  _id?: string;
  order: number;
  text: string;
  waitForResponse: boolean;
  inlineButtons: InlineButton[];
}

interface SurveyForm {
  _id?: string;
  scheduledAt: string;
  messages: SurveyMessage[];
  telegramId?: number;
  userFilters?: UserFilters;
}

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

const props = defineProps<{ modelValue: boolean }>();
const emits = defineEmits(['update:modelValue', 'saved']);
const { apiRequest } = useApi();

// Инициализация пустой рассылки
const internalSurvey = ref<SurveyForm>({
  _id: '',
  scheduledAt: '',
  messages: [],
  userFilters: {},
});
const userFilters = ref<UserFilters>({});

// Флаг наличия заданных фильтров (отображается в readonly-полях, если уже заданы)
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

// Проверка корректности даты
const isDateValid = computed(() => {
  const d = new Date(internalSurvey.value.scheduledAt);
  return d.toString() !== 'Invalid Date';
});

// Автогенерация callback_data из текста кнопки
function makeCallbackDataFromText(txt: string): string {
  let result = txt.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  if (result.length > 64) result = result.substring(0, 64);
  return result;
}

function updateAllCallbackData() {
  if (internalSurvey.value._id) {
    internalSurvey.value.messages.forEach((msg) => {
      if (msg._id) {
        msg.inlineButtons.forEach((btn) => {
          btn.callbackData = `SURVEY|${internalSurvey.value._id}|${msg._id}|q_t_${makeCallbackDataFromText(btn.text)}`;
        });
      }
    });
  }
}

// Функция для копирования данных в локальное состояние
function loadSurveyData(surveyData: SurveyForm | null) {
  if (surveyData) {
    internalSurvey.value = JSON.parse(JSON.stringify(surveyData));
    if (surveyData.userFilters) {
      userFilters.value = { ...surveyData.userFilters };
    }
    updateAllCallbackData();
  }
}


function handleButtonTextChange(msgIdx: number, bIdx: number) {
  const btn = internalSurvey.value.messages[msgIdx].inlineButtons[bIdx];
  if (internalSurvey.value._id && internalSurvey.value.messages[msgIdx]._id) {
    btn.callbackData = `SURVEY|${internalSurvey.value._id}|${internalSurvey.value.messages[msgIdx]._id}|q:test:${makeCallbackDataFromText(btn.text)}`;
  } else {
    btn.callbackData = makeCallbackDataFromText(btn.text);
  }
}

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
  const callbackData = makeCallbackDataFromText(defaultText);
  internalSurvey.value.messages[msgIdx].inlineButtons.push({
    text: defaultText,
    callbackData,
  });
}

function removeButton(msgIdx: number, bIdx: number) {
  internalSurvey.value.messages[msgIdx].inlineButtons.splice(bIdx, 1);
}

function close() {
  emits('update:modelValue', false);
}

// Получение списка пользователей для фильтрации (используется для проверки при сохранении)
const allUsers = ref<any[]>([]);
const loadingUsers = ref<boolean>(false);
const filtersError = ref<boolean>(false);

async function fetchAllUsers() {
  loadingUsers.value = true;
  try {
    const resp = await apiRequest<any[]>('GET', 'users/matches');
    allUsers.value = resp || [];
  } catch (err) {
    console.error('Ошибка получения пользователей:', err);
    filtersError.value = true;
    allUsers.value = [];
  } finally {
    loadingUsers.value = false;
  }
}

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
    await apiRequest('POST', 'surveys', payload);
    emits('saved');
    close();
  } catch (err) {
    console.error('Ошибка при сохранении рассылки:', err);
    alert('Ошибка при сохранении, см. консоль');
  }
}

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
    await apiRequest('POST', 'surveys/testSend', payload);
    alert('Тестовое сообщение отправлено!');
  } catch (err) {
    console.error('Ошибка при тестовой отправке:', err);
    alert('Ошибка при тестовой отправке. Смотрите консоль.');
  }
}

// Получаем пользователей сразу после инициализации
fetchAllUsers();
</script>
