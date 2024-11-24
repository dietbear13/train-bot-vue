<!-- ~/components/AdminInfo.vue -->

<template>
  <v-card class="pa-4">
    <v-card-title>Административная Информация</v-card-title>
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
          <v-btn icon @click="viewUser(item)">
            <v-icon>mdi-eye</v-icon>
          </v-btn>
        </template>
      </v-data-table>

      <v-dialog v-model="dialog" max-width="500">
        <v-card>
          <v-card-title>Информация о Пользователе</v-card-title>
          <v-card-text>
            <div v-if="selectedUser">
              <p><strong>Telegram ID:</strong> {{ selectedUser.telegramId }}</p>
              <p><strong>Имя:</strong> {{ selectedUser.firstName || 'Не указано' }}</p>
              <p><strong>Фамилия:</strong> {{ selectedUser.lastName || 'Не указано' }}</p>
              <p><strong>Username:</strong> {{ selectedUser.username || 'Не указано' }}</p>
              <p><strong>Язык:</strong> {{ selectedUser.languageCode || 'Не указано' }}</p>
              <p><strong>Роль:</strong> {{ selectedUser.role }}</p>
              <p><strong>Дата Добавления:</strong> {{ formatDate(selectedUser.dateAdded) }}</p>
              <!-- Добавьте другие поля по необходимости -->
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" text @click="dialog = false">Закрыть</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-alert v-if="error" type="error" dismissible>{{ error }}</v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '~/stores/userStore'
import axios from 'axios'
import { useRuntimeConfig } from '#imports'

const primaryBaseURL = 'https://fit-server-bot.ru.tuna.am/api/';
const fallbackBaseURL = 'http://localhost:3002/api/';


interface User {
  _id: string
  telegramId: number
  firstName?: string
  lastName?: string
  username?: string
  languageCode?: string
  role: 'admin' | 'freeUser' | 'paidUser'
  dateAdded: number
  // Добавьте другие поля по необходимости
}

const userStore = useUserStore()
const config = useRuntimeConfig()
const apiBaseURL = config.public.apiBaseUrl

const users = ref<User[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchId = ref('')
const filteredUsers = ref<User[]>([])
const dialog = ref(false)
const selectedUser = ref<User | null>(null)

const headers = [
  { text: 'Telegram ID', value: 'telegramId' },
  { text: 'Имя', value: 'firstName' },
  { text: 'Фамилия', value: 'lastName' },
  { text: 'Username', value: 'username' },
  { text: 'Язык', value: 'languageCode' },
  { text: 'Роль', value: 'role' },
  { text: 'Дата Добавления', value: 'dateAdded' },
  { text: 'Действия', value: 'actions', sortable: false },
]

const fetchUsers = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await axios.get(`${primaryBaseURL}users`, {
      headers: {
        Authorization: `Bearer ${import.meta.env.TELEGRAM_BOT_API_KEY}`, // Предполагается, что токен хранится в store
      },
    })
    users.value = response.data.users
    filteredUsers.value = users.value
  } catch (err) {
    console.error('Ошибка при загрузке пользователей:', err)
    error.value = 'Не удалось загрузить пользователей.'
  } finally {
    loading.value = false
  }
}

const searchUser = () => {
  const id = parseInt(searchId.value)
  if (!isNaN(id)) {
    filteredUsers.value = users.value.filter(user => user.telegramId === id)
  } else {
    filteredUsers.value = users.value
  }
}

const viewUser = (user: User) => {
  selectedUser.value = user
  dialog.value = true
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}

// Фильтрация пользователей на основе поиска
const computedFilteredUsers = computed(() => {
  if (searchId.value) {
    const id = parseInt(searchId.value)
    if (!isNaN(id)) {
      return users.value.filter(user => user.telegramId === id)
    }
  }
  return users.value
})

// Автоматическая фильтрация
filteredUsers.value = computedFilteredUsers.value

// Загрузка данных только для администраторов
if (userStore.role === 'admin') {
  fetchUsers()
}
</script>

<style scoped>
/* Добавьте стили по необходимости */
</style>
