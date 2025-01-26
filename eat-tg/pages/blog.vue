<template>
  <v-app>
    <!-- Шапка блога -->
    <v-app-bar color="primary" dark elevated>
      <v-toolbar-title>Блог</v-toolbar-title>
      <!-- Кнопка доступна только админу -->
      <v-btn
          v-if="isAdmin"
          color="secondary"
          class="ma-2"
          @click="toggleAdmin"
      >
        <!-- В зависимости от showAdminPanel меняем подпись кнопки -->
        {{ showAdminPanel ? 'Закрыть админку' : 'Открыть админку' }}
      </v-btn>
    </v-app-bar>

    <!-- Основная часть -->
    <v-main>
      <v-container class="py-4">
        <v-row>
          <BlogAdmin v-if="showAdminPanel" />
          <BlogCard v-else />
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '../stores/userStore'

// Импортируем ваши компоненты
import BlogCard from '../components/blog/BlogCard.vue'
import BlogAdmin from '../components/userAndAdmin/BlogAdmin.vue'

// Достаём хранилище пользователя (Pinia)
const userStore = useUserStore()
const isAdmin = computed(() => userStore.role === 'admin')

// Управляем видимостью админки
const showAdminPanel = ref(false)

// Клик по кнопке — переключаем флаг
function toggleAdmin() {
  showAdminPanel.value = !showAdminPanel.value
}
</script>

<style scoped>
/* Ваши стили, если нужны */
</style>
