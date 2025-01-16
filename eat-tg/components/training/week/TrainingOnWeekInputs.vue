<!-- training/week/TrainingOnWeekInputs.vue -->

<template>
  <!-- Форма с выбором пола, типа сплита, конкретного сплита, кнопкой "Создать" -->
  <v-form @submit.prevent="emitGenerateSplit">
    <!-- Выбор пола -->
    <v-card class="mb-2 dark-background" variant="tonal">
      <v-card-text class="pa-1">
        <v-slide-group
            v-model="localGender"
            show-arrows
            class="flex-nowrap"
            center-active
            mandatory
        >
          <v-slide-group-item
              v-for="option in genders"
              :key="option"
              :value="option"
          >
            <v-btn
                variant="text"
                outlined
                class="group-button mx-auto"
                :class="{ 'selected-button': localGender === option }"
                @click="onSelectGender(option)"
                rounded="lg"
            >
              {{ option }}
            </v-btn>
          </v-slide-group-item>
        </v-slide-group>
      </v-card-text>
    </v-card>

    <!-- Выбор типа сплита -->
    <v-card
        v-if="uniqueSplitTypes.length > 0"
        class="my-2 dark-background pa-3"
        variant="tonal"
    >
      <v-card-text class="pa-1">
        <v-row>
          <v-col
              v-for="type in uniqueSplitTypes"
              :key="type"
              cols="12"
              sm="6"
              md="4"
              class="px-1 pt-1"
          >
            <v-btn
                block
                :value="type"
                :class="{ 'selected-button': localSelectedSplitType === type }"
                @click="onSelectSplitType(type)"
                rounded="lg"
                variant="text"
            >
              <strong>{{ type }}</strong>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Выбор конкретного сплита (v-radio) -->
    <v-card
        v-if="splitsToShow.length > 0"
        class="my-2 dark-background px-1 py-3 splits"
        variant="tonal"
    >
      <v-card-text class="px-2 py-2">
        <v-row class="pa-0">
          <v-col
              v-for="split in splitsToShow"
              :key="split._id"
              cols="12"
              sm="6"
              class="py-1"
          >
            <v-card
                @click="onSelectSplit(split)"
                :class="{ 'selected-split-card': localSelectedSplitId === split._id }"
                outlined
                class="split-card"
            >
              <v-card-text class="split-card-content">
                <!-- Радио-кнопка -->
                <div class="radio-container">
                  <v-radio
                      v-model="localSelectedSplitId"
                      :value="split._id"
                      class="split-radio"
                      hide-details
                  ></v-radio>
                </div>
                <!-- Контент сплита (комментарий) -->
                <div
                    :class="['split-content', { 'truncate': localSelectedSplitId !== split._id }]"
                    class="mb-4"
                >
                  <v-card-text style="padding: 4px" v-if="split.splitComment">{{ split.splitComment }}</v-card-text>
                </div>
                <!-- Чип с уровнем сложности -->
                <v-chip
                    :color="getDifficultyColor(Number(split.difficultyLevelSplit || 0))"
                    text-color="white"
                    x-small
                    class="difficulty-chip"
                    variant="elevated"
                >
                  <!-- Отображаем уровень сложности только если сплит выбран -->
                  <span v-if="localSelectedSplitId === split._id">
                    {{ getDifficultyLabel(Number(split.difficultyLevelSplit || 0)) }}
                  </span>
                </v-chip>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Если нет доступных сплитов -->
    <v-card
        v-else-if="localGender && uniqueSplitTypes.length === 0"
        class="my-2 dark-background pa-2"
        variant="tonal"
    >
      <v-card-text>
        <p>Нет доступных сплитов для выбранного пола.</p>
      </v-card-text>
    </v-card>

    <!-- Кнопка "Сгенерировать" (отображаем, только если выбран сплит) -->
    <v-btn
        v-if="selectedSplit"
        color="success"
        class="mt-1"
        rounded="lg"
        width="100%"
        :disabled="isGenerating"
        @click="emitGenerateSplit"
    >
      <span v-if="isLoading">Создаю.. </span>
      <span v-else>Создать </span>
      <v-icon right :class="{ rotatingDumbbell: isLoading }">
        mdi-dumbbell
      </v-icon>
    </v-btn>

    <!-- Ошибки -->
    <v-alert
        v-if="errorMessages.length > 0"
        type="error"
        class="mt-2"
        dismissible
        @input="clearErrors"
    >
      <ul>
        <li v-for="(msg, index) in errorMessages" :key="index">
          {{ msg }}
        </li>
      </ul>
    </v-alert>
  </v-form>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from 'vue'

interface Split {
  _id: string;
  split: string;
  splitComment?: string;
  difficultyLevelSplit: number | string; // Обновлено для поддержки строк и чисел
}

