<!-- components/training/ExerciseInfo.vue -->
<template>
  <BottomSheetWithClose
      v-model="modelValueLocal"
      title="Информация об упражнении"
  >
    <v-container class="py-2" fluid>
      <v-card v-if="exercise" class="mx-auto" max-width="700" outlined>
        <!-- Заголовок -->
        <v-card-text class="text-h6 text-center">
          {{ exercise.name ? (exercise.name.charAt(0).toUpperCase() + exercise.name.slice(1)) : '' }}
        </v-card-text>

        <!-- Изображение GIF -->
        <v-img
            v-if="exercise.gifImage"
            :src="getGifUrl(exercise.gifImage)"
            aspect-ratio="16/9"
            class="my-2 rounded-lg"
            :alt="exercise.name ? (exercise.name.charAt(0).toUpperCase() + exercise.name.slice(1)) : 'Упражнение'"
        />

        <!-- Контент упражнения -->
        <v-card-text>
          <v-row>
            <!-- Мышцы -->
            <v-col cols="12" md="6">
              <v-card flat>
                <v-card-title class="d-flex align-center">
                  <v-icon color="primary" class="me-2">mdi-arm-flex</v-icon>
                  <span class="font-weight-bold">Мышцы</span>
                </v-card-title>
                <v-card-text class="pa-0">
                  <v-chip-group column>
                    <!-- Основные мышцы -->
                    <v-chip
                        v-for="(muscle, index) in (exercise.mainMuscle ? exercise.mainMuscle.split(',').map(m => m.trim()) : [])"
                        :key="'main-muscle-' + index"
                        color="primary lighten-4"
                        text-color="primary"
                        outlined
                        class="ma-1"
                    >
                      {{ muscle }}
                    </v-chip>
                    <!-- Дополнительные мышцы -->
                    <v-chip
                        v-if="exercise.additionalMuscles"
                        v-for="(muscle, index) in exercise.additionalMuscles.split(',').map(m => m.trim())"
                        :key="'additional-muscle-' + index"
                        color="secondary lighten-4"
                        text-color="secondary"
                        outlined
                        class="ma-1"
                    >
                      {{ muscle }}
                    </v-chip>
                  </v-chip-group>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Оборудование -->
            <v-col cols="12" md="6">
              <v-card flat>
                <v-card-title class="d-flex align-center">
                  <v-icon color="success" class="me-0">mdi-dumbbell</v-icon>
                  <span class="font-weight-bold">Оборудование:</span>
                </v-card-title>
                <v-card-text class="pa-0">
                  <template v-if="exercise.equipment">
                    <v-chip color="success lighten-4" text-color="success" outlined class="ma-1">
                      {{ exercise.equipment }}
                    </v-chip>
                  </template>
                  <template v-else>
                    <span>—</span>
                  </template>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Техника -->
            <v-col cols="12">
              <v-card flat>
                <v-card-title class="d-flex align-center">
                  <v-icon color="info" class="me-0">mdi-weight-lifter</v-icon>
                  <span class="font-weight-bold">Техника:</span>
                </v-card-title>
                <v-card-text class="pa-0">
                  <template v-if="exercise.technique">
                    <transition name="fade">
                      <div class="technique-text">
                        {{ exercise.technique }}
                      </div>
                    </transition>
                  </template>
                  <template v-else>
                    <span>—</span>
                  </template>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Ограничения при травмах -->
            <v-col cols="12">
              <v-card flat>
                <v-card-title class="d-flex align-center">
                  <v-icon color="error" class="me-0">mdi-alert</v-icon>
                  <span class="font-weight-bold">Ограничения при травмах</span>
                </v-card-title>
                <v-card-text class="pa-0">
                  <v-row>
                    <v-col cols="12" sm="4" class="d-flex align-center">
                      <v-icon
                          :color="exercise.spineRestrictions ? 'red lighten-2' : 'green lighten-2'"
                          class="me-2"
                      >
                        {{ exercise.spineRestrictions ? 'mdi-close-circle' : 'mdi-check-circle' }}
                      </v-icon>
                      Позвоночника:
                      <span :class="exercise.spineRestrictions ? 'text-red' : 'text-green'">
                        {{ exercise.spineRestrictions ? 'не рекомендуется' : 'можно' }}
                      </span>
                    </v-col>
                    <v-col cols="12" sm="4" class="d-flex align-center">
                      <v-icon
                          :color="exercise.kneeRestrictions ? 'red lighten-2' : 'green lighten-2'"
                          class="me-2"
                      >
                        {{ exercise.kneeRestrictions ? 'mdi-close-circle' : 'mdi-check-circle' }}
                      </v-icon>
                      Коленей:
                      <span :class="exercise.kneeRestrictions ? 'text-red' : 'text-green'">
                        {{ exercise.kneeRestrictions ? 'не рекомендуется' : 'можно' }}
                      </span>
                    </v-col>
                    <v-col cols="12" sm="4" class="d-flex align-center">
                      <v-icon
                          :color="exercise.shoulderRestrictions ? 'red lighten-2' : 'green lighten-2'"
                          class="me-2"
                      >
                        {{ exercise.shoulderRestrictions ? 'mdi-close-circle' : 'mdi-check-circle' }}
                      </v-icon>
                      Плеч:
                      <span :class="exercise.shoulderRestrictions ? 'text-red' : 'text-green'">
                        {{ exercise.shoulderRestrictions ? 'не рекомендуется' : 'можно' }}
                      </span>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider class="my-4"></v-divider>

        <v-alert type="warning" border="left" outlined>
          Не является медицинской рекомендацией, при травмах стоит обратиться к врачу.
        </v-alert>

      <!-- Индикатор загрузки -->
      <v-card v-else class="mx-auto" max-width="700" outlined>
        <v-card-text class="d-flex justify-center py-10">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        </v-card-text>
      </v-card>
    </v-container>
  </BottomSheetWithClose>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { Exercise } from '~/composables/types';
import BottomSheetWithClose from '~/components/shared/BottomSheetWithClose.vue';

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
    const modelValueLocal = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val)
    });

    const close = () => {
      modelValueLocal.value = false;
    };

    // Метод для получения полного URL GIF (логика не изменяется)
    const getGifUrl = (gifPath: string): string => {
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

/* Дополнительные стили из шаблона страницы */
.rounded-lg {
  border-radius: 16px;
}

.cursor-pointer {
  cursor: pointer;
}

.technique-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.text-red {
  color: #e53935;
}

.text-green {
  color: #43a047;
}
</style>
