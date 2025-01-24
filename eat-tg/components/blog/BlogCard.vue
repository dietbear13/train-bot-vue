<template>
  <v-col
      cols="12"
  >
    <!-- Поисковая строка внутри дочернего компонента -->
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
            >
              <v-icon left>
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

// Структура постов — пример
interface Post {
  id: number
  title: string
  text: string
  likesCount: number
  userLiked: boolean
}

// telegramUserId
const telegramUserId = ref<number | null>(null)

onMounted(() => {
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
  }
})

// Пример массива постов (будут подгружаться с сервера)
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

// Клик по лайку
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

// Следим за изменениями во всех постах (deep: true)
watch(
    () => posts.value,
    (newVal, oldVal) => {
      newVal.forEach((newPost, index) => {
        const oldPost = oldVal?.[index]
        if (oldPost && newPost.userLiked !== oldPost.userLiked) {
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

// Отправка данных о лайке на ваш бэкенд
async function sendLikeToServer(
    telegramId: string | null,
    postId: number,
    like: boolean
) {
  if (!telegramId) return
  try {
    await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId,
        postId,
        like,
      }),
    })
  } catch (error) {
    console.error('Ошибка при отправке лайка:', error)
  }
}
</script>

<style scoped>
/* Пример простой стилизации (на ваш вкус) */
.text-justify {
  text-align: justify;
}
</style>
