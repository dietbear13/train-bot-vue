<!-- adminPanel/communicator/CreateEditSurveyDialog.vue -->

<template>
  <v-dialog v-model="modelValue" max-width="800px">
    <v-card>
      <v-card-title>
        <span v-if="internalSurvey._id">Редактирование рассылки</span>
        <span v-else>Создание рассылки</span>
      </v-card-title>

      <v-card-text>
        <!-- Блок выбора получателя: либо telegramId, либо фильтры -->
        <v-subheader>Получатель</v-subheader>

        <!-- Telegram ID одного пользователя -->
        <v-text-field
            label="Telegram ID (если нужно отправить одному пользователю)"
            v-model="internalSurvey.telegramId"
            type="number"
        />

        <!-- Критерии фильтрации -->
        <v-expansion-panels class="mb-4" value="1">
          <v-expansion-panel>
            <v-expansion-panel-title>Настройки массовой рассылки (Фильтры)</v-expansion-panel-title>
            <v-expansion-panel-text>
              <!-- Расширенный пример фильтров -->
              <v-row>
                <!-- Роль (role) -->
                <v-col cols="12" sm="6">
                  <v-select
                      v-model="userFilters.role"
                      :items="['admin', 'user', 'coach']"
                      label="Роль пользователя"
                      :clearable="true"
                  />
                </v-col>

                <!-- Пол (gender) - данные из kbzhuHistory.formData.gender -->
                <v-col cols="12" sm="6">
                  <v-select
                      v-model="userFilters.gender"
                      :items="['мужчина', 'женщина']"
                      label="Пол (из kbzhuHistory)"
                      :clearable="true"
                  />
                </v-col>

                <!-- Тип телосложения (bodyType) -->
                <v-col cols="12" sm="6">
                  <v-select
                      v-model="userFilters.bodyType"
                      :items="['худое', 'среднее', 'полное']"
                      label="Тип телосложения"
                      :clearable="true"
                  />
                </v-col>

                <!-- Цель (goal) -->
                <v-col cols="12" sm="6">
                  <v-select
                      v-model="userFilters.goal"
                      :items="['похудение', 'удержание', 'массонабор', 'общие']"
                      label="Цель (из kbzhuHistory)"
                      :clearable="true"
                  />
                </v-col>

                <!-- Возраст -->
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
              </v-row>

              <!-- Здесь вы можете добавить и другие критерии
                   (например, фильтр по trainingHistory, по blogLikes и т.д.) -->

              <!-- Отображаем статистику -->
              <div v-if="matchingUsersCount !== null" class="mt-3">
                Под текущие фильтры подходит пользователей:
                <strong>{{ matchingUsersCount }}</strong>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Дата и время отправки -->
        <v-text-field
            v-model="internalSurvey.scheduledAt"
            label="Дата и время отправки (ISO)"
            helper="Например: 2025-01-05T14:00:00Z"
            :error="!isDateValid"
            error-messages="Неверный формат даты"
        />

        <!-- Сообщения рассылки -->
        <v-subheader>Сообщения</v-subheader>
        <div
            v-for="(msg, msgIdx) in internalSurvey.messages"
            :key="msgIdx"
            class="pa-3 mb-3"
            style="border: 1px solid #ccc; border-radius: 4px;"
        >
          <!-- Текст сообщения -->
          <v-text-field
              label="Текст сообщения"
              v-model="msg.text"
              :error="!msg.text"
              error-messages="Текст обязателен"
          />

          <!-- Ждать ли ответа? -->
          <v-switch
              v-model="msg.waitForResponse"
              label="Ждать ответа перед отправкой следующего сообщения?"
          />

          <!-- Список инлайн-кнопок -->
          <v-subheader>Инлайн-кнопки</v-subheader>
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
                label="Callback"
                v-model="btn.callbackData"
            />
            <v-btn color="error" icon @click="removeButton(msgIdx, bIdx)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
          <v-btn
              color="primary"
              size="small"
              class="mb-2"
              @click="addButton(msgIdx)"
          >
            Добавить кнопку
          </v-btn>

          <v-btn
              color="error"
              size="small"
              class="mt-2"
              @click="removeMessage(msgIdx)"
          >
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
import { ref, watch, computed } from 'vue';
import { useApi } from '~/composables/useApi';

// ==== Типы данных ====
interface InlineButton {
  text: string;
  callbackData: string;
}

interface SurveyMessage {
  order: number;
  text: string;
  waitForResponse: boolean;
  inlineButtons: InlineButton[];
}

interface SurveyForm {
  _id?: string;
  telegramId?: number;      // если нужен конкретный пользователь
  filters?: string;         // JSON-строка с критериями
  scheduledAt: string;      // дата/время в ISO
  messages: SurveyMessage[];
}

// Возможные поля для фильтра
interface UserFilters {
  role?: string;             // ['admin', 'user', 'coach']
  gender?: string;           // ['мужчина','женщина'] - из kbzhuHistory.formData.gender
  bodyType?: string;         // ['худое','среднее','полное']
  goal?: string;             // ['похудение','удержание','массонабор','общие']
  ageMin?: number;
  ageMax?: number;
  // Можно расширять дальше, например, по trainingHistory, blogLikes и т.д.
}

