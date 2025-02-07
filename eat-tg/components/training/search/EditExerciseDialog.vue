<template>
  <v-dialog v-model="visible">
    <v-card>
      <v-card-title class="d-flex justify-between align-center">
        <span class="headline">Редактировать упражнение</span>
        <v-btn icon @click="onClose" aria-label="Закрыть">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <input type="hidden" v-model="localEditExercise._id" />
        <v-text-field
            hide-details="auto"
            variant="solo-filled"
            label="Название упражнения"
            v-model="localEditExercise.name"
            required
        />
        <v-text-field
            hide-details="auto"
            variant="solo-filled"
            label="Подгруппа"
            v-model="localEditExercise.subcategory"
            required
        />
        <v-text-field
            hide-details="auto"
            variant="solo-filled"
            label="Основная мышца"
            v-model="localEditExercise.mainMuscle"
            required
        />
        <v-text-field
            hide-details="auto"
            variant="solo-filled"
            label="Дополнительные мышцы"
            v-model="localEditExercise.additionalMuscles"
        />
        <v-text-field
            hide-details="auto"
            variant="solo-filled"
            label="Тип упражнения"
            v-model="localEditExercise.typeExercise"
        />
        <v-text-field
            hide-details="auto"
            variant="solo-filled"
            label="Оборудование"
            v-model="localEditExercise.equipment"
            required
        />
        <v-checkbox
            hide-details="auto"
            label="Предупреждение по GIF"
            v-model="localEditExercise.isWarnGif"
        />
        <v-textarea
            hide-details="auto"
            variant="solo-filled"
            label="Техника выполнения"
            v-model="localEditExercise.technique"
        />
        <v-checkbox
            hide-details="auto"
            label="При проблемах со спиной"
            v-model="localEditExercise.spineRestrictions"
        />
        <v-checkbox
            hide-details="auto"
            label="При проблемах с коленями"
            v-model="localEditExercise.kneeRestrictions"
        />
        <v-checkbox
            hide-details="auto"
            label="При проблемах с плечами"
            v-model="localEditExercise.shoulderRestrictions"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="onClose">Отмена</v-btn>
        <v-btn color="primary" @click="onSaveExercise">Сохранить</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import type { Exercise } from '../../../composables/types';
export default defineComponent({
  name: 'EditExerciseDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    exerciseData: {
      type: Object as () => Partial<Exercise>,
      default: () => ({}),
    },
  },
  emits: ['update:modelValue', 'save-exercise'],
  setup(props, { emit }) {
    const localEditExercise = ref<Partial<Exercise>>({});

    watch(
        () => props.exerciseData,
        (newVal) => {
          localEditExercise.value = { ...newVal };
        },
        { immediate: true }
    );

    const onClose = () => {
      emit('update:modelValue', false);
    };

    const onSaveExercise = () => {
      if (
          !localEditExercise.value.name ||
          !localEditExercise.value.subcategory ||
          !localEditExercise.value.mainMuscle ||
          !localEditExercise.value.equipment
      ) {
        alert('Заполните обязательные поля.');
        return;
      }
      emit('save-exercise', localEditExercise.value);
    };

    return { localEditExercise, onClose, onSaveExercise, visible: props.modelValue };
  },
});
</script>
