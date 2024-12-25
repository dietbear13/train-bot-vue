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

    <!-- Список упражнений или индикатор загрузки -->
    <v-card class="ma-0 dark-background pa-2" variant="tonal">
      <template v-if="isLoading">
        <!-- Пока данные грузятся, показываем skeleton loader -->
        <v-skeleton-loader
            type="list-item"
            class="my-2"
            v-for="n in 5"
            :key="n"
        />
      </template>
      <template v-else>
        <!-- Если данные загружены, отображаем максимум 50 упражнений -->
        <v-list-item
            v-for="exercise in displayedExercises"
            :key="exercise._id"
            class="exercise-item"
        >
          <v-list-item-title class="exercise-title">
            {{ exercise.name }}
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

            <v-btn variant="plain" icon @click="openExerciseInfo(exercise)">
              <v-icon class="ml-2">mdi-information-outline</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
        <v-divider></v-divider>
      </template>
    </v-card>

    <!-- v-bottom-sheet с информацией об упражнении и GIF -->
    <v-bottom-sheet v-model="showExerciseInfo" max-width="600px">
      <v-card v-if="selectedExercise">
        <v-card-title class="headline">{{ selectedExercise.name }}</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="6" class="label-col">
              Подгруппа:
            </v-col>
            <v-col cols="6" class="value-col">
              {{ selectedExercise.subcategory }}
            </v-col>

            <v-col cols="6" class="label-col">
              Основная мышца:
            </v-col>
            <v-col cols="6" class="value-col">
              {{ selectedExercise.mainMuscle }}
            </v-col>

            <v-col cols="6" class="label-col">
              Дополнительные мышцы:
            </v-col>
            <v-col cols="6" class="value-col">
              {{ selectedExercise.additionalMuscles || '—' }}
            </v-col>

            <v-col cols="6" class="label-col">
              Тип упражнения:
            </v-col>
            <v-col cols="6" class="value-col">
              {{ selectedExercise.typeExercise || '—' }}
            </v-col>

            <v-col cols="6" class="label-col">
              Оборудование:
            </v-col>
            <v-col cols="6" class="value-col">
              {{ selectedExercise.equipment || '—' }}
            </v-col>

            <v-col cols="6" class="label-col">
              Предупреждение по GIF:
            </v-col>
            <v-col cols="6" class="value-col">
              <span v-if="selectedExercise.isWarnGif">Да</span>
              <span v-else>Нет</span>
            </v-col>

            <v-col cols="12" class="label-col" style="margin-top:10px; font-weight:bold;">
              Техника выполнения:
            </v-col>
            <v-col cols="12" class="value-col">
              <p style="white-space: pre-wrap; margin:0;">
                {{ selectedExercise.technique || '—' }}
              </p>
            </v-col>

            <v-col cols="6" class="label-col">
              При проблемах со спиной:
            </v-col>
            <v-col cols="6" class="value-col">
              <span v-if="selectedExercise.spineRestrictions">Не рекомендуется</span>
              <span v-else>Можно</span>
            </v-col>

            <v-col cols="6" class="label-col">
              При проблемах с коленями:
            </v-col>
            <v-col cols="6" class="value-col">
              <span v-if="selectedExercise.kneeRestrictions">Не рекомендуется</span>
              <span v-else>Можно</span>
            </v-col>

            <v-col cols="6" class="label-col">
              При проблемах с плечами:
            </v-col>
            <v-col cols="6" class="value-col">
              <span v-if="selectedExercise.shoulderRestrictions">Не рекомендуется</span>
              <span v-else>Можно</span>
            </v-col>
          </v-row>

          <!-- Отображение GIF-картинки, загружается только при открытии -->
          <pre>{{ selectedExercise.gifImage }}</pre>
          <div v-if="selectedExercise.gifImage" class="gif-container">
            <div class="overlay-box"></div>
            <!-- Показываем <img> лишь когда showExerciseGif === true -->
            <img
                v-if="showExerciseGif"
                :src="getGifUrl(selectedExercise.gifImage)"
                alt="GIF упражнения"
                class="exercise-gif"
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <!-- Меняем закрытие на метод closeExerciseInfo -->
          <v-btn text @click="closeExerciseInfo">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-bottom-sheet>

    <!-- Диалог добавления упражнения -->
    <v-dialog v-model="showAddExerciseDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Добавить упражнение</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Название упражнения"
              v-model="newExercise.name"
              required
          ></v-text-field>
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Подгруппа"
              v-model="newExercise.subcategory"
              required
          ></v-text-field>
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Основная мышца"
              v-model="newExercise.mainMuscle"
              required
          ></v-text-field>
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Дополнительные мышцы"
              v-model="newExercise.additionalMuscles"
          ></v-text-field>
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Тип упражнения"
              v-model="newExercise.typeExercise"
          ></v-text-field>
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Оборудование"
              v-model="newExercise.equipment"
              required
          ></v-text-field>
          <v-checkbox
              hide-details="auto"
              label="Предупреждение по GIF"
              v-model="newExercise.isWarnGif"
          ></v-checkbox>
          <v-textarea
              hide-details="auto"
              label="Техника выполнения"
              v-model="newExercise.technique"
          ></v-textarea>
          <v-checkbox
              hide-details="auto"
              label="При проблемах со спиной"
              v-model="newExercise.spineRestrictions"
          ></v-checkbox>
          <v-checkbox
              hide-details="auto"
              label="При проблемах с коленями"
              v-model="newExercise.kneeRestrictions"
          ></v-checkbox>
          <v-checkbox
              hide-details="auto"
              label="При проблемах с плечами"
              v-model="newExercise.shoulderRestrictions"
          ></v-checkbox>
          <!-- Добавьте другие поля по необходимости -->
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeAddExerciseDialog">Отмена</v-btn>
          <v-btn color="primary" @click="addExercise">Добавить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог редактирования упражнения -->
    <v-dialog v-model="showEditExerciseDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Редактировать упражнение</span>
        </v-card-title>
        <v-card-text>
          <!-- Скрытое поле для _id -->
          <input type="hidden" v-model="editExerciseData._id" />

          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Название упражнения"
              v-model="editExerciseData.name"
              required
          ></v-text-field>
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Подгруппа"
              v-model="editExerciseData.subcategory"
              required
          ></v-text-field>
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Основная мышца"
              v-model="editExerciseData.mainMuscle"
              required
          ></v-text-field>
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Дополнительные мышцы"
              v-model="editExerciseData.additionalMuscles"
          ></v-text-field>
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Тип упражнения"
              v-model="editExerciseData.typeExercise"
          ></v-text-field>
          <v-text-field
              hide-details="auto"
              variant="solo-filled"
              label="Оборудование"
              v-model="editExerciseData.equipment"
              required
          ></v-text-field>
          <v-checkbox
              hide-details="auto"
              label="Предупреждение по GIF"
              v-model="editExerciseData.isWarnGif"
          ></v-checkbox>
          <v-textarea
              hide-details="auto"
              variant="solo-filled"
              label="Техника выполнения"
              v-model="editExerciseData.technique"
          ></v-textarea>
          <v-checkbox
              hide-details="auto"
              label="При проблемах со спиной"
              v-model="editExerciseData.spineRestrictions"
          ></v-checkbox>
          <v-checkbox
              hide-details="auto"
              label="При проблемах с коленями"
              v-model="editExerciseData.kneeRestrictions"
          ></v-checkbox>
          <v-checkbox
              hide-details="auto"
              label="При проблемах с плечами"
              v-model="editExerciseData.shoulderRestrictions"
          ></v-checkbox>
          <!-- Добавьте другие поля по необходимости -->
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeEditExerciseDialog">Отмена</v-btn>
          <v-btn color="primary" @click="saveExercise">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог подтверждения удаления -->
    <v-dialog v-model="showDeleteConfirmDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">Подтверждение удаления</v-card-title>
        <v-card-text>
          Вы уверены, что хотите удалить упражнение "{{ exerciseToDelete?.name }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="cancelDelete">Отмена</v-btn>
          <v-btn color="red" @click="deleteExercise">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import axios from 'axios';
