<!-- components/BottomSheetWithClose.vue -->
<template>
  <v-bottom-sheet
      v-model="internalModel"
      :max-width="maxWidth"
      :persistent="persistent"
      class="rounded-t-xl"
  >
    <v-card class="relative-position">
      <!-- Иконка в левом верхнем углу -->
      <v-icon class="header-icon">{{ icon }}</v-icon>

      <!-- Кнопка закрытия в правом верхнем углу -->
      <v-btn
          icon
          @click="close"
          aria-label="Закрыть"
          class="close-button"
          variant="plain"
      >
        <v-icon size="large">mdi-close</v-icon>
      </v-btn>

      <!-- Слот для содержимого -->
      <v-card-text class="pt-8">
        <slot></slot>
      </v-card-text>
    </v-card>
  </v-bottom-sheet>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'BottomSheetWithClose',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    icon: {
      type: String,
      default: '' // Иконка теперь опциональна
    },
    title: {
      type: String,
      default: '' // Новый проп для заголовка
    },
    persistent: {
      type: Boolean,
      default: false
    },
    maxWidth: {
      type: String,
      default: '600px'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const internalModel = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val)
    });

    const close = () => {
      internalModel.value = false;
    };

    return {
      internalModel,
      close
    };
  }
});
</script>

<style scoped>
.rounded-t-xl {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.relative-position {
  position: relative;
  padding-top: 16px; /* Добавляем отступ сверху для иконки */
}

.header-icon {
  position: absolute;
  top: 16px;
  left: 16px;
  font-size: 24px;
}

.close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.v-card-text {
  padding-top: 40px; /* Увеличиваем верхний отступ, чтобы иконка и кнопка закрытия не перекрывали содержимое */
}

.exercise-title {
  white-space: normal; /* Разрешаем перенос текста */
  overflow: hidden;
  text-overflow: ellipsis; /* Добавить многоточие при переполнении */
  word-break: break-word; /* Перенос слов при необходимости */
  overflow-wrap: break-word; /* Перенос длинных слов */
}
</style>
