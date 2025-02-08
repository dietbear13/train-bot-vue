<!--components/shared/DonatStarsComponent.vue'-->

<template>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card elevation="4" style="border-radius: 16px;">
          <v-card-title class="primary white--text">
            <v-icon large color="#ffd700">mdi-star</v-icon>
            Донаты в Telegram Stars
          </v-card-title>
          <v-card-text class="pb-0 mt-2">
            <p>Stars можно купить через Apple Pay или за криптовалюту TON. Цена за 100 stars:
            </p>
            <ul style="margin-left: 2.5em">
              <li>через Apple Pay ~209 ₽</li>
              <li>через Fragment ~0.32 TON</li>
            </ul>
          </v-card-text>
          <v-card-text>
            <v-form @submit.prevent="handleDonateStars">
              <v-text-field
                  v-model="stars"
                  label="Количество звёзд"
                  hide-details
                  type="number"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  required
                  variant="outlined"
                  min="1"
                  class="mb-4"
                  :rules="[v => v >= 1 || 'Минимум звёзд — 1']"
              />
              <v-btn
                  color="primary"
                  type="submit"
                  rounded="xl"
                  :loading="isLoading" block
              >
                Отправить ⭐
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useApi } from '../../composables/useApi'

// Переменные
const telegramId = ref<number | null>(null)
const stars = ref<number>(1)
const error = ref<string>('')
const success = ref<string>('')
const isLoading = ref<boolean>(false)

// Telegram WebApp объект
const tgWebApp = ref<any>(null)

// API-запросы
const { apiRequest } = useApi()

// Получение Telegram ID при монтировании компонента
onMounted(() => {
  const telegram = (window as any).Telegram

  if (telegram?.WebApp) {
    tgWebApp.value = telegram.WebApp
    tgWebApp.value.ready()

    // Проверяем initDataUnsafe
    if (tgWebApp.value.initDataUnsafe?.user?.id) {
      telegramId.value = Number(tgWebApp.value.initDataUnsafe.user.id)
      console.log('Получен telegramId:', telegramId.value)
    } else {
      console.error('Не удалось получить Telegram ID.')
      error.value = 'Ошибка: запустите приложение внутри Telegram.'
    }
  } else {
    error.value = 'Этот функционал доступен только в Telegram.'
    console.error('Telegram WebApp недоступен.')
  }
})

// Функция отправки донатов
const handleDonateStars = async () => {
  error.value = ''
  success.value = ''

  if (stars.value < 1) {
    error.value = 'Минимальное количество звёзд — 1.'
    return
  }

  if (!telegramId.value) {
    error.value = 'Ошибка: Telegram ID пользователя не получен.'
    return
  }

  isLoading.value = true
  try {
    const response = await apiRequest<{
      message: string
      invoiceLink: string
    }>('POST', 'donations/stars', {
      telegramId: telegramId.value,
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
        console.log('Инвойс закрыт', data)
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
</script>

<style scoped>
.v-card {
  max-width: 500px;
  border-radius: 16px;
}
.primary {
  background-color: darkslategray !important;
  border-radius: 16px;
}

</style>
