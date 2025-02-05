<template>
  <v-card>
    <v-toolbar color="primary" dark>
      <v-toolbar-title>Управление рассылками</v-toolbar-title>
      <v-spacer />
      <v-btn color="secondary" @click="openCreateDialog">
        Создать
      </v-btn>
    </v-toolbar>

    <v-data-table
        :headers="headers"
        :items="surveys"
        item-key="_id"
    >
      <template #item.scheduledAt="{ item }">
        {{ formatDate(item.scheduledAt) }}
      </template>

      <template #item.actions="{ item }">
        <v-btn icon color="primary" @click="editSurvey(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon color="error" @click="deleteSurvey(item._id)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>
  </v-card>

  <!-- Диалог создания/редактирования -->
  <CreateEditSurveyDialog
      v-model="dialog"
      :editingSurvey="editingSurvey"
      @saved="fetchSurveys"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '../../../composables/useApi';
import CreateEditSurveyDialog from './CreateEditSurveyDialog.vue';

const { apiRequest } = useApi();

const surveys = ref([]);
const dialog = ref(false);
const editingSurvey = ref<any | null>(null);

const headers = [
  { text: 'ID', value: '_id' },
  { text: 'Пользователь (telegramId)', value: 'telegramId' },
  { text: 'Дата отправки', value: 'scheduledAt' },
  { text: 'Действия', value: 'actions', sortable: false },
];

function formatDate(d: string | Date) {
  return new Date(d).toLocaleString('ru-RU');
}

async function fetchSurveys() {
  // GET /admin/surveys
  const data = await apiRequest('GET', 'admin/surveys');
  surveys.value = data;
}

function openCreateDialog() {
  editingSurvey.value = null;
  dialog.value = true;
}

function editSurvey(survey: any) {
  editingSurvey.value = { ...survey };
  dialog.value = true;
}

async function deleteSurvey(id: string) {
  if (!confirm('Удалить рассылку?')) return;
  await apiRequest('DELETE', `admin/surveys/${id}`);
  fetchSurveys();
}

onMounted(() => {
  fetchSurveys();
});
</script>
