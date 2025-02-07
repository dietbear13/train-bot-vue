<template>
  <v-dialog v-model="visible">
    <v-card>
      <v-card-title class="d-flex justify-between align-center">
        <span class="headline">Добавить упражнение</span>
        <v-btn icon @click="onClose" aria-label="Закрыть">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-text-field
            hide-details="auto"
            variant="solo-filled"
            label="Название упражнения"
            v-model="localNewExercise.name"
            required
        />
        <v-text-field
            hide-details="auto"
            variant="solo-filled"
            label="Подгруппа"
            v-model="localNewExercise.subcategory"
            required
        />
        <v-text-field
            hide-details="auto"
            variant="solo-filled"
            label="Основная мышца"
            v-model="localNewExercise.mainMuscle"
            required
        />
        <v-text-field
            hide-details="auto"
            variant="solo-filled"
            label="Дополнительные мышцы"
            v-model="localNewExercise.additionalMuscles"
        />
        <v-text-field
            hide-details="auto"
            variant="solo-filled"
            label="Тип упражнения"
            v-model="localNewExercise.typeExercise"
        />
        <v-text-field
            hide-details="auto"
            variant="solo-filled"
            label="Оборудование"
            v-model="localNewExercise.equipment"
            required
        />
        <v-checkbox
            hide-details="auto"
            label="Предупреждение по GIF"
            v-model="localNewExercise.isWarnGif"
        />
        <v-textarea
            hide-details="auto"
            label="Техника выполнения"
            v-model="localNewExercise.technique"
        />
        <v-checkbox
            hide-details="auto"
            label="При проблемах со спиной"
            v-model="localNewExercise.spineRestrictions"
        />
        <v-checkbox
            hide-details="auto"
            label="При проблемах с коленями"
            v-model="localNewExercise.kneeRestrictions"
        />
        <v-checkbox
            hide-details="auto"
            label="При проблемах с плечами"
            v-model="localNewExercise.shoulderRestrictions"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="onClose">Отмена</v-btn>
        <v-btn color="primary" @click="onAddExercise">Добавить</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import type { Exercise } from '../../../composables/types';
export default defineComponent({
  name: 'AddExerciseDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:modelValue', 'add-exercise'],
  setup(props, { emit }) {
    const localNewExercise = ref<Partial<Exercise>>({});

    watch(
        () => props.modelValue,
        (newVal) => {
          if (newVal) {
            localNewExercise.value = {};
          }
        }
    );

    const onClose = () => {
      emit('update:modelValue', false);
    };

    const onAddExercise = () => {
      if (
          !localNewExercise.value.name ||
          !localNewExercise.value.subcategory ||
          !localNewExercise.value.mainMuscle ||
          !localNewExercise.value.equipment
      ) {
        alert('Заполните обязательные поля.');
        return;
      }
      emit('add-exercise', localNewExercise.value);
    };

    return { localNewExercise, onClose, onAddExercise, visible: props.modelValue };
  },
});
</script>
