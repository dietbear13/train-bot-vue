<template>
  <v-card class="pa-4">
    <!-- Заголовок и кнопка обновления -->
    <v-app-bar color="transparent" flat>
      <v-toolbar-title>Админ-панель: список пользователей</v-toolbar-title>
      <v-spacer />
      <v-btn color="primary" :loading="loading" @click="fetchUsers">
        <v-icon icon="mdi-reload" class="me-2" />
        Обновить
      </v-btn>
    </v-app-bar>

    <!-- Подключаем компонент с графиком -->
    <AnalyticsChart />

    <!-- Поле поиска (при желании можно оставить в родителе или перенести внутрь UsersTable) -->
    <v-text-field
        v-model="searchId"
        label="Поиск по Telegram ID"
        clearable
        variant="outlined"
        prepend-inner-icon="mdi-magnify"
        class="my-4"
        @input="searchUser"
    />

    <!-- Подключаем компонент с таблицей пользователей и диалогом -->
    <UsersTable />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '../../stores/userStore'
import { useApi } from '../../composables/useApi'
import AnalyticsChart from './AnalyticsChart.vue'
import UsersTable from './UsersTable.vue'

/**
 * Если часть логики (fetchUsers, search, и т.п.) нужна только для таблицы,
 * вы можете перенести её в UsersTable. Или, наоборот, если график
 * тоже использует общий список пользователей – оставляйте fetchUsers в родителе
 * и передавайте данные через props.
 */

const userStore = useUserStore()
const { apiRequest } = useApi()

const users = ref([])
const loading = ref(false)
const userError = ref<string|null>(null)

// Поиск по Telegram ID
const searchId = ref('')
function searchUser() {
  // Логика поиска (либо передайте searchId в UsersTable как проп)
}

async function fetchUsers() {
  loading.value = true
  userError.value = null
  try {
    // Пример запроса:
    const data = await apiRequest<{ users: any[] }>('GET', 'users')
    users.value = data.users
  } catch (err: any) {
    userError.value = 'Не удалось загрузить пользователей: ' + err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (userStore.role === 'admin') {
    fetchUsers()
  } else {
    userError.value = 'У вас нет доступа к этой странице.'
  }
})
</script>

<style scoped>
/* Примерно тот же стиль, что у вас был */
.v-application .v-card,
.v-application .v-dialog,
.v-application .v-data-table {
  background-color: #1e1e1e !important;
  color: #fff !important;
}
</style>
