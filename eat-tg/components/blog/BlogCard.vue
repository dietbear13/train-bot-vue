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

    <!-- Контент: если данные ещё загружаются, показываем скелетоны,
         иначе – реальные карточки -->
    <v-row class="mt-1">
      <template v-if="loading">
        <!-- Два скелетона карточки -->
        <v-col v-for="n in 2" :key="n" cols="12" style="padding: 8px">
          <v-card class="post-card" outlined max-width="600">
            <v-card-text class="px-4 pt-4 pb-0">
              <!-- Скелетон для заголовка -->
              <v-skeleton-loader type="heading" width="60%" />
            </v-card-text>

            <v-card-text class="pb-0">
              <!-- Скелетоны для текста -->
              <v-skeleton-loader type="text" width="90%" class="mb-2" />
              <v-skeleton-loader type="text" width="80%" />
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <!-- Скелетоны для кнопок -->
              <v-skeleton-loader type="button" width="30%" class="mr-2 mb-2 mt-0" />
              <v-skeleton-loader type="button" width="20%" class="mr-2 mb-2 mt-0" />
            </v-card-actions>
          </v-card>
        </v-col>
      </template>
      <template v-else>
        <!-- Перебираем посты и выводим карточки -->
        <v-col
            v-for="post in paginatedPosts"
            :key="post.id"
            cols="12"
            style="padding: 8px"
        >
          <v-card class="post-card" outlined max-width="600">
            <v-card-text class="text-h6 blog-content d-block px-4 pt-4 pb-0">
              <!-- Якорь с уникальным id для поста -->
              <a :id="'post-${post.id}'">{{ post.title }}</a>
            </v-card-text>

            <v-card-text class="pb-0">
              <!-- Вывод HTML контента -->
              <div class="blog-content d-block" v-html="post.text"></div>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>

              <!-- Кнопка "Поделиться" через Telegram -->
              <v-btn
                  color="primary"
                  variant="tonal"
                  :href="getTelegramShareUrl(post)"
                  target="_blank"
                  class="mr-2 mb-2 mt-0"
              >
                <v-icon left>mdi-send</v-icon>
                Поделиться
              </v-btn>

              <!-- Кнопка лайка -->
              <v-btn
                  :color="post.userLiked ? 'red darken-3' : 'grey darken-1'"
                  variant="tonal"
                  @click="toggleLike(post.id)"
                  class="mr-2 mb-2 mt-0"
              >
                <v-icon class="mr-1" left>mdi-heart</v-icon>
                {{ post.likesCount }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </template>
    </v-row>

    <!-- Пагинация: отображается, если постов больше, чем postsPerPage -->
    <v-row v-if="!loading && pageCount > 1" justify="center" class="mt-4">
      <v-pagination
          v-model="currentPage"
          :length="pageCount"
          total-visible="7"
      ></v-pagination>
    </v-row>

    <!-- Фиксированные кнопки прокрутки вверх и вниз -->
    <v-btn icon class="scroll-button up" @click="scrollToTop">
      <v-icon>mdi-arrow-up</v-icon>
    </v-btn>
    <v-btn icon class="scroll-button down" @click="scrollToBottom">
      <v-icon>mdi-arrow-down</v-icon>
    </v-btn>
  </v-col>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { retrieveLaunchParams } from '@telegram-apps/sdk'
import { useApi } from '../../composables/useApi'
import type { LikeResponse } from '../../types/LikeResponse'
import { useUserStore } from '../../stores/userStore'

// Расширенный тип ответа для обновления лайков
interface ExtendedLikeResponse extends LikeResponse {
  newLikesCount?: number
}

// Интерфейс поста
interface Post {
  id: string
  title: string
  text: string
  telegramPostUrl?: string
  likesCount: number
  userLiked: boolean
}

const userStore = useUserStore()
const { apiRequest } = useApi()
const telegramUserId = ref<number | null>(null)
const posts = ref<Post[]>([])
const searchQuery = ref('')
const loading = ref(true)

// Объект для хранения общего количества лайков по id поста
const aggregatedLikes = ref<Record<string, number>>({})

// --- Пагинация ---
// Количество постов на странице
const postsPerPage = 10
// Текущая страница
const currentPage = ref(1)

// Фильтрация постов по поисковому запросу
const filteredPosts = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return posts.value
  return posts.value.filter(
      post =>
          post.title.toLowerCase().includes(query) ||
          post.text.toLowerCase().includes(query)
  )
})

// Общее число страниц
const pageCount = computed(() =>
    Math.ceil(filteredPosts.value.length / postsPerPage)
)

// Посты для текущей страницы
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage
  return filteredPosts.value.slice(start, start + postsPerPage)
})

