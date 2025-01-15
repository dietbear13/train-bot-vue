<!-- components/training/ExerciseInfo.vue -->
<template>
  <BottomSheetWithClose
      v-model="modelValueLocal"
      title="Информация об упражнении"
  >
  <v-card-text v-if="exercise">
    <!-- Переносим заголовок в тело нижнего листа -->
    <div class="headline mb-4">{{ exercise.name || 'Об упражнении' }}</div>

    <!-- Отображение GIF-картинки -->
    <div v-if="exercise.gifImage" class="gif-container">
      <img
          :src="getGifUrl(exercise.gifImage)"
          alt="GIF упражнения"
          class="exercise-gif"
      />
    </div>

    <v-row dense>
      <v-col cols="6" class="label-col">Подгруппа:</v-col>
      <v-col cols="6" class="value-col">{{ exercise.subcategory }}</v-col>

      <v-col cols="6" class="label-col">Основная мышца:</v-col>
      <v-col cols="6" class="value-col">{{ exercise.mainMuscle }}</v-col>

      <v-col cols="6" class="label-col">Дополнительные мышцы:</v-col>
      <v-col cols="6" class="value-col">{{ exercise.additionalMuscles || '—' }}</v-col>

      <v-col cols="6" class="label-col">Тип упражнения:</v-col>
      <v-col cols="6" class="value-col">{{ exercise.typeExercise || '—' }}</v-col>

      <v-col cols="6" class="label-col">Оборудование:</v-col>
      <v-col cols="6" class="value-col">{{ exercise.equipment || '—' }}</v-col>

      <v-col cols="6" class="label-col">Предупреждение по GIF:</v-col>
      <v-col cols="6" class="value-col">
        <span v-if="exercise.isWarnGif">Да</span>
        <span v-else>Нет</span>
      </v-col>

      <v-col cols="12" class="label-col" style="margin-top:10px; font-weight:bold;">
        Техника выполнения:
      </v-col>
      <v-col cols="12" class="value-col">
        <p style="white-space: pre-wrap; margin:0;">
          {{ exercise.technique || '—' }}
        </p>
      </v-col>

      <v-col cols="6" class="label-col">При проблемах со спиной:</v-col>
      <v-col cols="6" class="value-col">
        <span v-if="exercise.spineRestrictions">Не рекомендуется</span>
        <span v-else>Можно</span>
      </v-col>

      <v-col cols="6" class="label-col">При проблемах с коленями:</v-col>
      <v-col cols="6" class="value-col">
        <span v-if="exercise.kneeRestrictions">Не рекомендуется</span>
        <span v-else>Можно</span>
      </v-col>

      <v-col cols="6" class="label-col">При проблемах с плечами:</v-col>
      <v-col cols="6" class="value-col">
        <span v-if="exercise.shoulderRestrictions">Не рекомендуется</span>
        <span v-else>Можно</span>
      </v-col>
      <p style="color: gray">Не является медицинской рекомендацией, при травмах стоит обратиться к врачу, чтобы травма не переходила из острой фазы в хроническую.</p>
    </v-row>

  </v-card-text>
  </BottomSheetWithClose>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { Exercise } from '~/composables/types';
import BottomSheetWithClose from '~/components/shared/BottomSheetWithClose.vue'; // Импортируем универсальный компонент

export default defineComponent({
  name: 'ExerciseInfo',
  components: {
    BottomSheetWithClose
  },
  props: {
    exercise: {
      type: Object as () => Exercise | null,
      default: null
    },
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // Создаём реактивное состояние для v-model
    const modelValueLocal = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val)
    });

    // Метод для закрытия нижнего листа
    const close = () => {
      modelValueLocal.value = false;
    };

    // Метод для получения полного URL GIF
    const getGifUrl = (gifPath: string): string => {
      // Предполагается, что gifPath — это относительный путь
      if (gifPath.startsWith('/')) {
        return gifPath;
      } else {
        return '/' + gifPath;
      }
    };

    return {
      modelValueLocal,
      close,
      getGifUrl
    };
  }
});
</script>

<style scoped>
.label-col {
  font-size: 0.8rem;
  color: gray;
  text-align: right;
}

.value-col {
  font-size: 1rem;
  font-weight: bold;
  text-align: left;
}

.headline {
  font-size: 1.2rem;
  font-weight: bold;
}

.headline.mb-4 {
  margin-bottom: 16px;
}

.gif-container {
  text-align: center;
  margin-top: 20px;
}

.exercise-gif {
  max-width: 100%;
  height: auto;
  border-radius: 16px;
}
</style>
