<template>
  <v-card style="border-radius: 16px" flat class="mb-2">
    <KbzhuCardProfile :kbzhu="latestKbzhuResult" :timestamp="latestKbzhuTimestamp" />
    <v-btn href="https://fitnesstgbot.ru/blog#post-6795dd1427ec76c4b67de1bc">
      К статье
    </v-btn>
  </v-card>
  <v-btn block color="primary" class="mt-3" rounded="xl" @click="showSavedWorkouts = true">
    📋 Сохранённые тренировки
  </v-btn>

  <!-- Отображение сохранённых тренировок -->
  <ProfileWorkouts/>
</template>

<script setup lang="ts">
import KbzhuCardProfile from '../nutrition/KbzhuCardProfile.vue';
import {computed, ref} from 'vue';
import {useUserStore} from '../../stores/userStore';
import ProfileWorkouts from "./ProfileWorkouts.vue";

const userStore = useUserStore();
const showSavedWorkouts = ref(false);
const expandedWorkout = ref<number | null>(null);

const toggleWorkout = (index: number) => {
  expandedWorkout.value = expandedWorkout.value === index ? null : index;
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
