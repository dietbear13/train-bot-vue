<template>
  <v-container>
    <DonatStarsComponent/>
  </v-container>
</template>

<script setup lang="ts">
import DonatStarsComponent from "../../components/shared/DonatStarsComponent.vue";

// Метаданные страницы
definePageMeta({
  layout: 'no-footer',
})
</script>

<style scoped>

</style>
