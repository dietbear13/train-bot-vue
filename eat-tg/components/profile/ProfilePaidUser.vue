<template>
  <v-card class="mb-2" style="border-radius: 16px" flat>
    <KbzhuCardProfile v-if="latestKbzhuResult" :kbzhu="latestKbzhuResult" :timestamp="latestKbzhuTimestamp" />
    <v-card-text>
      <p>В канале кОчалка рассказываю как превратить набор упражнений в программе в план действий.</p>
      <v-btn color="primary" @click="goToChannel" class="my-2" rounded="xl">
        Перейти в канал
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import KbzhuCardProfile from '../nutrition/KbzhuCardProfile.vue';
import { computed } from 'vue';
import { useUserStore } from '../../stores/userStore';

const userStore = useUserStore();
const channelLink = 'https://t.me/training_health';

const goToChannel = () => {
  window.open(channelLink, '_blank');
};

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
