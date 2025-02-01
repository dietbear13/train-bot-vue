<!-- components/nutrition/NutritionAdvice.vue -->
<template>
  <div class="nutrition-advice" style="border-radius: 16px">
    <v-card style="border-radius: 16px">
      <v-card-title class="text-h5 font-weight-bold">
        Примеры питания
      </v-card-title>
      <v-card-text>
        Ниже вы найдёте готовые варианты рационов для мужчин и женщин под разные цели,
        а также советы по питанию до и после тренировки.
      </v-card-text>

      <v-expansion-panels multiple>
        <v-expansion-panel
            v-for="(section, index) in allSections"
            :key="index"
        >
          <v-expansion-panel-title class="text-h6" color="#2f4f4f">
            {{ section.title }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <p v-if="section.description">
              {{ section.description }}
            </p>

            <v-row class="py-2" dense>
              <v-col
                  v-for="(item, i) in section.items"
                  :key="i"
                  cols="12"
                  md="6"
                  class="mb-2 d-flex"
              >
                <v-card outlined variant="tonal" class="w-100" style="border-radius: 16px">
                  <v-card-title>{{ item.title }}</v-card-title>
                  <v-card-text v-if="item.shortDescription">
                    {{ item.shortDescription }}
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" @click="openBottomSheet(item)">
                      Пример рациона
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card>

    <!-- Модальное окно (BottomSheet) для подробного просмотра -->
    <BottomSheetWithClose
        v-model="bottomSheet"
        :title="selectedItem?.title"
    >
      <div v-html="formattedContent" class="py-2 px-4"></div>
    </BottomSheetWithClose>

    <ReferralLink />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BottomSheetWithClose from '../../components/shared/BottomSheetWithClose.vue';
import ReferralLink from '../../components/shared/ReferralLink.vue';

/** Структуры данных */
interface NutritionExample {
  title: string;
  content: string;
  shortDescription?: string;
}

interface NutritionSection {
  title: string;
  description?: string;
  items: NutritionExample[];
}

/** Примерные данные для аккордеона */
const allSections = ref<NutritionSection[]>([
  {
    title: 'Мужчинам',
    description: 'Подборка рационов с учётом мужского метаболизма и энергозатрат.',
    items: [
      {
        title: 'Похудение',
        shortDescription: 'Рацион для снижения веса без потери мышечной массы.',
        content: `
          - Завтрак: Омлет из 2 яиц, овсянка на воде...
          - Обед: Гречка, куриная грудка...
          - Ужин: Тушёная рыба, брокколи...
          <br><br>
          Рекомендации: пейте достаточно воды...
        `
      },
      {
        title: 'Удержание веса',
        shortDescription: 'Примерный план для сохранения формы.',
        content: `
          - Завтрак: Каша с фруктами...
          - Перекус: Орехи или творог...
          - Обед: Суп на нежирном бульоне...
        `
      },
      {
        title: 'Набор массы',
        shortDescription: 'Повышенная калорийность + правильные белки и углеводы.',
        content: `
          - Завтрак: Омлет из 3 яиц, сыр, тосты...
          - Обед: Макароны из твёрдых сортов, говядина...
          - Ужин: Рис, красная рыба...
        `
      }
    ]
  },
  {
    title: 'Женщинам',
    description: 'Примеры рационов для женского организма.',
    items: [
      {
        title: 'Похудение',
        shortDescription: 'Сбалансированный дефицит калорий.',
        content: `
          - Завтрак: Творог с ягодами...
          - Обед: Запечённая куриная грудка, овощи...
        `
      },
      {
        title: 'Удержание формы',
        content: `
          - Утром: Злаковые хлебцы, растительный омлет...
        `
      },
      {
        title: 'Набор массы',
        content: `
          - Белковые продукты: яйца, рыба, курица...
          - Сложные углеводы: гречка, киноа...
        `
      }
    ]
  },
  {
    title: 'Питание до тренировки',
    items: [
      {
        title: 'За 1-2 часа до',
        content: `
          - Овсяная каша с ягодами...
          - Фрукты (банан, яблоко)...
        `
      }
    ]
  },
  {
    title: 'Питание после тренировки',
    items: [
      {
        title: 'Через 30-60 минут',
        content: `
          - Протеиновый коктейль, творог с ягодами...
          - Рис/гречка, куриная грудка, овощи...
        `
      }
    ]
  }
])

/** Состояние для BottomSheet */
const bottomSheet = ref(false)
const selectedItem = ref<NutritionExample | null>(null)

/** Функция для открытия BottomSheet с выбранным постом */
function openBottomSheet(item: NutritionExample) {
  selectedItem.value = item
  bottomSheet.value = true
}

/** Форматирование контента для BottomSheet */
const formattedContent = computed(() => {
  if (!selectedItem.value) return ''
  return selectedItem.value.content
      .replace(/\n/g, '<br>')
      .replace(/-\s+/g, '<li style="margin-left: 20px;">')
      .replace(/<br>\s*<li/g, '<ul><li')
      .replace(/<\/li>\s*<br>/g, '</li></ul>')
      .replace(/<br><ul>/g, '<ul>')
      .replace(/<br>/g, '<p style="margin-left: 20px;">')
})
</script>

<style scoped>
.nutrition-advice {
  padding: 16px;
}

.py-2.px-4 {
  white-space: normal !important;
  word-break: break-word;
}
</style>
