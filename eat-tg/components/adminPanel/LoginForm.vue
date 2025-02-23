<template>
  <v-container fluid class="d-flex align-center justify-center" style="min-height: 100vh;">
    <v-card class="pa-6" width="400">
      <v-card-text>
        <v-form ref="formRef" v-model="valid" lazy-validation>
          <v-text-field
              v-model="username"
              label="Логин"
              :rules="[rules.required]"
              required
          />
          <v-text-field
              v-model="password"
              label="Пароль"
              type="password"
              :rules="[rules.required]"
              required
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" :disabled="!valid" @click="login">Войти</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../../stores/userStore'
import { useRuntimeConfig } from '#imports'

const username = ref('')
const password = ref('')
const valid = ref(false)
const formRef = ref<any>(null)

const rules = {
  required: (value: string) => !!value || 'Обязательное поле',
}

// Пример простых учётных данных для входа (замените или доработайте логику через API)
const adminCredentials = {
  username: 'admin',
  password: '123',
}

const userStore = useUserStore()
const config = useRuntimeConfig()

function login() {
  // Проверяем валидацию формы
  if (!formRef.value.validate()) {
    return
  }
  // Проверка введённых данных (в реальном проекте замените на API-авторизацию)
  if (username.value === adminCredentials.username && password.value === adminCredentials.password) {
    // При успешном входе устанавливаем роль администратора
    userStore.setRole('admin')
    // Читаем Telegram ID из переменной окружения (указанной в runtimeConfig.public)
    const adminTelegramId = config.public.ADMIN_TELEGRAM_ID
    userStore.setTelegramId(Number(adminTelegramId))
  } else {
    alert('Неверный логин или пароль')
  }
}
</script>