export default defineComponent({
  name: 'TrainingOnWeekInputs',
  props: {
    genders: {
      type: Array as PropType<string[]>,
      required: true
    },
    gender: {
      type: String,
      required: false,
      default: ''
    },
    uniqueSplitTypes: {
      type: Array as PropType<string[]>,
      required: true
    },
    selectedSplitType: {
      type: String,
      default: null
    },
    splitsToShow: {
      type: Array as PropType<Split[]>,
      default: () => []
    },
    selectedSplitId: {
      type: String,
      default: null
    },
    selectedSplit: {
      type: Object as PropType<Split | null>,
      default: null
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    isGenerating: {
      type: Boolean,
      default: false
    },
    errorMessages: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  emits: [
    'update:gender',
    'update:selectedSplitType',
    'update:selectedSplitId',
    'generateSplitWorkout'
  ],
  setup(props, { emit }) {
    // Локальные reactive-поля
    const localGender = ref(props.gender)
    const localSelectedSplitType = ref(props.selectedSplitType)
    const localSelectedSplitId = ref(props.selectedSplitId)

    // Следим за входящим gender -> обновляем localGender
    watch(() => props.gender, (newVal) => {
      console.log('gender prop changed:', newVal)
      localGender.value = newVal
    })
    // Следим за входящим selectedSplitType
    watch(() => props.selectedSplitType, (newVal) => {
      console.log('selectedSplitType prop changed:', newVal)
      localSelectedSplitType.value = newVal
    })
    // Следим за входящим selectedSplitId
    watch(() => props.selectedSplitId, (newVal) => {
      console.log('selectedSplitId prop changed:', newVal)
      localSelectedSplitId.value = newVal
    })

    // Метод при выборе пола
    const onSelectGender = (option: string) => {
      console.log('Selected gender:', option)
      localGender.value = option
      emit('update:gender', option)
    }

    // Метод при выборе типа сплита
    const onSelectSplitType = (type: string) => {
      console.log('Selected split type:', type)
      localSelectedSplitType.value = type
      emit('update:selectedSplitType', type)
    }

    // Метод при выборе конкретного сплита
    const onSelectSplit = (split: Split) => {
      console.log('Selected split:', split)
      localSelectedSplitId.value = split._id
      emit('update:selectedSplitId', split._id)
    }

    // При клике на кнопку «Создать»
    const emitGenerateSplit = () => {
      console.log('Emit generateSplitWorkout')
      emit('generateSplitWorkout')
    }

    // Удалить все ошибки (здесь пустая, если хотим прокидывать наверх — делаем emit)
    const clearErrors = () => {
      console.log('Clearing errors')
      // emit('clearErrors') — если бы хотели сбрасывать ошибки в родителе
    }

    // Метод для получения цвета чипа по уровню сложности
    const getDifficultyColor = (level: number | string): string => {
      const numericLevel = Number(level)
      console.log('getDifficultyColor called with level:', numericLevel)
      switch (numericLevel) {
        case 1:
          return '#33cc99' // Пастельный зеленый
        case 2:
          return '#FFCC33' // Пастельный желтый
        case 3:
          return '#FF6666' // Пастельный красный
        default:
          console.warn('Unknown difficulty level:', numericLevel)
          return 'grey'
      }
    }

    // Метод для получения текстовой метки по уровню сложности
    const getDifficultyLabel = (level: number | string): string => {
      const numericLevel = Number(level)
      console.log('getDifficultyLabel called with level:', numericLevel)
      switch (numericLevel) {
        case 1:
          return 'начальный'
        case 2:
          return 'средний'
        case 3:
          return 'профи'
        default:
          console.warn('Unknown difficulty level:', numericLevel)
          return 'Неизвестно'
      }
    }

    // Дополнительный лог для проверки данных сплитов при их изменении
    watch(() => props.splitsToShow, (newSplits) => {
      console.log('splitsToShow updated:', newSplits)
      newSplits.forEach(split => {
        console.log('Full Split Object:', split)
        console.log(`Split ID: ${split._id}, Difficulty Level: ${split.difficultyLevelSplit}`)
      })
    }, { immediate: true, deep: true })

    return {
      localGender,
      localSelectedSplitType,
      localSelectedSplitId,
      onSelectGender,
      onSelectSplitType,
      onSelectSplit,
      emitGenerateSplit,
      clearErrors,
      getDifficultyColor,
      getDifficultyLabel
    }
  }
})
</script>

<style scoped>
.dark-background {
  background-color: #1E1E1E !important;
  color: #FFF;
}

.group-button {
  min-width: 45%;
}

.selected-button {
  background-color: var(--v-primary-base);
  color: white;
}

/* Общая стилизация для блоков со сплитами */
.split-card {
  position: relative; /* Для позиционирования чипа */
  cursor: pointer;
  transition: background-color 0.3s, border 0.3s;
  border-radius: 14px;
  padding: 0;
}

.split-card:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.split-card.selected-split-card {
  background-color: rgba(33, 150, 243, 1); /* Полупрозрачный синий фон */
  border: 2px solid var(--v-primary-base);
  color: white;
}

.split-card .v-card-title {
  font-weight: bold;
}

.split-card .v-card-text {
  color: #ccc;
}

.split-card.selected-split-card .v-card-text {
  color: #fff;
}

.split-card.selected-split-card .v-card-title {
  color: #fff;
}

.split-card:not(.selected-split-card) {
  background-color: rgba(255, 255, 255, 0.05);
}

.split-card:not(.selected-split-card):hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Радио-кнопка, контейнер */
.radio-container {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.split-radio {
  padding: 0;
}

/* Контент внутри split-card */
.split-card-content {
  display: flex;
  align-items: center;
  padding: 0;
}

.split-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.split-content .v-card-title {
  font-size: 1rem;
  margin-bottom: 4px;
}

.split-content .v-card-text {
  font-size: 0.9rem;
  color: #ccc;
}

/* Добавляем класс для обрезки текста до 2 строк с многоточием */
.truncate {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Количество отображаемых строк */
  -webkit-box-orient: vertical;
}

.split-content .v-card-text.truncate {
  /* Дополнительные стили, если необходимо */
}

/* Обёртка для списка доступных сплитов */
.splits {
  border-radius: 14px;
}

/* Анимация вращения штанги, при isLoading=true */
.rotatingDumbbell {
  animation: rotate-dumbbell 1s linear infinite;
}

@keyframes rotate-dumbbell {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Стиль для чипа сложности */
.difficulty-chip {
  position: absolute;
  bottom: 8px;
  right: 8px;
}
</style>
