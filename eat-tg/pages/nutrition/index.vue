<template>
  <NutritionTabs />

  <!-- Кнопка, видимая только если у пользователя роль admin -->
  <v-btn
      v-if="isAdmin"
      color="primary"
      class="ma-2"
      @click="openAdminPanel"
  >
    Открыть Админку Блога
  </v-btn>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NutritionTabs from '../../components/nutrition/NutritionTabs.vue'
import { retrieveLaunchParams } from '@telegram-apps/sdk'
import { useApi } from '../../composables/useApi'
import { useRouter } from 'vue-router'

const { apiRequest } = useApi()
const router = useRouter()

const isAdmin = ref(false)
const telegramUserId = ref<number | null>(null)

// При монтировании страницы получаем Telegram ID и запрашиваем роль пользователя
onMounted(async () => {
  if (process.client) {
    const launchParams = retrieveLaunchParams()
    if (launchParams && launchParams.initData && launchParams.initData.user) {
      const user = launchParams.initData.user
      if (user && user.id) {
        telegramUserId.value = Number(user.id)
        // Предположим, у вас есть маршрут /api/users/:telegramId, который возвращает { role: 'admin' | ... }
        // Пример: GET /api/users/12345 => { telegramId: 12345, role: 'admin', ... }
        try {
          const data = await apiRequest<any>('GET', `/users/${telegramUserId.value}`)
          if (data && data.role === 'admin') {
            isAdmin.value = true
          }
        } catch (error) {
          console.error('Ошибка при получении данных пользователя:', error)
        }
      }
    }
  }
})

// Нажатие на кнопку «Открыть Админку Блога»
function openAdminPanel() {
  // Переходим на маршрут, где расположен ваш админ-компонент (например, /blog-admin)
  router.push('/blog-admin')
}
</script>

<style scoped>
/* Если нужны какие-то стили для кнопки или контейнера */
</style>
