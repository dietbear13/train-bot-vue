<!-- components/userAndAdmin/BlogAdmin.vue -->
<template>
  <v-app>
    <!-- Боковая панель (Список статей) -->
    <v-navigation-drawer
        permanent
        width="400"
        class="drawer-bg"
        theme="dark"
    >
      <v-list color="transparent">
        <v-list-subheader class="text-h6 text-white">
          Список статей
        </v-list-subheader>

        <!-- Список статей -->
        <v-list-item
            v-for="item in posts"
            :key="item._id"
            @click="selectPost(item)"
            :active="item._id === selectedPostId"
            class="text-white"
        >
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2" />

        <!-- Кнопка для создания новой статьи -->
        <v-list-item
            prepend-icon="mdi-plus"
            title="Создать новую статью"
            class="text-white"
            @click="newPost"
        />
      </v-list>

      <!-- Кнопка "Выйти" внизу -->
      <template #append>
        <div class="pa-2">
          <v-btn block color="secondary" @click="logout">
            Выйти
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Основная часть -->
    <v-main>
      <v-container fluid class="py-2">
        <v-row>
          <v-col>
            <v-card elevation="3">
              <v-card-title>
                <span v-if="selectedPostId">Редактирование статьи</span>
                <span v-else>Создание новой статьи</span>
              </v-card-title>

              <v-divider />

              <v-card-text>
                <!-- Поле "Заголовок" -->
                <v-text-field
                    label="Заголовок"
                    v-model="form.title"
                    variant="outlined"
                    class="mb-4"
                />

                <!-- Новое поле: Ссылка на пост в Telegram -->
                <v-text-field
                    label="Ссылка на пост в Telegram"
                    v-model="form.telegramPostUrl"
                    variant="outlined"
                    class="mb-4"
                    placeholder="https://t.me/training_health/54"
                />

                <!-- TinyMCE Editor для тела поста -->
                <Editor
                    :api-key="tinyMceKey"
                    :init="tinymceInit"
                    v-model="form.body"
                    id="tinymce-editor"
                />
              </v-card-text>

              <v-divider />

              <v-card-actions>
                <v-btn color="primary" @click="savePost">
                  Сохранить
                </v-btn>
                <v-spacer />
                <v-btn color="error" v-if="selectedPostId" @click="deletePost">
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

// Интерфейс для статьи (с новым полем)
interface IBlogItem {
  _id: string
  title: string
  body: string
  telegramPostUrl?: string
  likesCount: number
  publishedAt: string // или Date
}

const drawer = ref(true)
const selectedPostId = ref<string | null>(null)
const posts = ref<IBlogItem[]>([])

// Форма с добавленным полем telegramPostUrl
const form = ref({
  title: '',
  body: '',
  telegramPostUrl: '',
})

const router = useRouter()

// Чтение ключа TinyMCE из runtimeConfig
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
    'autoresize',
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

const { apiRequest } = useApi()

onMounted(async () => {
  await loadPosts()
})

// Загрузка списка постов
async function loadPosts() {
  try {
    const data = await apiRequest<IBlogItem[]>('GET', '/blog')
    posts.value = data
  } catch (err) {
    console.error('Ошибка при загрузке постов:', err)
  }
}

// Выбор статьи для редактирования
function selectPost(item: IBlogItem) {
  selectedPostId.value = item._id
  form.value.title = item.title
  form.value.body = item.body
  form.value.telegramPostUrl = item.telegramPostUrl || ''
}

// Создание новой статьи
function newPost() {
  selectedPostId.value = null
  form.value.title = ''
  form.value.body = ''
  form.value.telegramPostUrl = ''
}

// Сохранение статьи (создание или обновление)
async function savePost() {
  try {
    if (!form.value.title || !form.value.body) {
      alert('Заполните заголовок и текст')
      return
    }

    if (selectedPostId.value) {
      // Обновление существующей статьи
      await apiRequest('PUT', `/blog/${selectedPostId.value}`, {
        title: form.value.title,
        body: form.value.body,
        telegramPostUrl: form.value.telegramPostUrl,
      })
    } else {
      // Создание новой статьи
      await apiRequest('POST', '/blog', {
        title: form.value.title,
        body: form.value.body,
        telegramPostUrl: form.value.telegramPostUrl,
      })
    }
    await loadPosts()
    newPost()
  } catch (error) {
    console.error('Ошибка при сохранении статьи:', error)
  }
}

// Удаление статьи
async function deletePost() {
  if (!selectedPostId.value) return
  if (!confirm('Точно удалить эту статью?')) return

  try {
    await apiRequest('DELETE', `/blog/${selectedPostId.value}`)
    await loadPosts()
    newPost()
  } catch (error) {
    console.error('Ошибка при удалении статьи:', error)
  }
}

// Выход из админки
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
