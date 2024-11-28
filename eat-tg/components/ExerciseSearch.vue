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
    ></v-text-field>

    <!-- Кнопка добавления упражнения (только для администратора) -->
    <div v-if="isAdmin" class="admin-actions">
      <v-btn color="primary" @click="openAddExerciseDialog">
        <v-icon left>mdi-plus</v-icon>
        Добавить упражнение
      </v-btn>
    </div>

    <!-- Список упражнений -->
    <v-card class="ma-0 dark-background pa-2" variant="tonal">
      <v-list-item
          v-for="exercise in filteredExercises"
          :key="exercise._id"
          class="exercise-item"
      >
        <v-list-item-title>
          <span v-html="highlightQuery(exercise.name)"></span>
        </v-list-item-title>
        <v-list-item-action>
          <v-chip class="mr-2" small color="primary" text-color="white">
            {{ exercise.category }}
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
    </v-card>

    <!-- v-bottom-sheet с информацией об упражнении -->
    <v-bottom-sheet v-model="showExerciseInfo">
      <v-card v-if="selectedExercise">
        <v-card-title class="headline">{{ selectedExercise.name }}</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="6" class="label-col">
              Мышечная группа:
            </v-col>
            <v-col cols="6" class="value-col">
              {{ selectedExercise.category }}
            </v-col>

            <v-col cols="6" class="label-col">
              Подгруппа:
            </v-col>
            <v-col cols="6" class="value-col">
              {{ selectedExercise.subcategory }}
            </v-col>

            <v-col cols="6" class="label-col">
              Основные мышцы:
            </v-col>
            <v-col cols="6" class="value-col">
              {{ selectedExercise.mainMuscles }}
            </v-col>

            <v-col cols="6" class="label-col">
              Доп. мышцы:
            </v-col>
            <v-col cols="6" class="value-col">
              {{ selectedExercise.additionalMuscles }}
            </v-col>

            <v-col cols="6" class="label-col">
              Оборудование:
            </v-col>
            <v-col cols="6" class="value-col">
              {{ selectedExercise.equipment }}
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="showExerciseInfo = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-bottom-sheet>

    <!-- Диалог добавления упражнения (только визуальная часть) -->
    <v-dialog v-model="showAddExerciseDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Добавить упражнение</span>
        </v-card-title>
        <v-card-text>
          <!-- Поля формы для добавления упражнения -->
          <v-text-field label="Название упражнения" v-model="newExercise.name"></v-text-field>
          <!-- Добавьте другие поля по необходимости -->
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeAddExerciseDialog">Отмена</v-btn>
          <v-btn color="primary" @click="addExercise">Добавить</v-btn>
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
import axios, { AxiosRequestConfig, Method } from 'axios';
import { useUserStore } from '~/stores/userStore'; // Подключение хранилища пользователя

// Определение базовых URL-адресов
const primaryBaseURL = 'https://fit-server-bot.ru.tuna.am/api/';
const fallbackBaseURL = 'http://localhost:3002/api/';

// Вспомогательная функция для выполнения API-запросов с приоритетом
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
    timeout: 5000,
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (primaryError) {
    console.warn(
        `Основной сервер не доступен: ${primaryError}. Переключение на резервный сервер.`
    );
    // Попытка с резервным сервером
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
      console.error(`Резервный сервер также не доступен: ${fallbackError}`);
      throw fallbackError;
    }
  }
};

// Интерфейс для упражнения
interface Exercise {
  _id: string;
  category: string;
  subcategory: string;
  mainMuscles: string;
  additionalMuscles: string;
  difficultyLevel: string;
  name: string;
  equipment: string;
  // Добавьте другие поля, если они есть
}

