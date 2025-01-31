<!-- components/blog/BlogCard.vue -->
<template>
  <v-col cols="12">
    <!-- Поисковая строка -->
    <v-text-field
        v-model="searchQuery"
        variant="outlined"
        placeholder="Поиск..."
        hide-details
        dense
        width="'100%'"
        prepend-inner-icon="mdi-magnify"
        class="ma-0 shrink"
    />

    <!-- Перебираем посты и выводим карточки -->
    <v-row class="mt-3">
      <v-col
          v-for="post in filteredPosts"
          :key="post.id"
          cols="12"
          style="padding: 8px"
      >
        <v-card
            class="post-card"
            outlined
            max-width="600"
        >
          <v-card-text class="text-h6 blog-content d-block px-4 pt-4 pb-0">
            {{ post.title }}
          </v-card-text>

          <v-card-text class="pb-0">
            <!-- Просто выводим HTML контент -->
            <div class="blog-content d-block" v-html="post.text"></div>
          </v-card-text>

          <v-card-actions>
            <!-- Кнопка лайка -->
            <v-spacer></v-spacer>
            <v-btn
                :color="post.userLiked ? 'red darken-3' : 'grey darken-1'"
                variant="tonal"
                @click="toggleLike(post.id)"
                class="mx-2 mb-2 mt-0"
            >
              <v-icon class="mr-1" left>mdi-heart</v-icon>
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
import { useApi } from '../../composables/useApi'
import type { LikeResponse } from '../../types/LikeResponse' // Убедитесь, что путь корректен

interface Post {
  id: string
  title: string
  text: string
  likesCount: number
  userLiked: boolean
}

const { apiRequest } = useApi()
const telegramUserId = ref<number | null>(null)
const posts = ref<Post[]>([])
const searchQuery = ref('')

// Логирование для отладки
const debug = true

// Функция для логирования, если включён режим отладки
function log(...args: any[]) {
  if (debug) {
    console.log(...args)
  }
}

onMounted(async () => {
  if (!process.client) return

  // 0) Получаем данные Telegram-пользователя
  const launchParams = retrieveLaunchParams()
  if (launchParams?.initData?.user?.id) {
    telegramUserId.value = Number(launchParams.initData.user.id)
  } else {
    console.error('Не удалось получить данные пользователя из Telegram.')
  }

  try {
    // 1) Список постов из /blog
    const blogData = await apiRequest<any[]>('GET', '/blog')
    log('blogData =>', blogData)

    // Маппим для удобства
    const mappedPosts = blogData.map(item => ({
      id: item._id.toString(), // Убедитесь, что id строка
      title: item.title,
      text: item.body,
      // likesCount и userLiked позже
      likesCount: 0,
      userLiked: false,
    })) as Post[]

    // 2) Загружаем ЛИЧНЫЕ лайки пользователя (если есть telegramUserId)
    let userLikes: { postId: string | number }[] = []
    if (telegramUserId.value) {
      userLikes = await apiRequest<{ postId: string | number }[]>('GET', '/blog-likes', undefined, {
        telegramId: telegramUserId.value
      })
      log('userLikes =>', userLikes)
    }

    // 3) Загружаем агрегированное число лайков по всем пользователям
    //    Формат ответа: [{ postId: 'xyz', count: 5 }, ...]
    const allLikesStats = await apiRequest<{ postId: string; count: number }[]>('GET', '/blog-likes/all')
    log('allLikesStats =>', allLikesStats)

    // Превратим в объект вида { [postId]: count }
    const likeCountsMap: Record<string, number> = {}
    allLikesStats.forEach(item => {
      likeCountsMap[item.postId] = item.count
    })
    log('likeCountsMap =>', likeCountsMap)

    // 4) Склеиваем данные: likesCount из allLikesStats, userLiked из userLikes
    posts.value = mappedPosts.map(post => {
      const foundLike = userLikes.find(l => String(l.postId) === post.id)
      const aggregatedCount = likeCountsMap[post.id] || 0
      return {
        ...post,
        userLiked: Boolean(foundLike),
        likesCount: aggregatedCount,
      }
    })

    log('posts (final) =>', posts.value)
  } catch (error) {
    console.error('Ошибка при загрузке статей или лайков:', error)
  }
})

// Фильтрация
const filteredPosts = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return posts.value
  return posts.value.filter(post =>
      post.title.toLowerCase().includes(query) ||
      post.text.toLowerCase().includes(query)
  )
})

// При клике на лайк: локально меняем userLiked и likesCount,
// а потом отправляем POST-запрос, чтобы записать в базу
function toggleLike(postId: string) {
  const post = posts.value.find(p => p.id === postId)
  if (!post) return

  // Смена локального статуса
  post.userLiked = !post.userLiked

  // Локальный инкремент/декремент счётчика
  post.likesCount += post.userLiked ? 1 : -1
  if (post.likesCount < 0) post.likesCount = 0 // на всякий случай

  log(`Post ${postId} liked: ${post.userLiked}, new likesCount: ${post.likesCount}`)
}

// Отслеживаем изменения userLiked, отправляем запрос
watch(
    () => posts.value.map(post => post.userLiked),
    (newLikes, oldLikes) => {
      newLikes.forEach((liked, index) => {
        const oldLiked = oldLikes[index]
        if (liked !== oldLiked) {
          const postId = posts.value[index].id
          sendLikeToServer(
              telegramUserId.value ? telegramUserId.value.toString() : null,
              postId,
              liked
          )
        }
      })
    }
)

// Запрос на сервер, чтобы создать/обновить запись лайка в User.blogLikes
async function sendLikeToServer(
    telegramId: string | null,
    postId: string,
    like: boolean
) {
  if (!telegramId) {
    console.error('sendLikeToServer: нет telegramId')
    return
  }
  try {
    // Указываем тип ответа как LikeResponse
    const response = await apiRequest<LikeResponse>('POST', '/blog-likes', {
      telegramId,
      postId,
      like,
    })
    log('sendLikeToServer response =>', response)

    if (!response.success) {
      console.error('Ошибка при обновлении лайка на сервере:', response.message)
      // Возвращаем предыдущий статус
      const post = posts.value.find(p => p.id === postId)
      if (post) {
        post.userLiked = !like
        post.likesCount += like ? -1 : 1
        if (post.likesCount < 0) post.likesCount = 0
      }
    }
  } catch (error) {
    console.error('Ошибка при отправке лайка:', error)
    // Возвращаем предыдущий статус
    const post = posts.value.find(p => p.id === postId)
    if (post) {
      post.userLiked = !like
      post.likesCount += like ? -1 : 1
      if (post.likesCount < 0) post.likesCount = 0
    }
  }
}
</script>

<style scoped>
.post-card {
  margin: 0 auto;
  border-radius: 16px;
}
</style>
