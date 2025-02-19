<template>
  <v-card class="pa-2 mb-3" elevation="3">
    <!-- 🔹 Заголовок карточки -->
    <v-card-title class="text-h6 font-weight-bold d-flex align-center">
      <v-avatar size="40" class="me-3">
        <v-img src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" alt="User" />
      </v-avatar>
      {{ workout.telegramId || "Неизвестный автор" }}
    </v-card-title>

    <!-- 🔹 Подзаголовок с датой и типом тренировки -->
    <v-card-subtitle class="d-flex align-center justify-space-between">
      <span>{{ formatDate(workout.timestamp) }}</span>
      <v-chip color="blue-darken-1" class="text-white">{{ workout.formData.splitType }}</v-chip>
    </v-card-subtitle>

    <!-- 🔹 Основной контент -->
    <v-card-text>
      <v-row dense>
        <v-col cols="12">
          <p class="text-subtitle-1 font-weight-bold">🎯 Цель:</p>
          <p>{{ workout.formData.goal || "Не указана" }}</p>
        </v-col>

        <!-- Комментарий -->
        <v-col cols="12" v-if="workout.formData.comment">
          <p class="text-subtitle-1 font-weight-bold">💬 Комментарий:</p>
          <v-alert color="info" variant="tonal">
            {{ workout.formData.comment }}
          </v-alert>
        </v-col>
      </v-row>

      <!-- 🔹 Аккордеон с тренировочным планом -->
      <v-expansion-panels variant="accordion">
        <v-expansion-panel v-for="(day, index) in workout.plan.filter(d => d.exercises.length > 0)" :key="index">
          <v-expansion-panel-title>
            <v-icon class="me-2">mdi-calendar-check</v-icon> {{ day.dayName }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list density="compact">
              <v-list-item v-for="exercise in day.exercises" :key="exercise._id">
                <template v-slot:prepend>
                  <v-avatar size="30" class="me-2">
                    <v-icon>mdi-dumbbell</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>
                  <span class="font-weight-medium">{{ exercise.name }}</span>
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ exercise.sets }}×{{ exercise.reps }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>

        <!-- 🔹 Кнопки действий -->
    <v-card-actions>
      <v-btn variant="tonal" color="green" @click="$emit('save')">
        <v-icon start>mdi-content-save</v-icon> Сохранить себе
      </v-btn>

      <v-spacer></v-spacer>

      <v-btn icon variant="flat" @click="$emit('like')" color="pink">
        <span class="text-body-2">{{ workout.likes || 0 }}</span>
        <v-icon>mdi-thumb-up</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
defineProps({ workout: Object });

defineEmits(["like", "save"]);

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
</script>
