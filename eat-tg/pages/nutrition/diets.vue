<!-- pages/nutrition/diets.vue -->
<template>
  <div class="nutrition-advice">

    <!-- Итерация по категориям (тегам) -->
    <v-data-iterator
        :items="categories"
        :items-per-page="-1"
        item-key="name"
        class="mt-4"
    >
      <template #default="{ item }">
        <!-- Проверяем, что item определён и имеет необходимые свойства -->
        <template v-if="logAndCheckItem(item)">
          <!-- Каждая категория обёрнута в карточку -->
          <v-card class="my-4">
            <v-card-title class="text-h5 font-weight-bold">
              {{ item.name }}
            </v-card-title>
            <!-- Описание категории, если нужно -->
            <v-card-subtitle v-if="item.description && item.description.trim() !== ''">
              {{ item.description }}
            </v-card-subtitle>

            <!-- Перебор постов внутри категории -->
            <v-row>
              <v-col
                  v-for="(post, index) in item.posts"
                  :key="index"
                  cols="12"
                  sm="6"
                  class="d-flex"
              >
                <v-card class="mb-4 w-100">
                  <!-- Заголовок поста -->
                  <v-card-title>{{ post.title }}</v-card-title>
                  <!-- Кнопка для открытия подробностей в BottomSheet -->
                  <v-card-actions>
                    <v-btn
                        color="primary"
                        @click="openBottomSheet(post)"
                    >
                      Открыть полностью
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card>
        </template>
        <!-- Если item не определён, отображаем сообщение или ничего -->
        <template v-else>
          <v-alert type="error">
            Некорректные данные категории.
            <pre>{{ item }}</pre> <!-- Выводим проблемный item для отладки -->
          </v-alert>
        </template>
      </template>
    </v-data-iterator>

    <!-- BottomSheet для показа выбранного контента -->
    <BottomSheetWithClose
        v-model="bottomSheet"
        :title="selectedItem?.title"
    >
      <div v-html="formattedContent" class="py-2 px-4"></div>
    </BottomSheetWithClose>

    <ReferralLink></ReferralLink>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BottomSheetWithClose from '../../components/shared/BottomSheetWithClose.vue';
import ReferralLink from '../../components/shared/ReferralLink.vue';

/**
 * Описывает структуру одного «поста» (записи в блоге).
 */
interface Post {
  title: string;   // Заголовок
  content: string; // Полное содержимое (текст)
  image?: string;  // Путь к картинке (необязательно)
}

/**
 * Описывает структуру категории (тега),
 * в которой может быть несколько постов.
 */
interface Category {
  name: string;         // Название категории
  description?: string; // Доп. описание (если нужно)
  posts: Post[];        // Список постов
}

/**
 * Массив категорий (тегов).
 */
const categories = ref<Category[]>([
  {
    name: 'Общие советы',
    posts: [
      {
        title: 'Азы питания',
        content:
            'Питание играет определяющую роль при правильных тренировках...' // укорочено для примера
      },
      {
        title: 'Питание и тренировки',
        content:
            '- Перед тренировкой нужно обязательно покушать...'
      },
    ],
  },
  {
    name: 'Цели',
    posts: [
      {
        title: 'Похудение',
        content:
            'Рацион выглядит так: ...'
      },
      {
        title: 'Удержание',
        content:
            'Питание для удержания: ...'
      },
      {
        title: 'Набор массы',
        content:
            'Рацион на набор массы: ...'
      },
    ],
  },
  {
    name: 'Пол',
    posts: [
      {
        title: 'Мужчинам',
        content:
            'Примерный рацион: ...'
      },
      {
        title: 'Женщинам',
        content:
            'Примерный рацион: ...'
      },
    ],
  },
]);

/**
 * Состояния для управления BottomSheet.
 */
const bottomSheet = ref(false);
const selectedItem = ref<Post | null>(null);

/**
 * Функция для открытия BottomSheet с выбранным постом.
 */
function openBottomSheet(post: Post) {
  selectedItem.value = post;
  bottomSheet.value = true;
}

/**
 * Приводим текст к HTML с нужными переносами строк и списками.
 */
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

/**
 * Функция для логирования и проверки элемента категории.
 * @param item - текущий элемент категории
 * @returns boolean - возвращает true, если item валиден, иначе false
 */
function logAndCheckItem(item: Category | undefined) {
  if (!item) {
    console.error('Категория не определена:', item);
    return false;
  }

  if (typeof item.name !== 'string') {
    console.error('Категория имеет некорректное имя:', item);
    return false;
  }

  if (!Array.isArray(item.posts)) {
    console.error('Категория имеет некорректные посты:', item);
    return false;
  }

  if (item.description && typeof item.description !== 'string') {
    console.error('Категория имеет некорректное описание:', item);
    return false;
  }

  console.log('Категория валидна:', item.name);
  return true;
}

// Дополнительный лог при монтировании компонента
console.log('Инициализация категорий:', categories.value);
</script>

<style scoped>
.nutrition-advice {
  padding: 16px;
}

.my-4 {
  margin: 16px 0;
}

/* Для текста, чтобы переносился по словам */
.py-2.px-4 {
  white-space: normal !important;
  word-break: break-word;
}
</style>
