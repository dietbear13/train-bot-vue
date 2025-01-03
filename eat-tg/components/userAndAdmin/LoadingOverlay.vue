<template>
  <v-overlay :absolute="true" :value="show" opacity="0.9" color="white">
    <v-progress-circular
        size="64"
        indeterminate
        color="primary"
    />
    <div class="mt-4">Загрузка...</div>
  </v-overlay>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
}

const props = defineProps<Props>()
</script>
