<!-- components/adminPanel/communicator/EditSurveyDialog.vue -->
<template>
  <v-dialog v-model="modelValue" max-width="1000px">
    <v-card>
      <!-- Заголовок всегда "Редактирование рассылки" -->
      <v-card-title>Редактирование рассылки</v-card-title>

      <!-- Форма редактирования рассылки -->
      <v-card-text>
        <!-- Данные получателя -->
        <v-card-text class="text-h6">Данные получателя</v-card-text>
        <v-text-field
            label="Telegram ID (если нужно отправить одному пользователю)"
            v-model="internalSurvey.telegramId"
            type="number"
            variant="outlined"
        />

        <!-- Отображение сохранённых фильтров (если есть) -->
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

        <v-divider class="my-3"></v-divider>

        <!-- Редактируемые фильтры массовой рассылки -->
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
            variant="outlined"
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
            <!-- При редактировании кнопки пользователь может изменить только её текст -->
            <v-text-field
                label="Текст кнопки"
                v-model="btn.text"
                variant="outlined"
            />
            <!-- Поле для callbackData только для отображения; оно readonly, сервер сгенерирует значение -->
            <v-text-field
                label="Callback (будет сгенерировано на сервере)"
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
import { ref, computed, onMounted, watch } from 'vue';
import { useApi } from '../../../composables/useApi';

// Определяем интерфейс SurveyForm с обязательными полями
interface SurveyForm {
  _id?: string;
  scheduledAt: string;
  messages: SurveyMessage[];
  telegramId?: number;
  userFilters?: UserFilters;
}

interface SurveyMessage {
  _id?: string;
  order: number;
  text: string;
  waitForResponse: boolean;
  inlineButtons: InlineButton[];
}

interface InlineButton {
  text: string;
  callbackData: string;
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

// Обновляем тип props так, чтобы editingSurvey мог быть Partial (или пустым)
const props = defineProps<{ modelValue: boolean; editingSurvey: Partial<SurveyForm> | null }>();
const emits = defineEmits(['update:modelValue', 'saved']);
const { apiRequest } = useApi();

// Внутреннее состояние редактируемой рассылки с дефолтными значениями
const internalSurvey = ref<SurveyForm>({
  scheduledAt: '',
  messages: [],
  telegramId: undefined,
  userFilters: {}
});
const userFilters = ref<UserFilters>({});

// Функция для копирования данных в локальное состояние
function loadSurveyData(surveyData: Partial<SurveyForm> | null) {
  // Если переданный объект пуст или null – ничего не делаем
  if (!surveyData || Object.keys(surveyData).length === 0) {
    return;
  }
  // Для безопасности копируем через JSON (или можно использовать structuredClone)
  internalSurvey.value = JSON.parse(JSON.stringify(surveyData));
  if (surveyData.userFilters) {
    userFilters.value = { ...surveyData.userFilters };
  }
  // Теперь сервер сгенерирует callbackData, поэтому здесь ничего не делаем с inlineButtons
}

// При инициализации загружаем данные из props
loadSurveyData(props.editingSurvey);

/**
 * Если в props передан _id редактируемой рассылки,
 * запрашиваем с сервера актуальные данные по данному _id
 */
async function fetchSurvey() {
  if (props.editingSurvey && props.editingSurvey._id) {
    try {
      const freshData = await apiRequest('GET', `surveys/${props.editingSurvey._id}`);
      if (freshData) {
        loadSurveyData(freshData);
      }
    } catch (err) {
      console.error('Ошибка получения свежих данных рассылки:', err);
    }
  }
}

// При монтировании, если редактируется существующая рассылка, получаем свежие данные
onMounted(() => {
  if (props.editingSurvey && props.editingSurvey._id) {
    fetchSurvey();
  }
});

// Если props.editingSurvey изменяется, обновляем локальное состояние и запрашиваем актуальные данные
watch(() => props.editingSurvey, (newVal) => {
  loadSurveyData(newVal);
  if (newVal && newVal._id) {
    fetchSurvey();
  }
});

// Флаг наличия фильтров
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

// Функция добавления нового сообщения
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

// Функция добавления новой кнопки – callbackData оставляем пустым, сервер сгенерирует его
function addButton(msgIdx: number) {
  const defaultText = 'button';
  internalSurvey.value.messages[msgIdx].inlineButtons.push({
    text: defaultText,
    callbackData: ''
  });
}

function removeButton(msgIdx: number, bIdx: number) {
  internalSurvey.value.messages[msgIdx].inlineButtons.splice(bIdx, 1);
}

function close() {
  emits('update:modelValue', false);
}

// Получение списка пользователей для фильтрации
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
    await apiRequest('PATCH', `surveys/${internalSurvey.value._id}`, payload);
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
    console.log('target', target)

    const payload = {
      telegramId: target,
      userFilters: userFilters.value,
      messages: internalSurvey.value.messages,
    };
    console.log('payload', payload)

    await apiRequest('POST', 'surveys/testSend', payload);
    alert('Тестовое сообщение отправлено!');
  } catch (err) {
    console.error('Ошибка при тестовой отправке:', err);
    alert('Ошибка при тестовой отправке. Смотрите консоль.');
  }
}

fetchAllUsers();
</script>
