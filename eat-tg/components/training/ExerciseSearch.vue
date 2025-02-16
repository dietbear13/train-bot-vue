<!--training/ExerciseSearch-->

<template>
  <div style="background-color: #121212">
    <!-- Строка поиска + кнопка добавления (для админа) -->
    <SearchBar
        v-model="searchQuery"
        :isAdmin="isAdmin"
        @open-add-exercise-dialog="openAddExerciseDialog"
    />

    <!-- Блок с фильтрами (раскрывающийся) -->
    <ExerciseFilters
        v-model="selectedFilters"
        :exercises="exercises"
    />

    <!-- Фиксированная кнопка открытия BottomSheet -->
    <v-btn
        icon
        @click="toggleWorkoutSheet"
        variant="tonal"
        class="sticky-workout-btn"
        elevation="2"
    >
      <v-badge :content="workoutResults.length" color="primary" overlap>
        <template #badge>
          <span v-if="workoutResults.length > 0">{{ workoutResults.length }}</span>
        </template>
        <v-icon size="28">mdi-dumbbell</v-icon>
      </v-badge>
    </v-btn>

    <!-- Список упражнений -->
    <ExerciseList
        :exercises="displayedExercises"
        :isLoading="isLoading"
        :isAdmin="isAdmin"
        :justAdded="justAdded"
        :formatExerciseName="formatExerciseName"
        @edit-exercise="editExercise"
        @confirm-delete-exercise="confirmDeleteExercise"
        @add-to-workout="addToWorkout"
        @open-exercise-info="openExerciseInfo"
    />

    <!-- Компонент информации об упражнении -->
    <ExerciseInfo :exercise="selectedExercise" v-model="showExerciseInfo" />

    <!-- BottomSheet для тренировки -->
    <WorkoutSheet
        v-model="showWorkoutSheet"
        :workoutResults="workoutResults"
        :telegramUserId="telegramUserId"
        :formatExerciseName="formatExerciseName"
        @increase-reps="increaseReps"
        @decrease-reps="decreaseReps"
        @remove-exercise="removeExercise"
        @reorder-workout="onWorkoutReorder"
        @confirm-send-workout="confirmSendWorkoutFromSheet"
    />

    <!-- Snackbar -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="1500" top right>
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useUserStore } from '../../stores/userStore';
import { useExerciseFilter } from '../../composables/useExerciseFilter';
import type { Exercise } from '../../composables/types';
import ExerciseInfo from './ExerciseInfo.vue';
import { useApi } from '../../composables/useApi';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

import SearchBar from './search/SearchBar.vue';
import ExerciseList from './search/ExerciseList.vue';
import WorkoutSheet from './search/WorkoutSheet.vue';
import ExerciseFilters from './search/ExerciseFilters.vue';

interface WorkoutItem extends Exercise {
  sets: number;
  reps: number;
}

defineProps({
  tab: {
    type: String,
    default: 'exercise-search'
  }
})


