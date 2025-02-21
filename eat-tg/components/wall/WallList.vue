<template>
  <!-- v-row для формирования сетки, v-col для каждой карточки -->
    <component
        v-for="workout in workouts"
        :key="workout._id"
        cols="12"
        md="6"
    >
      <!-- Передаём workout в компонент WallCard
           и пробрасываем события like/save вверх -->
      <WallCard
          :workout="workout"
          @like="() => $emit('like', workout._id)"
          @save="() => $emit('save', workout._id)"
      />
    </component>
</template>

<script lang="ts" setup>
import WallCard from "./WallCard.vue";

/**
 * Принимаем массив тренировок
 * и пробрасываем события "like" и "save".
 */
const props = defineProps({
  workouts: {
    type: Array,
    default: () => [],
  },
});

const emits = defineEmits(["like", "save"]);
</script>