// Сброс номера страницы при изменении запроса
watch(searchQuery, () => {
  currentPage.value = 1
})

// Прокрутка вверх при смене страницы
watch(currentPage, () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
})

// Режим отладки
const debug = true
function log(...args: any[]) {
  if (debug) console.log(...args)
}

onMounted(async () => {
  if (!process.client) return

  // 0) Получаем данные пользователя из Telegram
  const launchParams = retrieveLaunchParams()
  if (launchParams?.initData?.user?.id) {
    telegramUserId.value = Number(launchParams.initData.user.id)
  } else {
    console.error('Не удалось получить данные пользователя из Telegram.')
  }

  // if (userStore.isCacheValid(userStore.blogArticles.timestamp)) {
  //   posts.value = userStore.blogArticles.data
  //   loading.value = false
  //   return
  // }

  try {
    // 1) Получаем список постов
    const blogData = await apiRequest<any[]>('GET', '/blog')
    console.log('📰 Загружены данные блога в карточке:', blogData);

    // Маппим данные постов
    const mappedPosts = blogData.map(item => ({
      id: item._id.toString(),
      title: item.title,
      text: item.body,
      telegramPostUrl: item.telegramPostUrl || '',
      likesCount: 0,
      userLiked: false
    })) as Post[]

    // 2) Загружаем ЛИЧНЫЕ лайки пользователя (если есть telegramUserId)
    let userLikes: { postId: string | number }[] = []
    if (telegramUserId.value) {
      userLikes = await apiRequest<{ postId: string | number }[]>(
          'GET',
          '/blog-likes',
          undefined,
          { telegramId: telegramUserId.value }
      )
      log('userLikes =>', userLikes)
    }

    // 3) Загружаем агрегированное число лайков по всем пользователям
    const allLikesStats = await apiRequest<{ postId: string; count: number }[]>(
        'GET',
        '/blog-likes/all'
    )
    log('allLikesStats =>', allLikesStats)
    allLikesStats.forEach(item => {
      aggregatedLikes.value[item.postId] = item.count
    })

    // 4) Объединяем данные постов: устанавливаем userLiked и общее количество лайков
    posts.value = mappedPosts.map(post => {
      const foundLike = userLikes.find(l => String(l.postId) === post.id)
      const aggregatedCount = aggregatedLikes.value[post.id] || 0
      return {
        ...post,
        userLiked: Boolean(foundLike),
        likesCount: aggregatedCount
      }
    })
    log('posts (final) =>', posts.value)
  } catch (error) {
    console.error('Ошибка при загрузке статей или лайков:', error)
  } finally {
    loading.value = false
  }
})

// Функция для формирования ссылки для Telegram share
function getTelegramShareUrl(post: Post): string {
  const urlToShare =
      post.telegramPostUrl && post.telegramPostUrl.length > 0
          ? post.telegramPostUrl
          : window.location.href
  const textToShare = post.title
  return `https://t.me/share/url?url=${encodeURIComponent(
      urlToShare
  )}&text=${encodeURIComponent(textToShare)}`
}

// Обработка клика по кнопке лайка
function toggleLike(postId: string) {
  const post = posts.value.find(p => p.id === postId)
  if (!post) return

  // Изменяем userLiked и предвосхищаем изменение лайков
  post.userLiked = !post.userLiked
  post.likesCount += post.userLiked ? 1 : -1

  sendLikeToServer(telegramUserId.value?.toString() ?? null, postId, post.userLiked)
}

// Отслеживаем изменения лайков и отправляем их на сервер
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

// Отправка данных лайка на сервер
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
    const response = await apiRequest<ExtendedLikeResponse>(
        'POST',
        '/blog-likes',
        {
          telegramId,
          postId,
          like
        }
    )
    log('sendLikeToServer response =>', response)
    if (response.success && typeof response.newLikesCount === 'number') {
      aggregatedLikes.value[postId] = response.newLikesCount

      const post = posts.value.find(p => p.id === postId)
      if (post) post.likesCount = response.newLikesCount

    } else if (!response.success) {
      console.error('Ошибка при обновлении лайка на сервере:', response.message)
    }
  } catch (error) {
    console.error('Ошибка при отправке лайка:', error)
  }
}

// Прокрутка страницы вверх
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// Прокрутка страницы вниз
function scrollToBottom() {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth'
  })
}
</script>

<style scoped>
.post-card {
  margin: 0 auto;
  border-radius: 16px;
}

/* Стили для фиксированных кнопок прокрутки */
.scroll-button {
  position: fixed;
  right: 20px;
  opacity: 0.7;
  z-index: 1000;
}

.scroll-button.up {
  bottom: 80px;
}

.scroll-button.down {
  bottom: 20px;
}
</style>
