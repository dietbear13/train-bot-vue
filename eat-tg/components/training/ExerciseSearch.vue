<!-- components/ExerciseSearch.vue -->
<template>
  <div>
    <!-- Поисковая строка -->
    <v-text-field
        v-model="searchQuery"
        label="Вводи упражнение"
        @input="onSearchInput"
        clearable
        class="my-0 dark-background pa-1"
        variant="outlined"
        hide-details="auto"
    ></v-text-field>

    <!-- Кнопка добавления упражнения (только для администратора) -->
    <div v-if="isAdmin" class="admin-actions">
      <v-btn color="primary" @click="openAddExerciseDialog">
        <v-icon left>mdi-plus</v-icon>
        Добавить упражнение
      </v-btn>
    </div>

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

    <!-- Список упражнений или индикатор загрузки -->
    <v-card class="ma-0 dark-background pa-2" variant="tonal">
      <template v-if="isLoading">
        <v-skeleton-loader
            type="list-item"
            class="my-2"
            v-for="n in 5"
            :key="n"
        />
      </template>
      <template v-else>
        <v-list-item
            v-for="exercise in displayedExercises"
            :key="exercise._id"
            class="exercise-item"
        >
          <v-list-item-title class="exercise-title">
            {{ formatExerciseName(exercise.name) }}
          </v-list-item-title>
          <v-list-item-action>
            <v-chip class="mr-2" small color="primary" text-color="white">
              {{ exercise.mainMuscle }}
            </v-chip>
            <v-chip class="mr-2" small color="gray" text-color="white">
              {{ exercise.typeExercise }}
            </v-chip>

            <!-- Кнопки для администратора -->
            <div v-if="isAdmin" class="admin-buttons">
              <v-btn icon @click="editExercise(exercise)" variant="plain">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon @click="confirmDeleteExercise(exercise)" variant="plain">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>

            <!-- Кнопка добавления в тренировку -->
            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <v-btn
                    icon
                    variant="plain"
                    v-bind="attrs"
                    v-on="on"
                    @click="addToWorkout(exercise)"
                >
                  <!-- Показываем "mdi-plus" или "mdi-check" на 1 сек после добавления -->
                  <v-icon color="green" v-if="!justAdded[exercise._id]">
                    mdi-plus
                  </v-icon>
                  <v-icon color="green" v-else>
                    mdi-check
                  </v-icon>
                </v-btn>
              </template>
              <span>Добавить в тренировку</span>
            </v-tooltip>

            <!-- Кнопка информации об упражнении -->
            <v-tooltip bottom>
              <template #activator="slotProps">
                <v-btn
                    variant="plain"
                    icon
                    @click="openExerciseInfo(exercise)"
                    :title="'Информация о ' + formatExerciseName(exercise.name)"
                    aria-label="Информация об упражнении"
                    v-bind="slotProps.attrs"
                    v-on="slotProps.on"
                >
                  <v-icon>mdi-information-outline</v-icon>
                </v-btn>
              </template>
              <span>Подробнее</span>
            </v-tooltip>
          </v-list-item-action>
        </v-list-item>
        <v-divider></v-divider>
      </template>
    </v-card>

    <!-- Компонент ExerciseInfo -->
    <ExerciseInfo
        :exercise="selectedExercise"
        v-model="showExerciseInfo"
    />

    <!-- Диалог добавления упражнения -->
    <v-dialog v-model="showAddExerciseDialog">
      <v-card>
        <v-card-title class="d-flex justify-between align-center">
          <span class="headline">Добавить упражнение</span>
          <v-btn icon @click="closeAddExerciseDialog" aria-label="Закрыть">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Название упражнения"
              v-model="newExercise.name"
              required
          />
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Подгруппа"
              v-model="newExercise.subcategory"
              required
          />
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Основная мышца"
              v-model="newExercise.mainMuscle"
              required
          />
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Дополнительные мышцы"
              v-model="newExercise.additionalMuscles"
          />
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Тип упражнения"
              v-model="newExercise.typeExercise"
          />
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Оборудование"
              v-model="newExercise.equipment"
              required
          />
          <v-checkbox
              hide-details="auto"
              label="Предупреждение по GIF"
              v-model="newExercise.isWarnGif"
          />
          <v-textarea
              hide-details="auto"
              label="Техника выполнения"
              v-model="newExercise.technique"
          />
          <v-checkbox
              hide-details="auto"
              label="При проблемах со спиной"
              v-model="newExercise.spineRestrictions"
          />
          <v-checkbox
              hide-details="auto"
              label="При проблемах с коленями"
              v-model="newExercise.kneeRestrictions"
          />
          <v-checkbox
              hide-details="auto"
              label="При проблемах с плечами"
              v-model="newExercise.shoulderRestrictions"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeAddExerciseDialog">Отмена</v-btn>
          <v-btn color="primary" @click="addExercise">Добавить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог редактирования упражнения -->
    <v-dialog v-model="showEditExerciseDialog">
      <v-card>
        <v-card-title class="d-flex justify-between align-center">
          <span class="headline">Редактировать упражнение</span>
          <v-btn icon @click="closeEditExerciseDialog" aria-label="Закрыть">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <input type="hidden" v-model="editExerciseData._id" />

          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Название упражнения"
              v-model="editExerciseData.name"
              required
          />
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Подгруппа"
              v-model="editExerciseData.subcategory"
              required
          />
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Основная мышца"
              v-model="editExerciseData.mainMuscle"
              required
          />
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Дополнительные мышцы"
              v-model="editExerciseData.additionalMuscles"
          />
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Тип упражнения"
              v-model="editExerciseData.typeExercise"
          />
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Оборудование"
              v-model="editExerciseData.equipment"
              required
          />
          <v-checkbox
              hide-details="auto"
              label="Предупреждение по GIF"
              v-model="editExerciseData.isWarnGif"
          />
          <v-textarea
              hide-details="auto"
              variant="solo-filled"
              label="Техника выполнения"
              v-model="editExerciseData.technique"
          />
          <v-checkbox
              hide-details="auto"
              label="При проблемах со спиной"
              v-model="editExerciseData.spineRestrictions"
          />
          <v-checkbox
              hide-details="auto"
              label="При проблемах с коленями"
              v-model="editExerciseData.kneeRestrictions"
          />
          <v-checkbox
              hide-details="auto"
              label="При проблемах с плечами"
              v-model="editExerciseData.shoulderRestrictions"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeEditExerciseDialog">Отмена</v-btn>
          <v-btn color="primary" @click="saveExercise">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог подтверждения удаления -->
    <v-dialog v-model="showDeleteConfirmDialog">
      <v-card>
        <v-card-title class="d-flex justify-between align-center">
          <span class="headline">Подтверждение удаления</span>
          <v-btn icon @click="closeDeleteConfirmDialog" aria-label="Закрыть">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          Вы уверены, что хотите удалить упражнение "{{ formatExerciseName(exerciseToDelete?.name) }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="cancelDelete">Отмена</v-btn>
          <v-btn color="red" @click="deleteExercise">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- BottomSheetWithClose для тренировки -->
    <BottomSheetWithClose
        v-model="showWorkoutSheet"
        title="Моя тренировка"
    >
      <v-data-table
          :items="workoutResults"
          class="rounded-bottom-sheet fixed-table-layout"
          hide-default-header
          hide-default-footer
      >
        <draggable
            tag="tbody"
            v-model="workoutResults"
            handle=".drag-handle"
            animation="200"
            item-key="_id"
            @end="onWorkoutReorder"
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

              <!-- Колонка sets × reps -->
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

              <!-- Кнопки "обновить" и "удалить" -->
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

      <!-- Диалог для ввода названия и комментария сплита -->
      <v-dialog v-model="showSendWorkoutDialog">
        <v-card style="border-radius: 16px;">
          <v-card-title class="headline">Отправить тренировку</v-card-title>
          <v-card-text>
            <v-text-field
                label="Название тренировки обязательно"
                v-model="sendWorkoutData.splitName"
                required
                variant="outlined"
            ></v-text-field>
            <v-textarea
                label="Описание и комментарии к тренировке опционально"
                v-model="sendWorkoutData.splitComment"
                variant="outlined"
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closeSendWorkoutDialog">Назад</v-btn>
            <v-btn color="primary" @click="confirmSendWorkout">Отправить</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Кнопка "Отправить себе" -->
      <div class="text-center mt-3 mb-2">
        <v-btn
            color="primary"
            rounded="lg"
            @click="openSendWorkoutDialog"
            :disabled="!telegramUserId"
        >
          <v-icon left>mdi-send</v-icon>
          Отправить себе
        </v-btn>
      </div>
    </BottomSheetWithClose>

    <!-- Добавленный Snackbar -->
    <v-snackbar
        v-model="showSnackbar"
        :color="snackbarColor"
        timeout="1500"
        top
        right
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useUserStore } from '~/stores/userStore';
import { useExerciseFilter } from '~/composables/useExerciseFilter';
import type { Exercise } from '~/composables/types';
import ExerciseInfo from '~/components/training/ExerciseInfo.vue';
import { useApi } from '~/composables/useApi';
import draggable from 'vuedraggable';
import BottomSheetWithClose from '~/components/shared/BottomSheetWithClose.vue';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