export default defineComponent({
  name: 'ExerciseSearch',
  setup() {
    const exercises = ref<Exercise[]>([]);
    const searchQuery = ref('');

    const showExerciseInfo = ref(false);
    const selectedExercise = ref<Exercise | null>(null);

    // Подключение хранилища пользователя
    const userStore = useUserStore();
    const isAdmin = computed(() => userStore.role === 'admin');

    // Переменные для админских действий
    const showAddExerciseDialog = ref(false);
    const newExercise = ref<Partial<Exercise>>({});
    const showDeleteConfirmDialog = ref(false);
    const exerciseToDelete = ref<Exercise | null>(null);

    const loadExercises = async () => {
      try {
        const data = await apiRequest<Exercise[]>('get', 'exercises');
        exercises.value = data;
      } catch (error: any) {
        console.error('Ошибка при загрузке упражнений:', error.message);
      }
    };

    // Функция для нормализации строк
    const normalizeString = (str: string): string => {
      return str
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
          .replace(/ё/g, 'е')
          .replace(/ъ/g, 'ь');
    };

    // Функция для вычисления процента опечаток
    const getEditDistance = (a: string, b: string): number => {
      const matrix = [];

      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] =
                Math.min(
                    matrix[i - 1][j - 1] + 1, // Замена
                    Math.min(
                        matrix[i][j - 1] + 1, // Вставка
                        matrix[i - 1][j] + 1 // Удаление
                    )
                );
          }
        }
      }
      return matrix[b.length][a.length];
    };

    // Функция для проверки опечаток
    const isSimilar = (word1: string, word2: string): boolean => {
      const distance = getEditDistance(word1, word2);
      const maxLength = Math.max(word1.length, word2.length);
      return distance <= Math.ceil(maxLength * 0.2); // Увеличили до 20%
    };

    // Компьютед для фильтрации упражнений
    const filteredExercises = computed(() => {
      return exercises.value.filter((exercise) => {
        let matchesQuery = true;

        const exerciseName = normalizeString(exercise.name);
        const query = normalizeString(searchQuery.value);

        if (searchQuery.value) {
          const queryWords = query.split(/\s|-/).filter(Boolean);
          const exerciseWords = exerciseName.split(' ').filter(Boolean);

          // Проверяем прямое вхождение фразы
          const directMatch = exerciseName.includes(query);

          // Проверяем, содержатся ли все слова из запроса в названии упражнения
          const allWordsMatch = queryWords.every((qWord) =>
              exerciseWords.some(
                  (eWord) => eWord.includes(qWord) || isSimilar(eWord, qWord)
              )
          );

          matchesQuery = directMatch || allWordsMatch;
        }

        return matchesQuery;
      });
    });

    const highlightQuery = (text: string): string => {
      let result = text;
      const query = normalizeString(searchQuery.value);
      if (query) {
        const queryWords = query.split(/\s|-/).filter(Boolean);
        queryWords.forEach((word) => {
          const regex = new RegExp(`(${word})`, 'gi');
          result = result.replace(regex, '<mark>$1</mark>');
        });
      }
      return result;
    };

    const onSearchInput = () => {
      // Дополнительная логика при вводе, если необходимо
    };

    const openExerciseInfo = (exercise: Exercise) => {
      selectedExercise.value = exercise;
      showExerciseInfo.value = true;
    };

    // Админские действия
    const openAddExerciseDialog = () => {
      newExercise.value = {};
      showAddExerciseDialog.value = true;
    };

    const closeAddExerciseDialog = () => {
      showAddExerciseDialog.value = false;
    };

    const addExercise = () => {
      // Реализуйте добавление упражнения через API позже
      console.log('Добавить упражнение:', newExercise.value);
      closeAddExerciseDialog();
    };

    const editExercise = (exercise: Exercise) => {
      // Реализуйте редактирование упражнения через API позже
      console.log('Редактировать упражнение:', exercise);
    };

    const confirmDeleteExercise = (exercise: Exercise) => {
      exerciseToDelete.value = exercise;
      showDeleteConfirmDialog.value = true;
    };

    const cancelDelete = () => {
      exerciseToDelete.value = null;
      showDeleteConfirmDialog.value = false;
    };

    const deleteExercise = () => {
      if (exerciseToDelete.value) {
        // Реализуйте удаление упражнения через API позже
        console.log('Удалить упражнение:', exerciseToDelete.value);
        showDeleteConfirmDialog.value = false;
        exerciseToDelete.value = null;
      }
    };

    onMounted(() => {
      loadExercises();
    });

    return {
      exercises,
      searchQuery,
      filteredExercises,
      highlightQuery,
      onSearchInput,
      showExerciseInfo,
      selectedExercise,
      openExerciseInfo,
      // Админские переменные и методы
      isAdmin,
      showAddExerciseDialog,
      openAddExerciseDialog,
      closeAddExerciseDialog,
      newExercise,
      addExercise,
      editExercise,
      confirmDeleteExercise,
      showDeleteConfirmDialog,
      exerciseToDelete,
      cancelDelete,
      deleteExercise,
    };
  },
});
</script>

<style scoped>
/* Стили для выделения найденных слов */
mark {
  background-color: yellow;
}

/* Стили для карточек и элементов */
.dark-background {
  background-color: #f5f5f5;
}

/* Стили для элементов списка упражнений */
.exercise-item {
  /* Добавьте свои стили для элементов списка */
}

/* Стили для списка */
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

/* Стили для кнопки информации */
.v-list-item-action .v-btn {
  margin: 0;
}

/* Стили для админских кнопок */
.admin-buttons {
  display: flex;
  align-items: center;
}

.admin-buttons .v-btn {
  margin-right: 4px;
}

/* Стили для верхней панели с кнопкой добавления */
.admin-actions {
  margin: 16px 0;
}

/* Стили для v-card-text в v-bottom-sheet */
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

/* Стили для v-card-title в v-bottom-sheet */
.v-card-title {
  padding-bottom: 8px;
}

/* Стили для v-card-actions в v-bottom-sheet */
.v-card-actions {
  justify-content: flex-end;
  padding-bottom: 16px;
}
</style>
