<template>
  <v-card class="pa-3" elevation="3">
    <v-card-title>{{ workout.formData.splitType }}</v-card-title>
    <v-card-subtitle>{{ formatDate(workout.timestamp) }} • {{ workout.author }}</v-card-subtitle>

    <v-card-text>
      <p>{{ workout.formData.goal }}</p>
    </v-card-text>

    <v-card-actions>
      <v-btn icon @click="$emit('like')">
        <v-icon>mdi-thumb-up</v-icon> {{ workout.likes || 0 }}
      </v-btn>
      <v-btn icon @click="$emit('save')">
        <v-icon>mdi-content-save</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
defineProps({ workout: Object });

defineEmits(["like", "save"]);

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString();
}
</script>
