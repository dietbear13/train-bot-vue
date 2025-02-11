<!-- components/adminPanel/communicator/CommunicatorMain.vue -->
<template>
  <v-card>
    <v-toolbar color="primary" dark>
      <v-toolbar-title>Управление рассылками</v-toolbar-title>
      <v-spacer />
      <v-btn color="secondary" @click="openCreateDialog">
        Создать
      </v-btn>
    </v-toolbar>

    <!-- Список рассылок -->
    <v-data-table
        :headers="headers"
        :items="surveys"
        item-key="_id"
    >
      <template #item.scheduledAt="{ item }">
        {{ formatDate(item.scheduledAt) }}
      </template>
      <template #item.actions="{ item }">
        <v-btn icon color="primary" @click="openEditDialog(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon color="error" @click="deleteSurvey(item._id)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>
  </v-card>

  <!-- Диалоги создания и редактирования -->
  <CreateSurveyDialog v-model="createDialog" @saved="fetchSurveys" />
  <EditSurveyDialog
      v-model="editDialog"
      :editingSurvey="editingSurvey"
      @saved="fetchSurveys"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '../../../composables/useApi';
import CreateSurveyDialog from './CreateSurveyDialog.vue';
import EditSurveyDialog from './EditSurveyDialog.vue';

const { apiRequest } = useApi();

const surveys = ref([]);
const createDialog = ref(false);
const editDialog = ref(false);
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
  const data = await apiRequest('GET', 'surveys');
  surveys.value = data;
}

function openCreateDialog() {
  createDialog.value = true;
}

function openEditDialog(survey: any) {
  editingSurvey.value = { ...survey };
  editDialog.value = true;
}

async function deleteSurvey(id: string) {
  if (!confirm('Удалить рассылку?')) return;
  await apiRequest('DELETE', `surveys/${id}`);
  fetchSurveys();
}

onMounted(() => {
  fetchSurveys();
});
</script>
