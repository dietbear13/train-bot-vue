<template>
  <v-row>
    <!-- Левая колонка: список статей -->
    <v-col cols="4">
      <v-card>
        <v-card-title>
          <div class="d-flex align-center justify-space-between" style="width: 100%;">
            <span>Список статей</span>
            <v-btn color="primary" @click="newPost">Новая</v-btn>
          </div>
        </v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
                v-for="item in posts"
                :key="item._id"
                @click="selectPost(item)"
                :active="item._id === selectedPostId"
            >
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Правая колонка: редактирование/создание -->
    <v-col cols="8">
      <v-card>
        <v-card-title v-if="selectedPostId">Редактирование статьи</v-card-title>
        <v-card-title v-else>Создание новой статьи</v-card-title>

        <v-card-text>
          <v-text-field
              label="Заголовок"
              v-model="form.title"
          ></v-text-field>

          <v-textarea
              label="Текст статьи"
              v-model="form.body"
              rows="10"
          ></v-textarea>
        </v-card-text>

        <v-card-actions>
          <v-btn color="primary" @click="savePost">Сохранить</v-btn>
          <v-spacer />
          <v-btn color="error" v-if="selectedPostId" @click="deletePost">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '../../composables/useApi'

interface IBlogItem {
  _id: string;
  title: string;
  body: string;
  likesCount: number;
  publishedAt: string; // или Date
}

const { apiRequest } = useApi()

const posts = ref<IBlogItem[]>([])
const selectedPostId = ref<string | null>(null)

// Форма редактирования/создания
const form = ref({
  title: '',
  body: '',
})

// При загрузке сразу получим список
onMounted(async () => {
  await loadPosts()
})

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
}

// Создание новой статьи (очищаем форму)
function newPost() {
  selectedPostId.value = null
  form.value.title = ''
  form.value.body = ''
}

// Сохранение (create/update)
async function savePost() {
  try {
    if (!form.value.title || !form.value.body) {
      alert('Заполните заголовок и текст')
      return
    }

    if (selectedPostId.value) {
      // Update
      const resp = await apiRequest('PUT', `/blog/${selectedPostId.value}`, {
        title: form.value.title,
        body: form.value.body,
      })
      console.log('Обновили статью:', resp)
    } else {
      // Create
      const resp = await apiRequest('POST', '/blog', {
        title: form.value.title,
        body: form.value.body,
      })
      console.log('Создали статью:', resp)
    }

    // Перезагрузим список
    await loadPosts()
    // Очистим форму
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
    const resp = await apiRequest('DELETE', `/blog/${selectedPostId.value}`)
    console.log('Удалили статью:', resp)
    // Перезагрузим список
    await loadPosts()
    // Очистим форму
    newPost()
  } catch (error) {
    console.error('Ошибка при удалении статьи:', error)
  }
}
</script>
