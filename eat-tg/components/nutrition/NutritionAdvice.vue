<!-- components/nutrition/NutritionAdvice.vue -->
<template>
  <v-app>
    <!-- Верхняя панель с заголовком и кнопкой админки (только для администратора) -->
    <v-app-bar v-if="isAdmin" color="primary" dark elevated>
      <v-toolbar-title>Рационы питания</v-toolbar-title>
      <v-btn v-if="isAdmin" color="secondary" class="ma-2" @click="toggleAdmin">
        {{ showAdminPanel ? 'Закрыть админку' : 'Открыть админку' }}
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <!-- Если включён режим админки, показываем DietsAdmin -->
        <DietsAdmin v-if="showAdminPanel" />
        <!-- Иначе показываем страницу с рациональными советами -->
        <div v-else>
          <v-card class="nutrition-advice-card" style="border-radius: 16px">
            <v-card-title class="text-h5 font-weight-bold">
              Примеры питания
            </v-card-title>
            <v-card-text>
              Тут лежат примеры рационов питания и советы.
            </v-card-text>

            <!-- Перебор секций, полученных через API -->
            <v-expansion-panels multiple>
              <v-expansion-panel v-for="(section, index) in allSections" :key="index">
                <v-expansion-panel-title class="text-h6" color="#2f4f4f">
                  {{ section.title }}
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p v-if="section.description">
                    {{ section.description }}
                  </p>

                  <!-- Перебор постов внутри секции -->
                  <div class="post-list">
                    <v-card
                        v-for="(item, i) in section.items"
                        :key="i"
                        outlined
                        variant="tonal"
                        class="post-card"
                        style="border-radius: 16px; margin-bottom: 16px"
                    >
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
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card>

          <!-- Модальное окно (BottomSheet) для подробного просмотра -->
          <BottomSheetWithClose v-model="bottomSheet" :title="selectedItem?.title">
            <div v-html="formattedContent" class="py-2 px-4"></div>
          </BottomSheetWithClose>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BottomSheetWithClose from '../../components/shared/BottomSheetWithClose.vue';
import { useUserStore } from '~/stores/userStore'; // Проверьте путь в вашем проекте
import DietsAdmin from '../userAndAdmin/DietsAdmin.vue';
import { useApi } from '~/composables/useApi';

/** Типы данных для постов и секций */
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

/** Состояние для секций, заполняемое из API */
const allSections = ref<NutritionSection[]>([]);

/** Используем composable useApi для запросов к серверу */
const { apiRequest } = useApi();

/** Функция загрузки данных из API */
async function loadSections() {
  try {
    // Получаем данные по маршруту GET /dietsList
    // Предполагается, что сервер возвращает массив объектов, соответствующих NutritionSection
    const data = await apiRequest<NutritionSection[]>('GET', 'dietsList');
    allSections.value = data;
  } catch (error) {
    console.error('Ошибка при загрузке рационов:', error);
  }
}

onMounted(() => {
  loadSections();
});

/** Состояния для BottomSheet и выбранного элемента */
const bottomSheet = ref(false);
const selectedItem = ref<NutritionExample | null>(null);

function openBottomSheet(item: NutritionExample) {
  selectedItem.value = item;
  bottomSheet.value = true;
}

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

/** Управление режимом админки */
const userStore = useUserStore();
const isAdmin = computed(() => userStore.role === 'admin');
const showAdminPanel = ref(false);
function toggleAdmin() {
  showAdminPanel.value = !showAdminPanel.value;
}
</script>

<style scoped>
.nutrition-advice-card {
  margin: 8px auto;
  max-width: 800px;
  padding: 24px;
}

.py-2.px-4 {
  white-space: normal !important;
  word-break: break-word;
}
</style>
