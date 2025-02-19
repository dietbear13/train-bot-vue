<template>
  <v-row>
    <v-col v-for="workout in workouts" :key="workout._id" cols="12" md="6">
      <WallCard :workout="workout" @like="() => $emit('like', workout._id)" @save="() => $emit('save', workout._id)" />
    </v-col>
  </v-row>
</template>

<script setup>
import WallCard from "./WallCard.vue";

defineProps({
  workouts: Array
});

defineEmits(["like", "save"]);
</script>
