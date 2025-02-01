<!-- pages/blog.vue -->
<template>
  <v-app>
    <v-app-bar color="primary" dark elevated>
      <v-toolbar-title>Блог</v-toolbar-title>
      <v-btn
          v-if="isAdmin"
          color="secondary"
          class="ma-2"
          @click="toggleAdmin"
      >
        {{ showAdminPanel ? 'Закрыть админку' : 'Открыть админку' }}
      </v-btn>
    </v-app-bar>

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

// Импортируем компоненты
import BlogCard from '../components/blog/BlogCard.vue'
import BlogAdmin from '../components/userAndAdmin/BlogAdmin.vue'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.role === 'admin')

const showAdminPanel = ref(false)

function toggleAdmin() {
  showAdminPanel.value = !showAdminPanel.value
}
</script>

<style scoped>
/* Ваши стили, если нужны */
</style>