import type { AxiosRequestConfig, Method } from 'axios';
import { useUserStore } from '~/stores/userStore';
import { useExerciseFilter } from '~/composables/useExerciseFilter';
import type { Exercise } from '~/composables/useExerciseFilter'; // Импорт типа отдельно

export default defineComponent({
  name: 'ExerciseSearch',
  setup() {
    const primaryBaseURL = 'https://fit-server-bot.ru.tuna.am/api/';
    const fallbackBaseURL = 'http://localhost:3002/api/';

    /**
     * Функция для выполнения API-запросов с переключением на резервный сервер при ошибке
     */
    const apiRequest = async <T>(
        method: Method,
        endpoint: string,
        data?: any,
        params?: any
    ): Promise<T> => {
      const config: AxiosRequestConfig = {
        method,
        url: primaryBaseURL + endpoint,
        data,
        params,
        timeout: 30000,
      };

      try {
        const response = await axios(config);
        return response.data;
      } catch (primaryError) {
        console.warn(
            `1 Основной сервер не доступен: ${primaryError}. Переключение на резервный сервер.`
        );
        const fallbackConfig: AxiosRequestConfig = {
          method,
          url: fallbackBaseURL + endpoint,
          data,
          params,
          timeout: 5000,
        };
        try {
          const response = await axios(fallbackConfig);
          return response.data;
        } catch (fallbackError) {
          console.error(`Резервный сервер тоже недоступен: ${fallbackError}`);
          throw fallbackError;
        }
      }
    };

    const exercises = ref<Exercise[]>([]);
    const searchQuery = ref('');
    const isLoading = ref(true);

    const userStore = useUserStore();
    const isAdmin = computed(() => userStore.role === 'admin');

    // Используем композиционный хук для фильтрации упражнений
    const { filteredExercises, displayedExercises } = useExerciseFilter(
        exercises,
        searchQuery
    );

    // Переменные для управления отображением карточки и её содержимого
    const showExerciseInfo = ref(false);
    const selectedExercise = ref<Exercise | null>(null);

    // Дополнительная переменная, чтобы гифка подгружалась только при открытии
    const showExerciseGif = ref(false);

    // Переменные для добавления/редактирования упражнения
    const showAddExerciseDialog = ref(false);
    const newExercise = ref<Partial<Exercise>>({});

    const showEditExerciseDialog = ref(false);
    const editExerciseData = ref<Partial<Exercise>>({});

    // Диалог удаления
    const showDeleteConfirmDialog = ref(false);
    const exerciseToDelete = ref<Exercise | null>(null);

    /**
     * Функция для получения полного URL GIF
     */
    const getGifUrl = (gifPath: string): string => {
      // Убедитесь, что gifPath начинается с '/'
      if (gifPath.startsWith('/')) {
        return gifPath;
      } else {
        return '/' + gifPath;
      }
    };

    /**
     * Функция для загрузки упражнений из API
     */
    const loadExercises = async () => {
      try {
        const data = await apiRequest<Exercise[]>('get', 'exercises');
        exercises.value = data;
      } catch (error: any) {
        console.error('Ошибка при загрузке упражнений:', error.message);
        alert('Не удалось загрузить упражнения. Попробуйте позже.');
      } finally {
        isLoading.value = false;
      }
    };

    /**
     * Обработчик ввода в поисковую строку
     */
    const onSearchInput = () => {
      // Дополнительная логика при вводе, если необходимо
    };

    /**
     * Открытие информации об упражнении (ленивая загрузка GIF)
     */
    const openExerciseInfo = (exercise: Exercise) => {
      selectedExercise.value = exercise;
      showExerciseInfo.value = true;

      // Загружаем GIF только при открытии
      if (exercise.gifImage) {
        showExerciseGif.value = true;
      }
    };

    /**
     * Закрытие информации об упражнении: сбрасываем showExerciseGif
     */
    const closeExerciseInfo = () => {
      showExerciseInfo.value = false;
      showExerciseGif.value = false;
    };

    /**
     * Открытие диалога добавления упражнения
     */
    const openAddExerciseDialog = () => {
      newExercise.value = {};
      showAddExerciseDialog.value = true;
    };

    /**
     * Закрытие диалога добавления упражнения
     */
    const closeAddExerciseDialog = () => {
      showAddExerciseDialog.value = false;
    };

    /**
     * Добавление нового упражнения
     */
    const addExercise = async () => {
      try {
        // Валидация данных (опционально)
        if (
            !newExercise.value.name ||
            !newExercise.value.subcategory ||
            !newExercise.value.mainMuscle ||
            !newExercise.value.equipment
        ) {
          alert('Пожалуйста, заполните все обязательные поля.');
          return;
        }

        // Создаём новое упражнение через API
        const response = await apiRequest<Exercise>('post', 'exercises', newExercise.value);
        exercises.value.push(response); // Добавляем новое упражнение в список
        closeAddExerciseDialog();
        alert('Упражнение успешно добавлено.');
      } catch (error: any) {
        console.error('Ошибка при добавлении упражнения:', error.message);
        alert('Не удалось добавить упражнение. Попробуйте снова.');
      }
    };

    /**
     * Открытие диалога редактирования упражнения
     */
    const editExercise = (exercise: Exercise) => {
      console.log('Editing exercise:', exercise);
      editExerciseData.value = { ...exercise };
      showEditExerciseDialog.value = true;
    };

    /**
     * Закрытие диалога редактирования упражнения
     */
    const closeEditExerciseDialog = () => {
      showEditExerciseDialog.value = false;
      editExerciseData.value = {};
    };

    /**
     * Сохранение изменений упражнения
     */
    const saveExercise = async () => {
      try {
        // Валидация данных (опционально)
        if (
            !editExerciseData.value.name ||
            !editExerciseData.value.subcategory ||
            !editExerciseData.value.mainMuscle ||
            !editExerciseData.value.equipment
        ) {
          alert('Пожалуйста, заполните все обязательные поля.');
          return;
        }

        if (!editExerciseData.value._id) {
          throw new Error('Идентификатор упражнения отсутствует.');
        }

        console.log('Saving exercise:', editExerciseData.value);

        // Обновляем упражнение через API
        const updatedExercise = await apiRequest<Exercise>(
            'put',
            `exercises/${editExerciseData.value._id}`,
            editExerciseData.value
        );

        console.log('Exercise updated on server:', updatedExercise);

        // Обновляем упражнение в локальном списке
        const index = exercises.value.findIndex(
            (ex) => ex._id === editExerciseData.value._id
        );
        if (index !== -1) {
          exercises.value[index] = { ...(exercises.value[index]), ...updatedExercise };
          console.log('Exercise updated locally:', exercises.value[index]);
        }

        closeEditExerciseDialog();
        alert('Упражнение успешно сохранено.');
      } catch (error: any) {
        console.error('Ошибка при сохранении упражнения:', error.message);
        alert('Не удалось сохранить изменения. Попробуйте снова.');
      }
    };

    /**
     * Открытие диалога подтверждения удаления упражнения
     */
    const confirmDeleteExercise = (exercise: Exercise) => {
      exerciseToDelete.value = exercise;
      showDeleteConfirmDialog.value = true;
    };

    /**
     * Отмена удаления упражнения
     */
    const cancelDelete = () => {
      exerciseToDelete.value = null;
      showDeleteConfirmDialog.value = false;
    };

    /**
     * Удаление упражнения
     */
    const deleteExercise = async () => {
      if (!exerciseToDelete.value) return;

      try {
        await apiRequest('delete', `exercises/${exerciseToDelete.value._id}`);
        // Удаляем упражнение из локального списка
        exercises.value = exercises.value.filter(
            (ex) => ex._id !== exerciseToDelete.value?._id
        );
        showDeleteConfirmDialog.value = false;
        exerciseToDelete.value = null;
        alert('Упражнение успешно удалено.');
      } catch (error: any) {
        console.error('Ошибка при удалении упражнения:', error.message);
        alert('Не удалось удалить упражнение. Попробуйте снова.');
      }
    };

    /**
     * Загрузка упражнений при монтировании
     */
    onMounted(() => {
      loadExercises();
    });

    return {
      searchQuery,
      onSearchInput,
      showExerciseInfo,
      selectedExercise,
      // Два метода: открытие и закрытие информации об упражнении
      openExerciseInfo,
      closeExerciseInfo,
      // Флаг для отображения GIF
      showExerciseGif,
      isAdmin,
      showAddExerciseDialog,
      openAddExerciseDialog,
      closeAddExerciseDialog,
      newExercise,
      addExercise,
      showEditExerciseDialog,
      editExerciseData,
      closeEditExerciseDialog,
      saveExercise,
      confirmDeleteExercise,
      showDeleteConfirmDialog,
      exerciseToDelete,
      cancelDelete,
      deleteExercise,
      isLoading,
      displayedExercises,
      editExercise,
      getGifUrl,
    };
  },
});
</script>

<style scoped>
.exercise-title {
  white-space: normal; /* Разрешаем перенос текста */
  word-break: break-word; /* Перенос слов при необходимости */
  overflow-wrap: break-word; /* Перенос длинных слов */
}

.dark-background {
  background-color: #f5f5f5;
}

.exercise-item {
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

.v-list-item-subtitle {
  font-size: 0.875rem;
  color: gray;
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

.v-card-title {
  padding-bottom: 8px;
}

.v-card-actions {
  justify-content: flex-end;
  padding-bottom: 16px;
}

.overlay-box {
  position: absolute;
  top: 0;
  left: 0;
  margin-left: 6px;
  border-radius: 16px;
  width: 114px;
  height: 47px;
  background-color: white;
  z-index: 2; /* Чтобы элемент был поверх GIF */
}

.gif-container {
  position: relative; /* Устанавливаем контейнер для управления вложенными элементами */
  text-align: center;
  margin-top: 20px;
}

.exercise-gif {
  max-width: 100%;
  height: auto;
  border-radius: 16px;
  z-index: 1; /* GIF должен быть под белым блоком */
}
</style>
