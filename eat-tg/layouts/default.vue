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
          @click="navigate('/')"
          icon
      >
        <v-icon>mdi-home</v-icon>
      </v-btn>

      <v-btn
          :value="'nutrition'"
          @click="navigate('/nutrition')"
          icon
      >
        <v-icon>mdi-food-apple</v-icon>
      </v-btn>

      <v-btn
          :value="'training'"
          @click="navigate('/training')"
          icon
      >
        <v-icon>mdi-dumbbell</v-icon>
      </v-btn>

      <v-btn
          :value="'profile'"
          @click="navigate('/profile')"
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

const navigate = (path) => {
  router.push(path)
}

watch(
    () => route.path,
    (newPath) => {
      if (newPath.startsWith('/nutrition')) {
        currentTab.value = 'nutrition'
      } else if (newPath.startsWith('/training')) {
        currentTab.value = 'training'
      } else if (newPath.startsWith('/profile')) {
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