// ==== Пропсы и эмиты ====
const props = defineProps<{
  modelValue: boolean;
  editingSurvey?: SurveyForm | null;
}>();

const emits = defineEmits(['update:modelValue', 'saved']);

// ==== Основные хранилища ====
const { apiRequest } = useApi();

const internalSurvey = ref<SurveyForm>({
  scheduledAt: '',
  messages: [],
});

// Удобный объект для UI-фильтров
const userFilters = ref<UserFilters>({});

// Кол-во подходящих пользователей
const matchingUsersCount = ref<number | null>(null);
// Ошибка (например, при парсинге или запросе)
const filtersError = ref<boolean>(false);

// === При открытии диалога ===
function getCurrentISODate() {
  return new Date().toISOString().slice(0, 19) + 'Z';
}

watch(
    () => props.editingSurvey,
    (newVal) => {
      if (!newVal) {
        // Создаём новую рассылку
        internalSurvey.value = {
          scheduledAt: getCurrentISODate(),
          messages: [],
        };
        userFilters.value = {};
        matchingUsersCount.value = null;
        filtersError.value = false;
      } else {
        // Редактируем существующую
        internalSurvey.value = JSON.parse(JSON.stringify(newVal)) as SurveyForm;
        try {
          userFilters.value = internalSurvey.value.filters
              ? JSON.parse(internalSurvey.value.filters)
              : {};
        } catch (err) {
          userFilters.value = {};
        }
        matchingUsersCount.value = null;
        filtersError.value = false;
        fetchMatchingUsersCount();
      }
    },
    { immediate: true }
);

// === Автоматическое обновление JSON-фильтра при изменении userFilters ===
let filtersTimeout: ReturnType<typeof setTimeout> | null = null;

watch(
    userFilters,
    () => {
      try {
        internalSurvey.value.filters = JSON.stringify(userFilters.value);
        filtersError.value = false;
        clearTimeout(filtersTimeout as number);
        filtersTimeout = setTimeout(fetchMatchingUsersCount, 400);
      } catch (err) {
        filtersError.value = true;
      }
    },
    { deep: true }
);

// === Запрос на сервер за количеством подходящих пользователей ===
async function fetchMatchingUsersCount() {
  if (!internalSurvey.value.filters) {
    matchingUsersCount.value = null;
    filtersError.value = false;
    return;
  }
  try {
    const resp = await apiRequest('GET', 'users/matchCount', {
      params: { filters: internalSurvey.value.filters },
    });
    matchingUsersCount.value = resp.count ?? 0;
  } catch (err) {
    matchingUsersCount.value = null;
    filtersError.value = true;
  }
}

// === Валидация даты ===
const isDateValid = computed(() => {
  const d = new Date(internalSurvey.value.scheduledAt);
  return d.toString() !== 'Invalid Date';
});

// === Закрыть диалог ===
function close() {
  emits('update:modelValue', false);
}

// === Сохранение рассылки ===
async function onSubmit() {
  if (!isDateValid.value) {
    alert('Неверная дата!');
    return;
  }
  if (!internalSurvey.value.messages.length) {
    alert('Нужно добавить хотя бы одно сообщение');
    return;
  }
  const noTelegramId = !internalSurvey.value.telegramId;
  const noFilters = !internalSurvey.value.filters;
  if (noTelegramId && noFilters) {
    alert('Укажите либо конкретный telegramId, либо задайте фильтры для массовой рассылки');
    return;
  }
  try {
    if (!internalSurvey.value._id) {
      // создание
      await apiRequest('POST', 'surveys', internalSurvey.value);
    } else {
      // редактирование
      await apiRequest('PATCH', `surveys/${internalSurvey.value._id}`, internalSurvey.value);
    }
    emits('saved');
    close();
  } catch (err) {
    console.error('Ошибка при сохранении рассылки:', err);
    alert('Ошибка при сохранении, см. консоль');
  }
}

// === Управление сообщениями ===
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

// === Управление кнопками ===
function addButton(msgIdx: number) {
  internalSurvey.value.messages[msgIdx].inlineButtons.push({
    text: '',
    callbackData: '',
  });
}

function removeButton(msgIdx: number, bIdx: number) {
  internalSurvey.value.messages[msgIdx].inlineButtons.splice(bIdx, 1);
}

function makeCallbackDataFromText(txt: string): string {
  return txt
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\p{L}\p{N}_]+/giu, '');
}

function handleButtonTextChange(msgIdx: number, bIdx: number) {
  const btn = internalSurvey.value.messages[msgIdx].inlineButtons[bIdx];
  btn.callbackData = makeCallbackDataFromText(btn.text);
}

// === Тестовая отправка (без сохранения) ===
async function sendTestMessage() {
  try {
    if (!internalSurvey.value.messages.length) {
      alert('Нет сообщений для отправки');
      return;
    }
    const resp = await apiRequest('POST', 'surveys/testSend', {
      telegramId: internalSurvey.value.telegramId,
      filters: internalSurvey.value.filters,
      messages: internalSurvey.value.messages,
    });
    console.log('Тестовое отправление: ответ сервера', resp);
    alert('Тестовое сообщение отправлено!');
  } catch (err) {
    console.error('Ошибка при тестовой отправке:', err);
    alert('Ошибка при тестовой отправке. Смотрите консоль.');
  }
}
</script>
