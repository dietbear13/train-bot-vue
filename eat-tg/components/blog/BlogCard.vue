<template>
  <v-col cols="12">
    <!-- Поисковая строка -->
    <v-text-field
        v-model="searchQuery"
        variant="outlined"
        placeholder="Поиск..."
        hide-details
        dense
        prepend-inner-icon="mdi-magnify"
        class="ma-2"
        style="max-width: 200px;"
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
          <v-card-title>
            {{ post.title }}
          </v-card-title>

          <v-card-text class="text-justify">
            {{ post.text }}
          </v-card-text>

          <v-card-actions>
            <!-- Кнопка лайка -->
            <v-btn
                :color="post.userLiked ? 'red darken-3' : 'grey darken-1'"
                variant="tonal"
                @click="toggleLike(post.id)"
                class="ma-2"
                right
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
import { useApi } from '~/composables/useApi'

// Структура постов — пример
interface Post {
  id: number
  title: string
  text: string
  likesCount: number
  userLiked: boolean
}

// Получаем функцию для работы с API
const { apiRequest } = useApi()

// telegramUserId
const telegramUserId = ref<number | null>(null)

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

    // 1) Пример: при монтировании компонента можем сразу загрузить актуальные лайки пользователя
    //    (если у вас на бэкенде предусмотрен GET /api/blog-likes?telegramId=...)
    if (telegramUserId.value) {
      try {
        const likesData = await apiRequest<{ postId: number }[]>(
            'GET',
            '/blog-likes',
            null, // data для GET обычно не нужен
            { telegramId: telegramUserId.value } // передаём query-параметры
        )

        // likesData может быть массивом постов, которые пользователь лайкнул
        // здесь просто проставляем userLiked = true, если пост есть в likesData
        posts.value = posts.value.map(post => {
          const isLiked = likesData.some(like => like.postId === post.id)
          return {
            ...post,
            userLiked: isLiked,
          }
        })
      } catch (error) {
        console.error('Не удалось загрузить лайки пользователя:', error)
      }
    }
  }
})

// Пример массива постов (будут подгружаться с сервера или пока заглушка)
const posts = ref<Post[]>([
  {
    id: 1,
    title: 'Первая статья',
    text: 'Здесь будет основной текст статьи (пример: 800-1300 слов)...',
    likesCount: 10,
    userLiked: false,
  },
  {
    id: 2,
    title: 'Вторая статья',
    text: 'Еще один текст небольшой статьи...',
    likesCount: 5,
    userLiked: false,
  },
  {
    id: 3,
    title: 'Третья статья',
    text: 'Заготовка для демонстрации...',
    likesCount: 2,
    userLiked: false,
  },
])

// Поисковая строка
const searchQuery = ref('')

// Фильтрованные посты
const filteredPosts = computed(() => {
  if (!searchQuery.value) return posts.value
  const query = searchQuery.value.toLowerCase()
  return posts.value.filter(post =>
      post.title.toLowerCase().includes(query) ||
      post.text.toLowerCase().includes(query)
  )
})

// Клик по лайку (локально обновляем UI — увеличиваем/уменьшаем счётчик)
function toggleLike(postId: number) {
  const post = posts.value.find(p => p.id === postId)
  if (!post) return

  if (!post.userLiked) {
    post.userLiked = true
    post.likesCount++
  } else {
    post.userLiked = false
    post.likesCount--
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
    postId: number,
    like: boolean
) {
  if (!telegramId) return
  try {
    // Используем наш composable useApi
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
.text-justify {
  text-align: justify;
}
</style>
