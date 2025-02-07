<template>
  <BottomSheetWithClose v-model="localShowWorkoutSheet" title="Моя тренировка">
    <v-data-table
        :items="workoutResults"
        class="rounded-bottom-sheet fixed-table-layout"
        hide-default-header
        hide-default-footer
    >
      <draggable
          tag="tbody"
          v-model="localWorkoutResults"
          handle=".drag-handle"
          animation="200"
          item-key="_id"
          @end="onReorder"
      >
        <template #item="{ element, index }">
          <tr class="pa-2">
            <td class="action-handle">
              <div class="drag-handle" style="display: flex; align-items: center;">
                <v-icon class="mr-1">mdi-shuffle-variant</v-icon>
              </div>
            </td>
            <td class="drag-handle" style="padding: 0 4px;">
              {{ formatExerciseName(element.name) }}
            </td>
            <td class="fixed-width sets-reps-column" style="padding: 0 4px;">
              <div class="sets-reps-container">
                <v-btn
                    icon
                    @click="decreaseReps(index)"
                    variant="plain"
                    class="mx-0"
                    size="24px"
                    color="#db5856"
                >
                  <v-icon small>mdi-minus</v-icon>
                </v-btn>
                <span class="sets-reps-text">
                  {{ element.sets }} × {{ element.reps }}
                </span>
                <v-btn
                    icon
                    size="24px"
                    color="#77dd77"
                    @click="increaseReps(index)"
                    variant="plain"
                    class="mx-0"
                >
                  <v-icon small>mdi-plus</v-icon>
                </v-btn>
              </div>
            </td>
            <td class="fixed-width action-column" style="padding: 0 4px;">
              <div style="display: flex; flex-direction: column; align-items: center;">
                <v-btn
                    icon
                    @click="removeExercise(index)"
                    variant="plain"
                    size="24px"
                    color="#db5856"
                    class="my-1"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </td>
          </tr>
        </template>
      </draggable>
    </v-data-table>

    <v-dialog v-model="localShowSendWorkoutDialog">
      <v-card style="border-radius: 16px;">
        <v-card-title class="headline">Отправить тренировку</v-card-title>
        <v-card-text>
          <v-text-field
              label="Название тренировки обязательно"
              v-model="localSendWorkoutData.splitName"
              required
              variant="outlined"
          ></v-text-field>
          <v-textarea
              label="Описание и комментарии к тренировке опционально"
              v-model="localSendWorkoutData.splitComment"
              variant="outlined"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closeSendWorkoutDialog">Назад</v-btn>
          <v-btn color="primary" @click="confirmSendWorkout">Отправить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div class="text-center mt-3 mb-2">
      <v-btn color="primary" rounded="lg" @click="openSendWorkoutDialog" :disabled="!telegramUserId">
        <v-icon left>mdi-send</v-icon>
        Отправить себе
      </v-btn>
    </div>
  </BottomSheetWithClose>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import draggable from 'vuedraggable';
import BottomSheetWithClose from '../../shared/BottomSheetWithClose.vue';
export default defineComponent({
  name: 'WorkoutSheet',
  components: {
    draggable,
    BottomSheetWithClose,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    workoutResults: {
      type: Array,
      required: true,
    },
    telegramUserId: {
      type: [Number, String],
      default: null,
    },
    formatExerciseName: {
      type: Function,
      required: true,
    },
  },
  emits: [
    'update:modelValue',
    'increase-reps',
    'decrease-reps',
    'remove-exercise',
    'reorder-workout',
    'confirm-send-workout',
  ],
  setup(props, { emit }) {
    const localShowWorkoutSheet = ref(props.modelValue);
    watch(
        () => props.modelValue,
        (newVal) => {
          localShowWorkoutSheet.value = newVal;
        }
    );
    watch(localShowWorkoutSheet, (newVal) => {
      emit('update:modelValue', newVal);
    });

    const localWorkoutResults = ref([...props.workoutResults]);
    watch(
        () => props.workoutResults,
        (newVal) => {
          localWorkoutResults.value = [...newVal];
        }
    );
    watch(
        localWorkoutResults,
        (newVal) => {
          emit('reorder-workout', newVal);
        },
        { deep: true }
    );

    const increaseReps = (index: number) => {
      emit('increase-reps', index);
    };
    const decreaseReps = (index: number) => {
      emit('decrease-reps', index);
    };
    const removeExercise = (index: number) => {
      emit('remove-exercise', index);
    };
    const onReorder = () => {
      emit('reorder-workout', localWorkoutResults.value);
    };

    const localShowSendWorkoutDialog = ref(false);
    const localSendWorkoutData = ref({
      splitName: '',
      splitComment: '',
    });

    const openSendWorkoutDialog = () => {
      localSendWorkoutData.value = { splitName: '', splitComment: '' };
      localShowSendWorkoutDialog.value = true;
    };
    const closeSendWorkoutDialog = () => {
      localShowSendWorkoutDialog.value = false;
    };
    const confirmSendWorkout = () => {
      if (!localSendWorkoutData.value.splitName.trim()) {
        alert('Пожалуйста, введите название сплита.');
        return;
      }
      emit('confirm-send-workout', localSendWorkoutData.value);
      closeSendWorkoutDialog();
    };

    return {
      localShowWorkoutSheet,
      localWorkoutResults,
      increaseReps,
      decreaseReps,
      removeExercise,
      onReorder,
      localShowSendWorkoutDialog,
      localSendWorkoutData,
      openSendWorkoutDialog,
      closeSendWorkoutDialog,
      confirmSendWorkout,
    };
  },
});
</script>

<style scoped>
.rounded-bottom-sheet {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
}
.fixed-table-layout {
  table-layout: fixed;
  width: 100%;
}
.sets-reps-column {
  width: 116px;
  text-align: right;
}
.action-column {
  width: 60px;
  max-width: 60px;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
}
.action-handle {
  width: 40px;
  text-align: center;
}
.sets-reps-container {
  display: flex;
  align-items: center;
  justify-content: center;
}
.sets-reps-container .v-btn {
  min-width: 24px;
  width: 24px;
  height: 24px;
  margin: 0 4px;
}
.sets-reps-text {
  font-weight: bold;
  min-width: 60px;
  text-align: center;
  color: #ececec;
  background-color: #444;
  border-radius: 14px;
  padding: 2px 6px;
  margin: 0 4px;
  box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.5);
}
</style>
