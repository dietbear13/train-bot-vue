<template>
  <v-col cols="12">
    <!-- Поисковая строка -->
    <v-text-field
        v-model="searchQuery"
        variant="outlined"
        placeholder="Поиск..."
        hide-details
        dense
        width="100%"
        prepend-inner-icon="mdi-magnify"
        class="ma-2"
    />

    <!-- Перебираем посты и выводим карточки -->
    <v-row>
      <v-col
          v-for="post in filteredPosts"
          :key="post.id"
          cols="12"
      >
        <v-card
            class="mb-0"
            outlined
            max-width="600"
            style="margin: 0 auto; border-radius: 16px"
        >
          <v-card-title class="text-truncate text-break">
            {{ post.title }}
          </v-card-title>

          <!-- Оборачиваем контент в контейнер для применения глобальных стилей -->
          <v-card-text>
            <div class="blog-content" v-html="post.text"></div>
          </v-card-text>

          <v-card-actions class="text-right">
            <!-- Кнопка лайка -->
            <v-btn
                :color="post.userLiked ? 'red darken-3' : 'grey darken-1'"
                variant="tonal"
                @click="toggleLike(post.id)"
                class="ma-2"
            >
              <v-icon class="mr-1" left>
                mdi-heart
              </v-icon>
              {{ post.likesCount }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-col>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { retrieveLaunchParams } from '@telegram-apps/sdk'
// Импортируем наш composable для работы с API
import { useApi } from '../../composables/useApi'

interface Post {
  id: string            // <-- теперь string, т.к. будет хранить _id из Mongo
  title: string
  text: string          // body из базы
  likesCount: number
  userLiked: boolean
}

// Получаем функцию для работы с API
const { apiRequest } = useApi()

// telegramUserId
const telegramUserId = ref<number | null>(null)

// Главный список статей
const posts = ref<Post[]>([])

// Поисковая строка
const searchQuery = ref('')

// ========= onMounted =============
onMounted(async () => {
  if (process.client) {
    const launchParams = retrieveLaunchParams()
    if (launchParams && launchParams.initData && launchParams.initData.user) {
      const user = launchParams.initData.user
      if (user && user.id) {
        telegramUserId.value = Number(user.id)
      } else {
        console.error('Не удалось получить данные пользователя из Telegram.')
      }
    }

    // 1) Загружаем реальные статьи из базы (GET /api/blog)
    try {
      const blogData = await apiRequest<any[]>('GET', '/blog')
      // blogData — массив объектов из MongoDB: [{_id, title, body, likesCount, publishedAt }, ...]
      // Преобразуем их под структуру Post
      const mappedPosts = blogData.map(item => ({
        id: item._id,
        title: item.title,
        text: item.body,
        likesCount: item.likesCount,
        userLiked: false,  // по умолчанию false, дальше уточним
      })) as Post[]

      // Устанавливаем начальные посты
      posts.value = mappedPosts

      // 2) Загружаем лайки пользователя
      if (telegramUserId.value) {
        const likesData = await apiRequest<{ postId: number | string }[]>(
            'GET',
            '/blog-likes',
            null,
            { telegramId: telegramUserId.value }
        )
        // likesData — массив объектов { postId }, которые пользователь лайкнул
        // user.blogLikes хранит postId как Number, а у нас сейчас id = string
        // Для совместимости приведём к строке.
        posts.value = posts.value.map(post => {
          // likesData.postId может быть сохранён как число в базе у User
          const found = likesData.find(l => String(l.postId) === post.id)
          return {
            ...post,
            userLiked: Boolean(found),
          }
        })
      }

    } catch (error) {
      console.error('Ошибка при загрузке статей или лайков:', error)
    }
  }
})


const filteredPosts = computed(() => {
  if (!searchQuery.value) return posts.value
  const query = searchQuery.value.toLowerCase()
  return posts.value.filter(post =>
      post.title.toLowerCase().includes(query) ||
      post.text.toLowerCase().includes(query)
  )
})

// Клик по лайку (локально обновляем UI — увеличиваем/уменьшаем счётчик)
function toggleLike(postId: string) {
  const post = posts.value.find(p => p.id === postId)
  if (!post) return

  if (!post.userLiked) {
    post.userLiked = true
    post.likesCount++
  } else {
    post.userLiked = false
    post.likesCount--
    if (post.likesCount < 0) post.likesCount = 0
  }
}

// Следим за изменениями лайков во всех постах (deep: true)
watch(
    () => posts.value,
    (newVal, oldVal) => {
      newVal.forEach((newPost, index) => {
        const oldPost = oldVal?.[index]
        if (oldPost && newPost.userLiked !== oldPost.userLiked) {
          // Если статус userLiked изменился – отправляем запрос на сервер
          sendLikeToServer(
              telegramUserId.value ? telegramUserId.value.toString() : null,
              newPost.id,
              newPost.userLiked
          )
        }
      })
    },
    { deep: true }
)

// Отправка данных о лайке на бэкенд
async function sendLikeToServer(
    telegramId: string | null,
    postId: string,
    like: boolean
) {
  if (!telegramId) return
  try {
    await apiRequest('POST', '/blog-likes', {
      telegramId,
      postId,
      like,
    })
  } catch (error) {
    console.error('Ошибка при отправке лайка:', error)
  }
}
</script>

<style scoped>

/* Стилизация нумерованных списков с эмодзи */
.custom-ol {
  counter-reset: custom-counter;
  list-style: none;
  padding-left: 1.5em;
}

.custom-ol li::before {
  counter-increment: custom-counter;
  content: counter(custom-counter) "️⃣ ";
  margin-right: 0.5em;
}

/* Стилизация маркированных списков с небольшими отступами */
.custom-ul {
  list-style: disc;
  padding-left: 1.5em;
}
</style>
