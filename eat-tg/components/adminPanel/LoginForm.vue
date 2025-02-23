<template>
  <v-container fluid class="d-flex align-center justify-center" style="min-height: 100vh;">
    <v-card class="pa-6" width="400">
      <v-card-text>
        <v-form ref="formRef" v-model="valid" lazy-validation>
          <v-text-field v-model="username" label="Логин" :rules="[rules.required]" required />
          <v-text-field v-model="password" label="Пароль" type="password" :rules="[rules.required]" required />
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
import axios from 'axios'

const username = ref('')
const password = ref('')
const valid = ref(false)
const formRef = ref<any>(null)

const rules = {
  required: (value: string) => !!value || 'Обязательное поле',
}

const userStore = useUserStore()
const config = useRuntimeConfig()

async function login() {
  if (!formRef.value.validate()) {
    return
  }

  try {
    const response = await axios.post(`${config.public.API_BASE_URL}/api/login`, {
      username: username.value,
      password: password.value,
    })

    if (response.data.success) {
      userStore.setRole('admin')
      userStore.setTelegramId(response.data.telegramId) // Сохраняем telegramId
    } else {
      alert('Неверный логин или пароль')
    }
  } catch (error) {
    alert('Ошибка сервера, попробуйте позже')
  }
}
</script>
