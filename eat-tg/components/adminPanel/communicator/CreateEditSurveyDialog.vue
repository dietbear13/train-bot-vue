<template>
  <v-dialog v-model="modelValue" max-width="800px">
    <v-card>
      <v-card-title>
        <span v-if="internalSurvey._id">Редактирование</span>
        <span v-else>Создание</span>
      </v-card-title>
      <v-card-text>
        <!-- Выбор пользователя (или telegramId) -->
        <v-text-field
            v-model="internalSurvey.telegramId"
            label="Telegram ID"
        />

        <!-- Выбор даты отправки -->
        <v-text-field
            v-model="internalSurvey.scheduledAt"
            label="Дата и время отправки (ISO)"
            helper="Например: 2025-01-05T14:00:00Z"
        />

        <!-- Список сообщений -->
        <v-subheader>Сообщения</v-subheader>
        <div v-for="(msg, idx) in internalSurvey.messages" :key="idx">
          <v-text-field
              v-model="msg.text"
              label="Текст сообщения"
          />
          <v-switch
              v-model="msg.waitForResponse"
              label="Ждать ответа перед отправкой следующего?"
          />
          <v-btn color="error" text @click="removeMessage(idx)">Удалить сообщение</v-btn>

          <!-- Настройка кнопок -->
          <v-subheader>Инлайн-кнопки</v-subheader>
          <div v-for="(btn, bIdx) in msg.inlineButtons" :key="bIdx" class="d-flex">
            <v-text-field v-model="btn.text" label="Текст кнопки" />
            <v-text-field v-model="btn.callbackData" label="Callback" />
            <v-btn color="error" icon @click="removeButton(idx, bIdx)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
          <v-btn color="primary" text @click="addButton(idx)">Добавить кнопку</v-btn>
        </div>
        <v-btn color="secondary" text @click="addMessage">Добавить сообщение</v-btn>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text color="secondary" @click="close">Закрыть</v-btn>
        <v-btn text color="primary" @click="saveSurvey">Сохранить</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useApi } from '~/composables/useApi';

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
  telegramId: number;
  scheduledAt: string;
  messages: SurveyMessage[];
}

const props = defineProps<{
  modelValue: boolean;
  editingSurvey?: any | null;
}>();

const emits = defineEmits(['update:modelValue', 'saved']);

const { apiRequest } = useApi();

const internalSurvey = ref<SurveyForm>({
  telegramId: 0,
  scheduledAt: '',
  messages: []
});

watch(
    () => props.editingSurvey,
    (newVal) => {
      if (!newVal) {
        internalSurvey.value = {
          telegramId: 0,
          scheduledAt: '',
          messages: []
        };
      } else {
        internalSurvey.value = JSON.parse(JSON.stringify(newVal));
      }
    },
    { immediate: true }
);

function close() {
  emits('update:modelValue', false);
}

async function saveSurvey() {
  try {
    if (!internalSurvey.value._id) {
      // POST /admin/surveys
      await apiRequest('POST', 'admin/surveys', internalSurvey.value);
    } else {
      // PATCH /admin/surveys/:id
      await apiRequest('PATCH', `admin/surveys/${internalSurvey.value._id}`, internalSurvey.value);
    }
    emits('saved');
    close();
  } catch (err) {
    console.error(err);
  }
}

function addMessage() {
  internalSurvey.value.messages.push({
    order: internalSurvey.value.messages.length,
    text: '',
    waitForResponse: false,
    inlineButtons: []
  });
}
function removeMessage(idx: number) {
  internalSurvey.value.messages.splice(idx, 1);
}
function addButton(idx: number) {
  internalSurvey.value.messages[idx].inlineButtons.push({
    text: '',
    callbackData: ''
  });
}
function removeButton(msgIdx: number, btnIdx: number) {
  internalSurvey.value.messages[msgIdx].inlineButtons.splice(btnIdx, 1);
}
</script>
