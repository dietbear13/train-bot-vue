<!-- components/nutrition/NutritionAdvice.vue -->
<template>
  <v-app>
    <v-main>
      <v-container>
        <v-card class="nutrition-advice-card" style="border-radius: 16px">
          <v-card-title class="text-h5 font-weight-bold">
            Примеры питания
          </v-card-title>
          <v-card-text>
            Тут лежат примеры рационов питания и советы, автоматически сгруппированные для мужчин и женщин.
          </v-card-text>

          <!-- Группировка: Мужчинам -->
          <v-expansion-panels multiple variant="popout">
            <v-expansion-panel>
              <v-expansion-panel-title class="text-h6" color="#2f4f4f">
                Мужчинам
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div v-if="menSections.length === 0">
                  Нет рационов для мужчин
                </div>
                <div v-else>
                  <!-- Перебираем каждый документ (раздел) из menSections -->
                  <v-expansion-panels multiple>
                    <v-expansion-panel
                        v-for="(doc, docIndex) in menSections"
                        :key="doc._id"
                    >
                      <v-expansion-panel-title color="#2f4f4f">
                        <!-- Выводим очищенный заголовок без (мужчины) -->
                        {{ cleanTitle(doc.title) }}
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <p v-if="doc.description">{{ doc.description }}</p>

                        <div
                            v-for="(item, itemIndex) in doc.items"
                            :key="itemIndex"
                            class="post-list"
                        >
                          <v-card
                              outlined
                              variant="tonal"
                              class="post-card mt-2"
                              style="border-radius: 16px"
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
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Группировка: Женщинам -->
            <v-expansion-panel>
              <v-expansion-panel-title class="text-h6" color="#2f4f4f">
                Женщинам
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div v-if="womenSections.length === 0">
                  Нет рационов для женщин
                </div>
                <div v-else>
                  <v-expansion-panels multiple variant="popout">
                    <v-expansion-panel
                        v-for="(doc, docIndex) in womenSections"
                        :key="doc._id"
                    >
                      <v-expansion-panel-title color="#2f4f4f">
                        <!-- Очищаем (женщины) -->
                        {{ cleanTitle(doc.title) }}
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <p v-if="doc.description">{{ doc.description }}</p>

                        <div
                            v-for="(item, itemIndex) in doc.items"
                            :key="itemIndex"
                            class="post-list"
                        >
                          <v-card
                              outlined
                              variant="tonal"
                              class="post-card mt-2"
                              style="border-radius: 16px"
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
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Дополнительно: прочие рационы (если нужны) -->
            <v-expansion-panel>
              <v-expansion-panel-title class="text-h6" color="#2f4f4f">
                Прочие рационы
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div v-if="otherSections.length === 0">
                  Нет прочих рационов
                </div>
                <div v-else>
                  <v-expansion-panels multiple variant="popout">
                    <v-expansion-panel
                        v-for="(doc, docIndex) in otherSections"
                        :key="doc._id"
                    >
                      <v-expansion-panel-title color="#2f4f4f">
                        <!-- Здесь обычный заголовок, т.к. он не содержит (мужчины)/(женщины) -->
                        {{ cleanTitle(doc.title) }}
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <p v-if="doc.description">{{ doc.description }}</p>

                        <div
                            v-for="(item, itemIndex) in doc.items"
                            :key="itemIndex"
                            class="post-list"
                        >
                          <v-card
                              outlined
                              variant="tonal"
                              class="post-card mt-2"
                              style="border-radius: 16px"
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
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>

        <!-- BottomSheet для подробного просмотра конкретного item -->
        <BottomSheetWithClose v-model="bottomSheet" :title="selectedItem?.title">
          <div v-html="formattedContent" class="py-2 px-4"></div>
        </BottomSheetWithClose>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import BottomSheetWithClose from '~/components/shared/BottomSheetWithClose.vue'

/** Интерфейсы для данных */
interface INutritionExample {
  title: string
  content: string
  shortDescription?: string
}

interface IDietsList {
  _id: string
  title: string
  description?: string
  items: INutritionExample[]
}

/** Списки рационов, которые придут из базы (GET /dietsList) */
const allDiets = ref<IDietsList[]>([])

/** Группированные списки: мужчины, женщины и прочие */
const menSections = ref<IDietsList[]>([])
const womenSections = ref<IDietsList[]>([])
const otherSections = ref<IDietsList[]>([])

/** BottomSheet */
const bottomSheet = ref(false)
const selectedItem = ref<INutritionExample | null>(null)

/** Для запросов к серверу */
const { apiRequest } = useApi()

/** При монтировании — загрузка данных */
onMounted(async () => {
  try {
    allDiets.value = await apiRequest<IDietsList[]>('GET', 'dietsList')
    groupByGender(allDiets.value)
  } catch (error) {
    console.error('Ошибка при загрузке рационов:', error)
  }
})

/**
 * Группировка рационов по мужским/женским/прочим,
 * исходя из содержания title (или другого критерия).
 */
function groupByGender(diets: IDietsList[]) {
  const men = diets.filter((d) =>
      d.title.toLowerCase().includes('(мужчины)')
  )
  const women = diets.filter((d) =>
      d.title.toLowerCase().includes('(женщины)')
  )
  const others = diets.filter(
      (d) =>
          !d.title.toLowerCase().includes('(мужчины)') &&
          !d.title.toLowerCase().includes('(женщины)')
  )

  menSections.value = men
  womenSections.value = women
  otherSections.value = others
}

/**
 * Убираем "(мужчины)" или "(женщины)" из отображаемого заголовка,
 * чтобы не дублировать эту информацию в интерфейсе.
 */
function cleanTitle(rawTitle: string): string {
  return rawTitle
      .replace(/\(мужчины\)/gi, '')
      .replace(/\(женщины\)/gi, '')
      .trim()
}

/** Открыть BottomSheet с подробным описанием одного пункта */
function openBottomSheet(item: INutritionExample) {
  selectedItem.value = item
  bottomSheet.value = true
}

/** Форматирование контента для вывода в BottomSheet */
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
.nutrition-advice-card {
  margin: 8px auto;
  max-width: 800px;
  padding: 8px;
}
.post-card {
  padding: 8px;
}

</style>
