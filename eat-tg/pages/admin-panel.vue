<template>
  <div>
    <!-- Если роль не admin, показываем форму входа -->
    <LoginForm v-if="!isAdmin" />
    <!-- Если роль admin, показываем основную админ-панель -->
    <adminPanelMain v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '~/stores/userStore'
import LoginForm from '~/components/adminPanel/LoginForm.vue'
import adminPanelMain from '~/components/adminPanel/adminPanelMain.vue'

const userStore = useUserStore()

const isAdmin = computed(() => userStore.role === 'admin')

definePageMeta({
  layout: 'no-footer',
})
</script>
