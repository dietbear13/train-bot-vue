<!-- components/AdminExerciseButton.vue -->
<template>
  <v-btn
      v-if="isAdmin"
      icon
      @click="handleClick"
      color="warning"
      size="24px"
  >
    <v-icon>mdi-alert</v-icon>
  </v-btn>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useUserStore } from '~/stores/userStore'

export default defineComponent({
  name: 'AdminExerciseButton',
  props: {
    onLog: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    const userStore = useUserStore()
    const isAdmin = computed(() => userStore.role === 'admin')

    // Логирование для отладки
    console.log('AdminExerciseButton - isAdmin:', isAdmin.value)

    const handleClick = () => {
      props.onLog()
    }

    return {
      isAdmin,
      handleClick
    }
  }
})
</script>

<style scoped>
/* Можно добавить дополнительные стили при необходимости */
</style>
