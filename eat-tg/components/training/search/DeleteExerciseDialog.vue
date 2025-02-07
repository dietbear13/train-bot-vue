<template>
  <v-dialog v-model="visible">
    <v-card>
      <v-card-title class="d-flex justify-between align-center">
        <span class="headline">Подтверждение удаления</span>
        <v-btn icon @click="onClose" aria-label="Закрыть">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        Вы уверены, что хотите удалить упражнение "{{ formattedName }}"?
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="onCancel">Отмена</v-btn>
        <v-btn color="red" @click="onDelete">Удалить</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { Exercise } from '../../../composables/types';
export default defineComponent({
  name: 'DeleteExerciseDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    exercise: {
      type: Object as () => Exercise | null,
      default: null,
    },
  },
  emits: ['update:modelValue', 'delete-exercise', 'cancel-delete'],
  setup(props, { emit }) {
    const formattedName = computed(() => {
      if (!props.exercise?.name) return '';
      return props.exercise.name.charAt(0).toUpperCase() + props.exercise.name.slice(1);
    });

    const onClose = () => {
      emit('update:modelValue', false);
    };

    const onDelete = () => {
      emit('delete-exercise');
    };

    const onCancel = () => {
      emit('cancel-delete');
    };

    return { formattedName, onClose, onDelete, onCancel, visible: props.modelValue };
  },
});
</script>
