<!-- layouts/default.vue -->
<template>
  <v-app>
    <v-main>
      <NuxtPage />
    </v-main>

    <v-bottom-navigation
        v-model="currentTab"
        color="primary"
        app
    >
      <v-btn
          :value="'home'"
          @click="$router.push('/')"
          icon
      >
        <v-icon>mdi-home</v-icon>
      </v-btn>

      <v-btn
          :value="'nutrition'"
          @click="$router.push('/nutrition')"
          icon
      >
        <v-icon>mdi-food-apple</v-icon>
      </v-btn>

      <v-btn
          :value="'training'"
          @click="$router.push('/training')"
          icon
      >
        <v-icon>mdi-dumbbell</v-icon>
      </v-btn>

      <v-btn
          :value="'profile'"
          @click="$router.push('/profile')"
          icon
      >
        <v-icon>mdi-account</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const currentTab = ref('home')
const router = useRouter()
const route = useRoute()

watch(
    () => route.path,
    (newPath) => {
      if (newPath.startsWith('/nutrition')) {
        currentTab.value = 'nutrition'
      } else if (newPath.startsWith('/training')) {
        currentTab.value = 'training'
      } else if (newPath.startsWith('/profile.vue')) {
        currentTab.value = 'profile'
      } else {
        currentTab.value = 'home'
      }
    },
    { immediate: true }
)
</script>

<style>
/* Дополнительные стили, если необходимо */
</style>
