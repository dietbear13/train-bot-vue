<!-- pages/landingsOutside/donatStars.vue -->
<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="pa-5" elevation="4">
          <v-card-title class="justify-center">
            <v-icon large color="primary">mdi-star</v-icon>
            <span class="ml-3">Отправить Stars</span>
          </v-card-title>
          <v-card-subtitle class="text-center">
            Поддержите наш проект, отправив Telegram Stars!
          </v-card-subtitle>
          <v-card-text>
            <v-form @submit.prevent="handleDonateStars">
              <v-text-field
                  v-model="stars"
                  label="Количество звёзд"
                  type="number"
                  required
                  variant="outlined"
                  min="1"
                  :rules="[v => v >= 1 || 'Минимум звёзд — 1']"
                  prepend-icon="mdi-star"
              />
              <v-btn color="primary" type="submit" :loading="isLoading" block>
                Отправить звёзды
              </v-btn>
            </v-form>

            <v-alert v-if="error" type="error" dismissible class="mt-4">
              {{ error }}
            </v-alert>

            <v-alert v-if="success" type="success" dismissible class="mt-4">
              {{ success }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// Импортируем наш composable
import { useApi } from '~/composables/useApi'

/**
 * Здесь предположим, что userId вы получаете
 * либо из initData Telegram WebApp,
 * либо каким-то другим образом.
 * В примере захардкожено:
 */
const userId = ref<number>(123456789)
const stars = ref<number>(1)
const error = ref<string>('')
const success = ref<string>('')
const isLoading = ref<boolean>(false)

// Регистрируем Telegram WebApp (если нужно)
const tgWebApp = ref<any>(null)

onMounted(() => {
  if (window.Telegram?.WebApp) {
    tgWebApp.value = window.Telegram.WebApp
    tgWebApp.value.ready()
    console.log('Telegram WebApp инициализирован:', tgWebApp.value)
  } else {
    error.value = 'Этот функционал доступен только в Telegram.'
    console.error('Telegram WebApp недоступен.')
  }
})

const { apiRequest } = useApi()

const handleDonateStars = async () => {
  error.value = ''
  success.value = ''

  if (stars.value < 1) {
    error.value = 'Минимальное количество звёзд — 1.'
    console.error('Недопустимое количество звёзд:', stars.value)
    return
  }

  isLoading.value = true
  try {
    /**
     * Отправляем POST-запрос на сервер
     * Ваш useApi уже настроен на базовый URL 'https://fitnesstgbot.ru/api/'
     * поэтому здесь пишем 'donations/stars' без /api в начале.
     */
    const response = await apiRequest<{
      message: string;
      invoiceLink: string;
    }>('POST', 'donations/stars', {
      userId: userId.value,
      stars: stars.value
    })

    // Проверяем, что ссылка получена
    if (!response || !response.invoiceLink) {
      throw new Error('Ссылка на инвойс не получена')
    }

    // Открываем инвойс в новой вкладке (или в том же WebView)
    window.open(response.invoiceLink, '_blank')
    success.value = 'Ссылка на оплату получена! Открываем...'
  } catch (err: any) {
    console.error('Ошибка при получении ссылки на инвойс:', err)
    error.value = err?.message || 'Произошла ошибка при запросе к серверу.'
  } finally {
    isLoading.value = false
  }
}

// Метаданные страницы
definePageMeta({
  layout: 'no-footer',
})
</script>

<style scoped>
.v-card {
  max-width: 500px;
}
.v-card-title {
  align-items: center;
}
.ml-3 {
  margin-left: 1rem;
}
</style>
