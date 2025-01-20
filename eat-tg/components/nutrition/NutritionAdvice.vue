<!-- components/shared/NutritionAdvice.vue -->
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
      <v-col cols="6" sm="6">
        <v-btn
            class="gender-button male-button"
            @click="openBottomSheet(genderItems[0])"
            block
        >
          <v-icon left>mdi-gender-male</v-icon>
          Мужчинам
        </v-btn>
      </v-col>
      <v-col cols="6" sm="6">
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
    <BottomSheetWithClose
        v-model="bottomSheet"
        :title="selectedItem?.title"
    >
      <div v-html="formattedContent" class="py-2 px-4"></div>
    </BottomSheetWithClose>

    <!-- Сюда новый код -->
    <ReferralLink></ReferralLink>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BottomSheetWithClose from '@/components/shared/BottomSheetWithClose.vue';
import ReferralLink from '~/components/shared/ReferralLink.vue'

// Интерфейс для элементов совета
interface AdviceItem {
  title: string;
  image?: string;
  content: string;
}

// Состояния для диалога
const bottomSheet = ref(false);
const selectedItem = ref<AdviceItem | null>(null);

const openBottomSheet = (item: AdviceItem) => {
  selectedItem.value = item;
  bottomSheet.value = true;
};

// Форматирование текста
const formattedContent = computed(() => {
  if (!selectedItem.value) return '';
  return selectedItem.value.content
      .replace(/\n/g, '<br>')
      .replace(/-\s+/g, '<li style="margin-left: 20px;">')
      .replace(/<br>\s*<li/g, '<ul><li')
      .replace(/<\/li>\s*<br>/g, '</li></ul>')
      .replace(/<br><ul>/g, '<ul>')
      .replace(/<br>/g, '<p style="margin-left: 20px;">');
});

// Данные для первой строки карточек
const firstRowItems: AdviceItem[] = [
  {
    title: 'Азы питания',
    image: '/assets/basics.jpg',
    content:
        'Питание играет определяющую роль при правильных тренировках, но начинающим достаточно немного привести питание в порядок и усердно тренироваться.\n' +
        'Вот несколько простых рекомендаций, как наладить питание:\n' +
        '- Ешьте побольше белковой пищи (яйца, курица, говядина, рыба и любые морепродукты, творог)' +
        '- Уберите из рациона пищевой мусор (сахар в чае, хлеб к основному блюду, выпечку, майонез, газировки и т.д.)' +
        '- Не забывайте пить воду (около литра в день будет вполне достаточно)' +
        '- Кушайте 3 раза в день основательно (завтрак, обед, ужин), допускается 1-2 перекуса (желательно тем же белком). Основные приемы пищи должны содержать крупу + белок' +
        '- Кушайте зелёные овощи (огурцы, помидоры, перец и т.д.)',
  },
  {
    title: 'Питание и тренировки',
    image: '/assets/prepostworkout.jpg',
    content:
        '- Перед тренировкой нужно обязательно покушать любую крупу с белком за 1.5-2ч до тренировки.' +
        '- Не рекомендуется кушать жирное' +
        '- Если не успели покушать - съешьте что-нибудь углеводное (фрукты, йогурты со вкусами).' +
        '- Если чувствуете себя уставшим, выпейте чашку кофе за полчаса до тренировки.',
  },
];

// Данные для второй строки карточек
const secondRowItems: AdviceItem[] = [
  {
    title: 'Похудение',
    image: '/assets/weightloss.jpeg',
    content:
        'Рацион выглядит так:\n' +
        '- Завтрак (крупа+белок)' +
        '- Обед (крупа+белок)' +
        '- Перекус (белок)' +
        '- Ужин (крупа+белок)' +
        '- Возможен еще один перекус белком.',
  },
  {
    title: 'Удержание',
    image: '/assets/maintenance.png',
    content:
        'Питание для удержания:\n' +
        '- 3 основных приема пищи' +
        '- Легкие перекусы по необходимости.',
  },
  {
    title: 'Набор массы',
    image: '/assets/massgain.jpeg',
    content:
        'Рацион на набор массы:\n' +
        '- Основные приемы пищи: крупа + белок' +
        '- Перекусы: орехи, фрукты' +
        '- Мужчинам нужно 2г белка на кг веса, женщинам — 1.5г.',
  },
];

// Данные для выбора по полу
const genderItems: AdviceItem[] = [
  {
    title: 'Мужчинам',
    content:
        'Примерный рацион:\n' +
        '- Завтрак: белок + немного углеводов' +
        '- Обед: мясо/птица/рыба + гарнир 50/50' +
        '- Перекус: творог или протеин + фрукты' +
        '- Ужин: мясо/птица/рыба + гарнир 50/50.',
  },
  {
    title: 'Женщинам',
    content:
        'Примерный рацион:\n' +
        '- Завтрак: белок + немного углеводов' +
        '- Обед: мясо/птица/рыба + гарнир 50/50' +
        '- Перекус: творог или протеин + фрукты' +
        '- Ужин: мясо/птица/рыба + гарнир 50/50.',
  },
];
</script>

<style scoped>
.nutrition-advice {
  padding: 16px;
}

.advice-card {
  cursor: pointer;
  margin-bottom: 16px;
}

.gender-selection {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.gender-button {
  height: 50px;
  font-size: 14px;
  color: white;
  /* Добавляем перенос слов на кнопках */
  white-space: normal !important;
  word-break: break-word;
}

.gender-button .v-btn__content {
  white-space: normal !important;
  word-break: break-word;
}

.male-button {
  background-color: #42a5f5;
}

.female-button {
  background-color: #ec407a;
}

/* Добавляем перенос слов в тексте, который открывается в v-bottom */
.py-2.px-4 {
  white-space: normal !important;
  word-break: break-word;
}
</style>