interface WorkoutItem extends Exercise {
  sets: number;
  reps: number;
}

export default defineComponent({
  name: 'ExerciseSearch',
  components: {
    ExerciseInfo,
    draggable,
    BottomSheetWithClose,
  },
  setup() {
    const { apiRequest } = useApi();

    // Инициализация данных из родительского компонента
    const initData = ref<any>(null);
    const userData = ref<any>(null); // Добавлено объявление userData

    // Массив возможных повторений
    const repScale = [3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 45, 60, 75, 90, 105, 120];

    const exercises = ref<Exercise[]>([]);
    const searchQuery = ref('');
    const isLoading = ref(true);

    // Для Telegram отправки
    const userStore = useUserStore();
    const telegramUserId = ref<number | null>(null); // Изменено с computed на ref

    const isAdmin = computed(() => userStore.role === 'admin');

    // Хук для фильтрации
    const { filteredExercises, displayedExercises } = useExerciseFilter(
        exercises,
        searchQuery
    );

    // Состояние модалок
    const showExerciseInfo = ref(false);
    const selectedExercise = ref<Exercise | null>(null);
    const showExerciseGif = ref(false);

    const showAddExerciseDialog = ref(false);
    const newExercise = ref<Partial<Exercise>>({});
    const showEditExerciseDialog = ref(false);
    const editExerciseData = ref<Partial<Exercise>>({});

    const showDeleteConfirmDialog = ref(false);
    const exerciseToDelete = ref<Exercise | null>(null);

    const showSendWorkoutDialog = ref(false);
    const sendWorkoutData = ref({
      splitName: '',
      splitComment: '',
    });

    // Добавленные переменные для Snackbar
    const showSnackbar = ref(false);
    const snackbarMessage = ref('');
    const snackbarColor = ref('success');

    // Метод для открытия диалога отправки
    const openSendWorkoutDialog = () => {
      sendWorkoutData.value = {
        splitName: '',
        splitComment: '',
      };
      showSendWorkoutDialog.value = true;
    };

    // Метод для закрытия диалога отправки
    const closeSendWorkoutDialog = () => {
      showSendWorkoutDialog.value = false;
    };

    // Метод для подтверждения отправки тренировки
    const confirmSendWorkout = () => {
      if (!sendWorkoutData.value.splitName.trim()) {
        alert('Пожалуйста, введите название сплита.');
        return;
      }
      sendWorkout();
      closeSendWorkoutDialog();
    };

    // -----------------------------
    // Массив «текущей тренировки»
    // -----------------------------
    const workoutResults = ref<WorkoutItem[]>([]);

    // Открытие/закрытие BottomSheet
    const showWorkoutSheet = ref(false);

    // Для эффекта "mdi-check"
    const justAdded = ref<Record<string, boolean>>({});

    // -----------------------------
    // Отправить себе
    // -----------------------------
    const sendWorkout = async () => {
      if (!telegramUserId.value || !workoutResults.value.length) {
        alert('Нет Telegram ID или пустая тренировка.');
        return;
      }
      try {
        // Формирование плана в формате, ожидаемом сервером
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
        await apiRequest('post', 'send-workout', payload);

        // Установка сообщения и отображение Snackbar
        snackbarMessage.value = 'Тренировка успешно отправлена!';
        snackbarColor.value = 'success'; // Можно использовать 'error' для ошибок
        showSnackbar.value = true;
      } catch (error: any) {
        console.error('Ошибка при отправке:', error);
        // Установка сообщения об ошибке и отображение Snackbar
        snackbarMessage.value = 'Не удалось отправить тренировку. Попробуйте позже.';
        snackbarColor.value = 'error';
        showSnackbar.value = true;
      }
    };

    // -----------------------------
    // Добавление упражнения
    // sets и reps по умолчанию
    // reps = 10 (по условию)
    // -----------------------------
    const addToWorkout = (exercise: Exercise) => {
      // Проверяем, нет ли упражнения
      if (workoutResults.value.find(e => e._id === exercise._id)) return;

      // По умолчанию reps = 10
      const defaultReps = 10;
      // sets рассчитываем согласно условию
      // - меньше 5 => 5
      // - если 6 или 8 => 4
      // - иначе => 3
      let sets = 3;
      if (defaultReps < 5) {
        sets = 5;
      } else if (defaultReps === 6 || defaultReps === 8) {
        sets = 4;
      }
      // (иначе 3)

      const newItem: WorkoutItem = {
        ...exercise,
        sets,
        reps: defaultReps,
      };
      workoutResults.value.push(newItem);

      // Мигаем чекбоксом
      justAdded.value[exercise._id] = true;
      setTimeout(() => {
        justAdded.value[exercise._id] = false;
      }, 1000);
    };

    // Удаление по индексу
    const removeExercise = (index: number) => {
      workoutResults.value.splice(index, 1);
    };

    // Переключение BottomSheet
    const toggleWorkoutSheet = () => {
      showWorkoutSheet.value = !showWorkoutSheet.value;
    };

    // При окончании перетаскивания
    const onWorkoutReorder = () => {
      // Можно что-то сделать
    };

    // -----------------------------
    // Логика +/− повторений
    // -----------------------------
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

    // Функция для расчёта sets
    const calcSets = (reps: number): number => {
      if (reps < 5) return 5;
      if (reps === 6 || reps === 8) return 4;
      return 3;
    };

    // Рандомная регенерация (случайные reps из repScale)
    // + пересчитываем sets
    const regenerateExercise = (index: number) => {
      const rndIndex = Math.floor(Math.random() * repScale.length);
      const newReps = repScale[rndIndex];
      workoutResults.value[index].reps = newReps;
      workoutResults.value[index].sets = calcSets(newReps);
    };

    // ----------------------------------
    // CRUD
    // ----------------------------------
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

    const onSearchInput = () => {
      // Логика при вводе
    };

    const openExerciseInfo = (exercise: Exercise) => {
      selectedExercise.value = exercise;
      showExerciseInfo.value = true;
      if (exercise.gifImage) showExerciseGif.value = true;
    };

    const closeExerciseInfo = () => {
      showExerciseInfo.value = false;
      showExerciseGif.value = false;
    };

    const openAddExerciseDialog = () => {
      newExercise.value = {};
      showAddExerciseDialog.value = true;
    };

    const closeAddExerciseDialog = () => {
      showAddExerciseDialog.value = false;
    };

    const addExercise = async () => {
      try {
        if (
            !newExercise.value.name ||
            !newExercise.value.subcategory ||
            !newExercise.value.mainMuscle ||
            !newExercise.value.equipment
        ) {
          alert('Заполните обязательные поля.');
          return;
        }
        const response = await apiRequest<Exercise>('post', 'exercises', newExercise.value);
        exercises.value.push(response);
        closeAddExerciseDialog();
        alert('Добавлено.');
      } catch (error: any) {
        console.error('Ошибка при добавлении:', error.message);
        alert('Не удалось добавить.');
      }
    };

    const editExercise = (exercise: Exercise) => {
      editExerciseData.value = { ...exercise };
      showEditExerciseDialog.value = true;
    };

    const closeEditExerciseDialog = () => {
      showEditExerciseDialog.value = false;
      editExerciseData.value = {};
    };

    const saveExercise = async () => {
      try {
        if (
            !editExerciseData.value.name ||
            !editExerciseData.value.subcategory ||
            !editExerciseData.value.mainMuscle ||
            !editExerciseData.value.equipment
        ) {
          alert('Заполните обязательные поля.');
          return;
        }
        if (!editExerciseData.value._id) {
          throw new Error('Нет _id упражнения.');
        }
        const updated = await apiRequest<Exercise>(
            'put',
            `exercises/${editExerciseData.value._id}`,
            editExerciseData.value
        );
        const idx = exercises.value.findIndex(ex => ex._id === editExerciseData.value?._id);
        if (idx !== -1) {
          exercises.value[idx] = { ...exercises.value[idx], ...updated };
        }
        closeEditExerciseDialog();
        alert('Сохранено.');
      } catch (error: any) {
        console.error('Ошибка:', error.message);
        alert('Не удалось сохранить.');
      }
    };

    const confirmDeleteExercise = (exercise: Exercise) => {
      exerciseToDelete.value = exercise;
      showDeleteConfirmDialog.value = true;
    };

    const cancelDelete = () => {
      exerciseToDelete.value = null;
      showDeleteConfirmDialog.value = false;
    };

    const deleteExercise = async () => {
      if (!exerciseToDelete.value) return;
      try {
        await apiRequest('delete', `exercises/${exerciseToDelete.value._id}`);
        exercises.value = exercises.value.filter(ex => ex._id !== exerciseToDelete.value?._id);
        showDeleteConfirmDialog.value = false;
        exerciseToDelete.value = null;
        alert('Удалено.');
      } catch (error: any) {
        console.error('Ошибка при удалении:', error.message);
        alert('Не удалось удалить.');
      }
    };

    const closeDeleteConfirmDialog = () => {
      showDeleteConfirmDialog.value = false;
      exerciseToDelete.value = null;
    };

    onMounted(() => {
      // Инициализация Telegram ID из родительского компонента
      if (process.client) {
        const launchParams = retrieveLaunchParams();
        initData.value = launchParams.initData;
        if (initData.value && initData.value.user) {
          userData.value = initData.value.user;
          telegramUserId.value = userData.value.id; // Установка Telegram ID
          // Также можно обновить userStore, если необходимо
          // userStore.setTelegramId(userData.value.id);
        } else {
          console.error('Не удалось получить данные пользователя.');
        }
      }
      console.log('!!! Telegram User ID:', telegramUserId.value);
      loadExercises();
    });

    const formatExerciseName = (rawName: string): string => {
      if (!rawName) return '';
      return rawName.charAt(0).toUpperCase() + rawName.slice(1);
    };

    return {
      // Основное
      searchQuery,
      isLoading,
      displayedExercises,
      onSearchInput,
      formatExerciseName,

      // Admin
      isAdmin,
      openAddExerciseDialog,
      showAddExerciseDialog,
      closeAddExerciseDialog,
      newExercise,
      addExercise,

      showEditExerciseDialog,
      editExerciseData,
      editExercise,
      closeEditExerciseDialog,
      saveExercise,

      showDeleteConfirmDialog,
      exerciseToDelete,
      confirmDeleteExercise,
      cancelDelete,
      deleteExercise,
      closeDeleteConfirmDialog,

      // Info
      showExerciseInfo,
      selectedExercise,
      showExerciseGif,
      openExerciseInfo,
      closeExerciseInfo,

      // Workout
      workoutResults,
      showWorkoutSheet,
      justAdded,

      addToWorkout,
      removeExercise,
      toggleWorkoutSheet,
      onWorkoutReorder,
      repScale, // Можно если нужно где-то показать
      increaseReps,
      decreaseReps,
      regenerateExercise,
      calcSets,

      // Отправка
      telegramUserId,
      showSendWorkoutDialog,
      sendWorkoutData,
      openSendWorkoutDialog,
      closeSendWorkoutDialog,
      confirmSendWorkout,
      sendWorkout,

      // Добавленные переменные для Snackbar
      showSnackbar,
      snackbarMessage,
      snackbarColor,
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

/* Кнопка справа (под строкой поиска) */
.sticky-workout-btn {
  position: fixed;
  right: 16px;
  top: 180px;
  z-index: 9;
  border-radius: 16px !important;
}

/* Для таблицы в BottomSheet */
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

/* При перетаскивании */
.dragging {
  opacity: 0.5;
}
</style>
