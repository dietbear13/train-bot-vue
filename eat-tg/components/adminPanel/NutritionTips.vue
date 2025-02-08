<!-- components/nutrition/NutritionTips.vue -->
<template>
  <v-app>
    <!-- Боковая панель (Список рационов) -->
    <v-navigation-drawer
        permanent
        width="400"
        class="drawer-bg"
        theme="dark"
    >
      <v-list color="transparent">
        <v-list-subheader class="text-h6 text-white">
          Список рационов
        </v-list-subheader>

        <!-- Перебираем рацион (diets) -->
        <v-list-item
            v-for="diet in diets"
            :key="diet._id"
            @click="selectDiet(diet)"
            :active="diet._id === selectedDietId"
            class="text-white"
        >
          <v-list-item-title>{{ diet.title }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2" />

        <!-- Кнопка для создания новой записи -->
        <v-list-item
            prepend-icon="mdi-plus"
            title="Создать новый рацион"
            class="text-white"
            @click="newDiet"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- Основная часть -->
    <v-main>
      <v-container fluid class="py-2">
        <v-row>
          <v-col>
            <v-card elevation="3">
              <v-card-title>
                <span v-if="selectedDietId">Редактирование рациона</span>
                <span v-else>Создание нового рациона</span>
              </v-card-title>

              <v-divider />

              <v-card-text>
                <!-- Поле "Заголовок" -->
                <v-text-field
                    label="Название рациона (title)"
                    v-model="form.title"
                    variant="outlined"
                    class="mb-4"
                />

                <!-- TinyMCE Editor для описания (description) -->
                <Editor
                    :api-key="tinyMceKey"
                    :init="tinymceInit"
                    v-model="form.description"
                    id="tinymce-editor-description"
                />

                <!-- Редактирование элементов рациона (items) -->
                <v-divider class="my-4" />
                <div>
                  <h3>Элементы рациона</h3>
                  <div
                      v-for="(item, index) in form.items"
                      :key="index"
                      class="mb-4 pa-4"
                      style="border: 1px solid #ccc; border-radius: 4px;"
                  >
                    <v-text-field
                        label="Заголовок элемента (item.title)"
                        v-model="item.title"
                        variant="outlined"
                        class="mb-2"
                    />
                    <v-text-field
                        label="Краткое описание (item.shortDescription)"
                        v-model="item.shortDescription"
                        variant="outlined"
                        class="mb-2"
                    />
                    <!-- Редактор TinyMCE для содержимого (item.content) -->
                    <Editor
                        :api-key="tinyMceKey"
                        :init="tinymceInitSmall"
                        v-model="item.content"
                        :id="'tinymce-editor-item-' + index"
                    />
                    <v-btn color="error" small @click="removeItem(index)">
                      Удалить элемент
                    </v-btn>
                  </div>

                  <v-btn color="primary" @click="addItem">
                    Добавить новый элемент
                  </v-btn>
                </div>
              </v-card-text>

              <v-divider />

              <v-card-actions>
                <v-btn color="primary" @click="saveDiet">
                  Сохранить
                </v-btn>
                <v-spacer />
                <v-btn color="error" v-if="selectedDietId" @click="deleteDiet">
                  Удалить
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Editor from '@tinymce/tinymce-vue'
import { useRuntimeConfig } from '#imports'
import { useApi } from '../../composables/useApi'

/** Интерфейс для элемента рациона */
interface IDietItem {
  title: string;
  shortDescription: string;
  content: string;
}

/** Интерфейс данных для рациона */
interface IDietsList {
  _id: string;
  title: string;
  description?: string;
  items?: IDietItem[];
}

/** Список рационов */
const diets = ref<IDietsList[]>([])

/** ID выбранного рациона */
const selectedDietId = ref<string | null>(null)

/** Форма для создания/редактирования.
 * Добавлено поле items для редактирования элементов рациона.
 */
const form = ref({
  title: '',
  description: '',
  items: [] as IDietItem[],
})

const router = useRouter()

// TinyMCE – базовая конфигурация для описания
const config = useRuntimeConfig()
const tinyMceKey = config.public.tinyMceKey
console.log('TinyMCE_KEY from config:', tinyMceKey)

const tinymceInit = {
  height: 400,
  menubar: true,
  plugins: [
    'lists',
    'link',
    'image',
    'charmap',
    'code',
    'table',
    'autoresize'
  ],
  toolbar: `undo redo | formatselect | bold italic underline strikethrough |
            blockquote forecolor backcolor | alignleft aligncenter alignright alignjustify |
            bullist numlist outdent indent | link image table charmap | code`,
  content_style: `
    body {
      font-family:Helvetica,Arial,sans-serif;
      font-size:14px;
    }
  `
}

// Конфигурация для TinyMCE в редакторах содержимого элементов (уменьшенная высота, упрощённый набор кнопок)
const tinymceInitSmall = {
  height: 200,
  menubar: false,
  plugins: ['lists', 'link', 'code'],
  toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | code',
  content_style: `
    body {
      font-family:Helvetica,Arial,sans-serif;
      font-size:14px;
    }
  `
}

const { apiRequest } = useApi()

/** Загрузка всех рационов при монтировании */
onMounted(async () => {
  await loadDiets()
})

async function loadDiets() {
  try {
    // Например: GET /dietsList
    diets.value = await apiRequest<IDietsList[]>('GET', 'dietsList')
  } catch (err) {
    console.error('Ошибка при загрузке рационов:', err)
  }
}

/** Выбор рациона из списка */
function selectDiet(diet: IDietsList) {
  selectedDietId.value = diet._id
  form.value.title = diet.title
  form.value.description = diet.description || ''
  // Если у рациона нет элементов, устанавливаем пустой массив
  form.value.items = diet.items ? [...diet.items] : []
}

/** Создание нового рациона (очистка формы) */
function newDiet() {
  selectedDietId.value = null
  form.value.title = ''
  form.value.description = ''
  form.value.items = []
}

/** Добавление нового элемента в список */
function addItem() {
  form.value.items.push({
    title: '',
    shortDescription: '',
    content: '',
  })
}

/** Удаление элемента из списка */
function removeItem(index: number) {
  form.value.items.splice(index, 1)
}

/** Сохранение (создание или обновление) */
async function saveDiet() {
  try {
    if (!form.value.title) {
      alert('Введите название рациона')
      return
    }

    const payload = {
      title: form.value.title,
      description: form.value.description,
      items: form.value.items,
    }

    if (selectedDietId.value) {
      // Обновляем
      await apiRequest('PUT', `dietsList/${selectedDietId.value}`, payload)
    } else {
      // Создаём новый документ
      await apiRequest('POST', 'dietsList', payload)
    }
    await loadDiets()
    newDiet()
  } catch (error) {
    console.error('Ошибка при сохранении рациона:', error)
  }
}

/** Удаление рациона */
async function deleteDiet() {
  if (!selectedDietId.value) return
  if (!confirm('Точно удалить этот рацион?')) return

  try {
    await apiRequest('DELETE', `dietsList/${selectedDietId.value}`)
    await loadDiets()
    newDiet()
  } catch (error) {
    console.error('Ошибка при удалении рациона:', error)
  }
}

/** Выход из админки */
function logout() {
  localStorage.removeItem('authToken')
  router.push('/login')
}
</script>

<style scoped>
.drawer-bg {
  background-color: #6b41e6 !important; /* deep-purple darken-3 */
}
.text-white {
  color: #ffffff !important;
}
</style>
