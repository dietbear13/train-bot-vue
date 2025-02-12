<template>
  <v-card style="border-radius: 16px" flat class="mb-2">
    <KbzhuCardProfile :kbzhu="latestKbzhuResult" :timestamp="latestKbzhuTimestamp" />
    <v-btn href="https://fitnesstgbot.ru/blog#post-6795dd1427ec76c4b67de1bc">
      К статье
    </v-btn>
  </v-card>
</template>

<script setup lang="ts">
import KbzhuCardProfile from '../nutrition/KbzhuCardProfile.vue';
import { computed } from 'vue';
import { useUserStore } from '../../stores/userStore';

const userStore = useUserStore();

const latestKbzhuResult = computed(() => {
  if (userStore.kbzhuHistory?.length) {
    return [...userStore.kbzhuHistory].sort((a, b) => b.timestamp - a.timestamp)[0].kbzhuResult;
  }
  return null;
});

const latestKbzhuTimestamp = computed(() => {
  if (userStore.kbzhuHistory?.length) {
    return [...userStore.kbzhuHistory].sort((a, b) => b.timestamp - a.timestamp)[0].timestamp;
  }
  return null;
});
</script>
