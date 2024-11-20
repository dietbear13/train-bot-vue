<template>
    <div class="nutrition-advice">
      <!-- Первая строка с 2 карточками -->
      <v-row>
        <v-col
            cols="6"
            sm="6"
            v-for="(item, index) in firstRowItems"
            :key="index"
        >
        <v-card @click="openBottomSheet(item)" class="advice-card">
          <v-img :src="item.image" aspect-ratio="16/9"></v-img>
          <v-card-title>{{ item.title }}</v-card-title>
        </v-card>
        </v-col>
      </v-row>

      <!-- Вторая строка с 3 карточками -->
      <v-row>
        <v-col
            cols="6"
            sm="4"
            v-for="(item, index) in secondRowItems"
            :key="index"
        >
        <v-card @click="openBottomSheet(item)" class="advice-card">
          <v-img :src="item.image" aspect-ratio="16/9"></v-img>
          <v-card-title>{{ item.title }}</v-card-title>
        </v-card>
        </v-col>
      </v-row>

      <!-- Примеры рационов по полу -->
      <v-row class="gender-selection">
        <v-col
            cols="6"
            sm="6"
        >
        <v-btn
            class="gender-button male-button"
            @click="openBottomSheet(genderItems[0])"
            block
        >
          <v-icon left>mdi-gender-male</v-icon>
          Мужчинам
        </v-btn>
        </v-col>
        <v-col
            cols="6"
            sm="6"
        >
        <v-btn
            class="gender-button female-button"
            @click="openBottomSheet(genderItems[1])"
            block
        >
          <v-icon left>mdi-gender-female</v-icon>
          Женщинам
        </v-btn>
        </v-col>
      </v-row>

      <!-- Диалоговое окно для отображения контента -->
      <v-bottom-sheet v-model="bottomSheet" max-width="500">
        <v-card>
          <v-card-title>{{ selectedItem?.title }}</v-card-title>
          <v-card-text v-html="selectedItem?.content"></v-card-text>
          <v-card-actions>
            <v-btn text @click="bottomSheet = false">Закрыть</v-btn>
          </v-card-actions>
        </v-card>
      </v-bottom-sheet>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Импорт изображений
import maintenanceImage from '@/assets/maintenance.png'
import massgainImage from '@/assets/massgain.jpeg'
import weightlossImage from '@/assets/weightloss.jpeg'

// Интерфейс для элементов совета
interface AdviceItem {
  title: string
  image?: string
  content: string
}

// Состояния для диалога
const dialog = ref(false)
const selectedItem = ref<AdviceItem | null>(null)

// Функция для открытия диалога
const openDialog = (item: AdviceItem) => {
  selectedItem.value = item
  dialog.value = true
}

const bottomSheet = ref(false)

// Обновите функцию открытия
const openBottomSheet = (item: AdviceItem) => {
  selectedItem.value = item
  bottomSheet.value = true
}


// Данные для первой строки карточек
const firstRowItems: AdviceItem[] = [
  {
    title: 'Азы питания',
    image: '/assets/basics.jpg', // Убедитесь, что путь корректен
    content: 'Рыбный текст для раздела "Азы питания".',
  },
  {
    title: 'Питание и тренировки',
    image: '/assets/prepostworkout.jpg', // Убедитесь, что путь корректен
    content: 'Рыбный текст для раздела "Питание перед и после тренировки".',
  },
]

// Данные для второй строки карточек
const secondRowItems: AdviceItem[] = [
  {
    title: 'Похудение',
    image: weightlossImage,
    content: 'Рыбный текст для раздела "Питание на похудение".',
  },
  {
    title: 'Удержание',
    image: maintenanceImage,
    content: 'Рыбный текст для раздела "Питание для удержания веса".',
  },
  {
    title: 'Набор массы',
    image: massgainImage,
    content: 'Рыбный текст для раздела "Питание на массу".',
  },
]

// Данные для выбора по полу
const genderItems: AdviceItem[] = [
  {
    title: 'Мужчинам',
    content: 'Рыбный текст для раздела "Мужчинам".',
  },
  {
    title: 'Женщинам',
    content: 'Рыбный текст для раздела "Женщинам".',
  },
]
</script>

<style scoped>
.nutrition-advice {
  padding: 2px;
}

.advice-card {
  cursor: pointer;
  margin-bottom: 4px;
}

.gender-selection {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.gender-button {
  height: 50px;
  font-size: 14px;
  color: white;
}

.male-button {
  background-color: #42a5f5;
}

.female-button {
  background-color: #ec407a;
}

/* Адаптивные стили для мобильных устройств */
@media (max-width: 600px) {
  .advice-card {
    margin-bottom: 4px;
  }

  .gender-button {
    height: 50px;
    font-size: 14px;
  }
}
</style>
