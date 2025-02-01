<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="pa-2" elevation="4">
          <v-card-title class="justify-center">
            <v-icon large color="#ffd700">mdi-star</v-icon>
            <span class="ml-1">Донаты в Telegram Stars</span>
          </v-card-title>
          <v-card-text>
            Telegram Stars можно купить через Apple Pay на МТС или за криптовалюту TON на <a target="_blank" href="https://fragment.com/">Fragment</a>, который требует верификации по паспорту.
          </v-card-text>
          <v-card-text>
            <v-form @submit.prevent="handleDonateStars">
              <v-text-field
                v-model="stars"
                label="Количество звёзд"
                type="number"
                inputmode="numeric"
                pattern="[0-9]*"
                required
                variant="outlined"
                min="1"
                :rules="[v => v >= 1 || 'Минимум звёзд — 1']"
              />
              <v-btn color="primary" type="submit" :loading="isLoading" block>
                Отправить ⭐
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '../../composables/useApi'

/**
 * Пример: userId можно получить из данных Telegram WebApp или другим способом.
 * В данном примере используется захардкоженное значение.
 */
const userId = ref<number>(123456789)
const stars = ref<number>(1)
const error = ref<string>('')
const success = ref<string>('')
const isLoading = ref<boolean>(false)

// Инициализация Telegram WebApp
const tgWebApp = ref<any>(null)
onMounted(() => {
  const telegram = (window as any).Telegram
  if (telegram?.WebApp) {
    tgWebApp.value = telegram.WebApp
    tgWebApp.value.ready()
  } else {
    error.value = 'Этот функционал доступен только в Telegram.'
    console.error('Telegram WebApp недоступен.')
  }
})

// Получаем функцию для API-запросов
const { apiRequest } = useApi()

/**
 * Функция для обработки оплаты:
 * 1. Отправляем POST-запрос на сервер для генерации ссылки на инвойс.
 * 2. Получаем invoiceLink и открываем его через Telegram WebApp (или в новой вкладке).
 */
const handleDonateStars = async () => {
  error.value = ''
  success.value = ''

  if (stars.value < 1) {
    error.value = 'Минимальное количество звёзд — 1.'
    return
  }

  isLoading.value = true
  try {
    // Отправляем запрос на сервер (базовый URL уже задан в useApi)
    const response = await apiRequest<{
      message: string
      invoiceLink: string
    }>('POST', 'donations/stars', {
      userId: userId.value,
      stars: stars.value,
    })

    if (!response || !response.invoiceLink) {
      throw new Error('Ссылка на инвойс не получена')
    }

    // Используем полученную ссылку на инвойс
    const invoiceLink = response.invoiceLink

    // Если Telegram WebApp поддерживает openInvoice, используем его для открытия платежного окна
    if (tgWebApp.value && typeof tgWebApp.value.openInvoice === 'function') {
      tgWebApp.value.openInvoice(invoiceLink)

      // (Опционально) обработка события закрытия инвойса
      tgWebApp.value.onEvent('invoiceClosed', (data: any) => {
        // Здесь можно добавить дополнительную логику после оплаты
      })

      success.value = 'Ссылка на оплату получена! Открываем инвойс в Telegram...'
    } else {
      // Фолбэк: открываем ссылку в новой вкладке
      window.open(invoiceLink, '_blank')
      success.value = 'Ссылка на оплату получена! Открываем в новой вкладке...'
    }
  } catch (err: any) {
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
