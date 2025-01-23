<!-- training/week/TrainingOnWeekInputs.vue -->
<template>
  <!-- Форма с выбором пола, типа сплита, конкретного сплита, кнопкой "Создать" -->
  <v-form @submit.prevent="onGenerateSplit">
    <!-- Выбор пола -->
    <v-card class="mb-2 dark-background" variant="tonal">
      <v-card-text class="pa-1">
        <v-slide-group
            v-model="formData.gender"
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
                :class="{ 'selected-button': formData.gender === option }"
                @click="selectGender(option)"
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
                :class="{ 'selected-button': formData.splitType === type }"
                @click="selectSplitType(type)"
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
                @click="selectSplit(split)"
                :class="{ 'selected-split-card': formData.splitId === split._id }"
                outlined
                class="split-card"
            >
              <v-card-text class="split-card-content">
                <!-- Радио-кнопка -->
                <div class="radio-container">
                  <v-radio
                      v-model="formData.splitId"
                      :value="split._id"
                      class="split-radio"
                      hide-details
                  ></v-radio>
                </div>
                <!-- Контент сплита (комментарий) -->
                <div
                    :class="['split-content', { 'truncate': formData.splitId !== split._id }]"
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
                  <span v-if="formData.splitId === split._id">
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
        v-else-if="formData.gender && uniqueSplitTypes.length === 0"
        class="my-2 dark-background pa-2"
        variant="tonal"
    >
      <v-card-text>
        <p>Нет доступных сплитов для выбранного пола.</p>
      </v-card-text>
    </v-card>

    <!-- Кнопка "Сгенерировать" (отображаем, только если выбран сплит) -->
    <v-btn
        v-if="formData.splitId"
        color="success"
        class="mt-1"
        rounded="lg"
        width="100%"
        :disabled="isAnimating || isGenerating"
        @click="onGenerateSplit"
    >
      <!-- Три состояния кнопки: -->
      <span v-if="isAnimating">Генерирую.. </span>
      <span v-else-if="isGenerating">Создаю.. </span>
      <span v-else>Создать</span>

      <v-icon right :class="{ rotatingDumbbell: isAnimating || isGenerating }">
        mdi-dumbbell
      </v-icon>
    </v-btn>

    <!-- Ошибки -->
    <v-alert
        v-if="errorMessages.length > 0"
        type="error"
        class="mt-2"
        dismissible
        @input="errorMessages.splice(0, errorMessages.length)"
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
import { defineComponent, ref, reactive, watch, onMounted, PropType } from 'vue'
import { retrieveLaunchParams } from '@telegram-apps/sdk'

interface Split {
  _id: string;
  split: string;
  splitComment?: string;
  difficultyLevelSplit: number | string;
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
    // Родитель теперь управляет анимацией: передаём isAnimating как проп
    isAnimating: {
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
    // Родитель получит это, чтобы сам "включить анимацию" и т.д.
    'generateSplitWorkout'
  ],
  setup(props, { emit }) {
    // formData: локальное хранилище выбранных опций (gender, splitType, splitId)
    const formData = reactive({
      gender: props.gender || '',
      splitType: props.selectedSplitType || '',
      splitId: props.selectedSplitId || ''
    })

    // Следим за formData
    watch(formData, (newVal) => {
      console.log('formData изменился:', JSON.stringify(newVal))
    }, { deep: true })

    // telegramUserId
    const telegramUserId = ref<number | null>(null)
    onMounted(() => {
      if (process.client) {
        const launchParams = retrieveLaunchParams()
        if (launchParams && launchParams.initData && launchParams.initData.user) {
          const user = launchParams.initData.user
          if (user && user.id) {
            telegramUserId.value = Number(user.id)
            console.log('telegramUserId:', telegramUserId.value)
          } else {
            console.error('Не удалось получить данные пользователя из Telegram.')
            props.errorMessages.push('Не удалось получить данные пользователя. Убедитесь, что приложение запущено внутри Telegram.')
          }
        }
      }
    })

    const selectGender = (option: string) => {
      formData.gender = option
      emit('update:gender', option)
      console.log('Selected gender:', option)
    }

    const selectSplitType = (type: string) => {
      formData.splitType = type
      emit('update:selectedSplitType', type)
      console.log('Selected split type:', type)
    }

    const selectSplit = (split: Split) => {
      formData.splitId = split._id
      emit('update:selectedSplitId', split._id)
      console.log('Selected split:', split)
    }

    // Когда пользователь жмёт "Создать" (Сгенерировать)
    const onGenerateSplit = () => {
      // Мы просто говорим родителю: "Пользователь хочет сгенерировать"
      // Родитель уже решит, как включать/выключать анимацию.
      console.log('onGenerateSplit: emit generateSplitWorkout')
      if (props.errorMessages.length > 0) {
        console.warn('Есть ошибки, не генерируем тренировку.')
        return
      }
      emit('generateSplitWorkout')
    }

    const getDifficultyColor = (level: number | string): string => {
      const numericLevel = Number(level)
      switch (numericLevel) {
        case 1:
          return '#33cc99'
        case 2:
          return '#FFCC33'
        case 3:
          return '#FF6666'
        default:
          return 'grey'
      }
    }

    const getDifficultyLabel = (level: number | string): string => {
      const numericLevel = Number(level)
      switch (numericLevel) {
        case 1:
          return 'начальный'
        case 2:
          return 'средний'
        case 3:
          return 'профи'
        default:
          return 'Неизвестно'
      }
    }

    // Логирование splitsToShow
    watch(() => props.splitsToShow, (newSplits) => {
      console.log('splitsToShow updated:', newSplits)
      newSplits.forEach(s => {
        console.log('Full Split Object:', s)
      })
    }, { immediate: true, deep: true })

    return {
      formData,
      telegramUserId,
      selectGender,
      selectSplitType,
      selectSplit,
      onGenerateSplit,
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
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s, border 0.3s;
  border-radius: 14px;
  padding: 0;
}

.split-card:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.split-card.selected-split-card {
  background-color: rgba(33, 150, 243, 1);
  border: 2px solid var(--v-primary-base);
  color: white;
}

.split-card .v-card-text {
  color: #ccc;
}

.split-card.selected-split-card .v-card-text {
  color: #fff;
}

.split-card:not(.selected-split-card) {
  background-color: rgba(255, 255, 255, 0.05);
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
  margin-left: 8px;
}

.truncate {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.splits {
  border-radius: 14px;
}

/* Анимация вращения штанги */
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