export default defineComponent({
  name: 'ExerciseSearch',
  components: {
    SearchBar,
    ExerciseList,
    ExerciseInfo,
    WorkoutSheet,
    ExerciseFilters,
  },
  setup() {
    const { apiRequest } = useApi();

    // Инициализация данных пользователя
    const initData = ref<any>(null);
    const userData = ref<any>(null);

    const repScale = [5, 6, 8, 10, 12, 15, 20, 24, 30, 45, 60, 75, 90, 105, 120];

    // Основной список упражнений и поисковый запрос
    const exercises = ref<Exercise[]>([]);
    const searchQuery = ref('');
    const isLoading = ref(true);

    // Новый объект для выбранных фильтров (начальные значения — пустые строки)
    const selectedFilters = ref({
      typeExercise: '',
      category: '',
      equipment: '',
    });

    // Хук фильтрации с дополнительными фильтрами
    const { filteredExercises, displayedExercises } = useExerciseFilter(
        exercises,
        searchQuery,
        selectedFilters
    );

    // Получаем данные пользователя (Telegram) через store
    const userStore = useUserStore();
    const telegramUserId = ref<number | null>(null);

    const isAdmin = computed(() => userStore.role === 'admin');

    // Состояния модальных окон и информации
    const showExerciseInfo = ref(false);
    const selectedExercise = ref<Exercise | null>(null);
    const showExerciseGif = ref(false);

    const showAddExerciseDialog = ref(false);
    const newExercise = ref<Partial<Exercise>>({});
    const showEditExerciseDialog = ref(false);
    const editExerciseData = ref<Partial<Exercise>>({});

    const showDeleteConfirmDialog = ref(false);
    const exerciseToDelete = ref<Exercise | null>(null);

    // Для отправки тренировки
    const showSendWorkoutDialog = ref(false);
    const sendWorkoutData = ref({
      splitName: '',
      splitComment: '',
    });

    // Snackbar
    const showSnackbar = ref(false);
    const snackbarMessage = ref('');
    const snackbarColor = ref('success');

    // Массив упражнений в тренировке
    const workoutResults = ref<WorkoutItem[]>([]);
    const showWorkoutSheet = ref(false);
    const justAdded = ref<Record<string, boolean>>({});

    // Загрузка упражнений
    const loadExercises = async () => {
      try {
        const data = await apiRequest<Exercise[]>('get', 'exercises');
        exercises.value = data;
      } catch (error: any) {
        console.error('Ошибка:', error.message);
        alert('Не удалось загрузить. Попробуйте позже.');
      } finally {
        isLoading.value = false;
      }
    };

    // Приведение названия упражнения к формату с заглавной буквы
    const formatExerciseName = (rawName: string): string => {
      if (!rawName) return '';
      return rawName.charAt(0).toUpperCase() + rawName.slice(1);
    };

    // Открытие информации об упражнении
    const openExerciseInfo = (exercise: Exercise) => {
      selectedExercise.value = exercise;
      showExerciseInfo.value = true;
      if (exercise.gifImage) showExerciseGif.value = true;
    };

    // Открытие диалога добавления упражнения
    const openAddExerciseDialog = () => {
      newExercise.value = {};
      showAddExerciseDialog.value = true;
    };

    // Добавление упражнения (вызывается из диалога добавления)
    const addExercise = async (exerciseData: Partial<Exercise>) => {
      try {
        if (
            !exerciseData.name ||
            !exerciseData.subcategory ||
            !exerciseData.mainMuscle ||
            !exerciseData.equipment
        ) {
          alert('Заполните обязательные поля.');
          return;
        }
        const response = await apiRequest<Exercise>('post', 'exercises', exerciseData);
        exercises.value.push(response);
        showAddExerciseDialog.value = false;
        alert('Добавлено.');
      } catch (error: any) {
        console.error('Ошибка при добавлении:', error.message);
        alert('Не удалось добавить.');
      }
    };

    // Редактирование упражнения — открываем диалог
    const editExercise = (exercise: Exercise) => {
      editExerciseData.value = { ...exercise };
      showEditExerciseDialog.value = true;
    };

    // Сохранение изменений (из диалога редактирования)
    const saveExercise = async (exerciseData: Partial<Exercise>) => {
      try {
        if (
            !exerciseData.name ||
            !exerciseData.subcategory ||
            !exerciseData.mainMuscle ||
            !exerciseData.equipment
        ) {
          alert('Заполните обязательные поля.');
          return;
        }
        if (!exerciseData._id) {
          throw new Error('Нет _id упражнения.');
        }
        const updated = await apiRequest<Exercise>(
            'put',
            `exercises/${exerciseData._id}`,
            exerciseData
        );
        const idx = exercises.value.findIndex(ex => ex._id === exerciseData._id);
        if (idx !== -1) {
          exercises.value[idx] = { ...exercises.value[idx], ...updated };
        }
        showEditExerciseDialog.value = false;
        alert('Сохранено.');
      } catch (error: any) {
        console.error('Ошибка:', error.message);
        alert('Не удалось сохранить.');
      }
    };

    // Подтверждение удаления — открываем диалог
    const confirmDeleteExercise = (exercise: Exercise) => {
      exerciseToDelete.value = exercise;
      showDeleteConfirmDialog.value = true;
    };

    const cancelDelete = () => {
      exerciseToDelete.value = null;
      showDeleteConfirmDialog.value = false;
    };

    // Удаление упражнения
    const deleteExercise = async () => {
      if (!exerciseToDelete.value) return;
      try {
        await apiRequest('delete', `exercises/${exerciseToDelete.value._id}`);
        exercises.value = exercises.value.filter(
            ex => ex._id !== exerciseToDelete.value?._id
        );
        showDeleteConfirmDialog.value = false;
        exerciseToDelete.value = null;
        alert('Удалено.');
      } catch (error: any) {
        console.error('Ошибка при удалении:', error.message);
        alert('Не удалось удалить.');
      }
    };

    // Добавление упражнения в тренировку
    const addToWorkout = (exercise: Exercise) => {
      if (workoutResults.value.find(e => e._id === exercise._id)) return;
      let defaultReps = 10;
      let sets = 3;
      if (defaultReps < 5) {
        sets = 5;
      } else if (defaultReps === 6 || defaultReps === 8) {
        sets = 4;
      }
      const newItem: WorkoutItem = {
        ...exercise,
        sets,
        reps: defaultReps,
      };
      workoutResults.value.push(newItem);
      justAdded.value[exercise._id] = true;
      setTimeout(() => {
        justAdded.value[exercise._id] = false;
      }, 1000);
    };

    const removeExercise = (index: number) => {
      workoutResults.value.splice(index, 1);
    };

    const toggleWorkoutSheet = () => {
      showWorkoutSheet.value = !showWorkoutSheet.value;
    };

    // При перетаскивании в BottomSheet (draggable)
    const onWorkoutReorder = (newWorkoutResults: WorkoutItem[]) => {
      workoutResults.value = newWorkoutResults;
    };

    // Функция расчёта sets по количеству повторов
    const calcSets = (reps: number): number => {
      if (reps < 5) return 5;
      if (reps === 6 || reps === 8) return 4;
      return 3;
    };

    const increaseReps = (index: number) => {
      const currentReps = workoutResults.value[index].reps;
      const i = repScale.indexOf(currentReps);
      if (i !== -1 && i < repScale.length - 1) {
        const newReps = repScale[i + 1];
        workoutResults.value[index].reps = newReps;
        workoutResults.value[index].sets = calcSets(newReps);
      }
    };

    const decreaseReps = (index: number) => {
      const currentReps = workoutResults.value[index].reps;
      const i = repScale.indexOf(currentReps);
      if (i !== -1 && i > 0) {
        const newReps = repScale[i - 1];
        workoutResults.value[index].reps = newReps;
        workoutResults.value[index].sets = calcSets(newReps);
      }
    };

    // Отправка тренировки (логика остаётся в основном компоненте)
    const sendWorkout = async () => {
      if (!telegramUserId.value || !workoutResults.value.length) {
        alert('Нет Telegram ID или пустая тренировка.');
        return;
      }
      try {
        const plan = [
          {
            dayName: '',
            exercises: workoutResults.value.map(ex => ({
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
            })),
          },
        ];
        const payload = {
          userId: telegramUserId.value,
          splitName: sendWorkoutData.value.splitName,
          splitComment: sendWorkoutData.value.splitComment,
          plan,
        };
        await apiRequest('post', 'bot/send-workout', payload);
        snackbarMessage.value = 'Тренировка успешно отправлена!';
        snackbarColor.value = 'success';
        showSnackbar.value = true;
      } catch (error: any) {
        console.error('Ошибка при отправке:', error);
        snackbarMessage.value =
            'Не удалось отправить тренировку. Попробуйте позже.';
        snackbarColor.value = 'error';
        showSnackbar.value = true;
      }
    };

    // При подтверждении отправки из WorkoutSheet – передаём данные и вызываем sendWorkout
    const confirmSendWorkoutFromSheet = (payload: { splitName: string; splitComment: string }) => {
      sendWorkoutData.value = payload;
      sendWorkout();
    };

    onMounted(() => {
      if (process.client) {
        const launchParams = retrieveLaunchParams();
        initData.value = launchParams.initData;
        if (initData.value && initData.value.user) {
          userData.value = initData.value.user;
          telegramUserId.value = userData.value.id;
        } else {
          console.error('Не удалось получить данные пользователя.');
        }
      }
      console.log('!!! Telegram User ID:', telegramUserId.value);
      loadExercises();
    });

    return {
      searchQuery,
      isLoading,
      displayedExercises,
      formatExerciseName,
      isAdmin,
      openAddExerciseDialog,
      showAddExerciseDialog,
      addExercise,
      showEditExerciseDialog,
      editExerciseData,
      editExercise,
      saveExercise,
      showDeleteConfirmDialog,
      exerciseToDelete,
      confirmDeleteExercise,
      cancelDelete,
      deleteExercise,
      showExerciseInfo,
      selectedExercise,
      openExerciseInfo,
      workoutResults,
      showWorkoutSheet,
      justAdded,
      addToWorkout,
      removeExercise,
      toggleWorkoutSheet,
      onWorkoutReorder,
      increaseReps,
      decreaseReps,
      telegramUserId,
      showSnackbar,
      snackbarMessage,
      snackbarColor,
      confirmSendWorkoutFromSheet,
      selectedFilters,
      exercises,
    };
  },
});
</script>

<style scoped>
.exercise-title {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
}
.dark-background {
  background-color: #f5f5f5;
}
.v-list {
  padding: 0;
}
.v-list-item {
  padding: 8px 16px;
}
.v-list-item-title {
  font-weight: bold;
}
.v-divider {
  margin: 0;
}
.v-chip {
  margin-right: 8px;
  border-radius: 14px;
}
.v-list-item-action .v-btn {
  margin: 0;
}
.admin-buttons {
  display: flex;
  align-items: center;
}
.admin-buttons .v-btn {
  margin-right: 4px;
}
.admin-actions {
  margin: 16px 0;
}
.sticky-workout-btn {
  position: fixed;
  right: 16px;
  top: 180px;
  z-index: 9;
  border-radius: 16px !important;
}
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
.v-btn {
  border-radius: 14px;
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
.dragging {
  opacity: 0.5;
}
</style>
