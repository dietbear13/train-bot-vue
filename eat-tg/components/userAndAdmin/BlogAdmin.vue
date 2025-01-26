<template>
  <!-- Карточка, оборачивающая всё содержимое -->
  <v-card max-height="100%">
    <v-layout row>
      <!-- ЛЕВАЯ КОЛОНКА (меню, список статей) -->
      <v-navigation-drawer
          v-model="drawer"
          :permanent="false"
          app
          class="drawer-bg"
      theme="dark"
      width="270"
      >
      <v-list color="transparent">
        <v-list-subheader class="text-h6 text-white">Список статей</v-list-subheader>

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

        <v-divider class="my-2"></v-divider>

        <!-- Кнопка для создания новой статьи -->
        <v-list-item
            prepend-icon="mdi-plus"
            title="Создать новую статью"
            class="text-white"
            @click="newPost"
        />
      </v-list>

      <!-- Кнопка "Выйти" внизу (пример) -->
      <template #append>
        <div class="pa-2">
          <v-btn block color="secondary" @click="logout">
            Выйти
          </v-btn>
        </div>
      </template>
      </v-navigation-drawer>

      <!-- ПРАВАЯ ЧАСТЬ: верхняя панель (AppBar) и основная зона -->
      <v-main style="width: 100%;">
        <!-- Верхняя панель (AppBar) -->
        <v-app-bar color="deep-purple darken-3" dark elevated>
          <v-app-bar-nav-icon @click="toggleDrawer" />
          <v-toolbar-title>Админка блога</v-toolbar-title>
          <v-spacer />
        </v-app-bar>

        <!-- Основное содержимое: поля редактирования -->
        <v-container fluid class="py-4">
          <v-row>
            <v-col cols="12">
              <v-card elevation="3">
                <v-card-title>
                  <span v-if="selectedPostId">Редактирование статьи</span>
                  <span v-else>Создание новой статьи</span>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text>
                  <!-- Поле "Заголовок" -->
                  <v-text-field
                      label="Заголовок"
                      v-model="form.title"
                      variant="outlined"
                      class="mb-4"
                  ></v-text-field>

                  <!-- ПАНЕЛЬ ФОРМАТИРОВАНИЯ -->
                  <div class="d-flex flex-row mb-2">
                    <v-btn icon @click="wrapSelectedText('b')" title="Жирный">
                      <v-icon>mdi-format-bold</v-icon>
                    </v-btn>
                    <v-btn icon @click="wrapSelectedText('i')" title="Курсив">
                      <v-icon>mdi-format-italic</v-icon>
                    </v-btn>
                    <v-btn icon @click="wrapSelectedText('u')" title="Подчёркивание">
                      <v-icon>mdi-format-underline</v-icon>
                    </v-btn>
                    <v-btn icon @click="wrapSelectedText('strike')" title="Зачёркивание">
                      <v-icon>mdi-format-strikethrough</v-icon>
                    </v-btn>
                    <v-btn icon @click="insertQuote" title="Цитата">
                      <v-icon>mdi-format-quote-close</v-icon>
                    </v-btn>
                    <v-btn icon @click="insertLink" title="Ссылка">
                      <v-icon>mdi-link</v-icon>
                    </v-btn>
                  </div>

                  <!-- Поле "Текст статьи" -->
                  <v-textarea
                      ref="bodyTextarea"
                      label="Текст статьи (HTML)"
                      v-model="form.body"
                      rows="10"
                      variant="outlined"
                  ></v-textarea>
                </v-card-text>

                <v-divider></v-divider>

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
    </v-layout>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, type Ref, nextTick } from 'vue'
import { useApi } from '../../composables/useApi'

// Интерфейс для статьи
interface IBlogItem {
  _id: string
  title: string
  body: string
  likesCount: number
  publishedAt: string // или Date
}

// --------
//  State
// --------
const drawer = ref(true) // Открыт ли navigation-drawer
const selectedPostId = ref<string | null>(null)
const posts = ref<IBlogItem[]>([])

// Форма для создания/редактирования статьи
const form = ref({
  title: '',
  body: '',
})

// Ссылка на <v-textarea>, чтобы работать с выделением
const bodyTextarea = ref<HTMLElement | null>(null) as Ref<HTMLElement | null>

// Импорт API-запросов
const { apiRequest } = useApi()

// --------------
// Жизненный цикл
// --------------
onMounted(async () => {
  await loadPosts()
})

// ----------------
// Методы API
// ----------------
async function loadPosts() {
  try {
    const data = await apiRequest<IBlogItem[]>('GET', '/blog')
    posts.value = data
  } catch (err) {
    console.error('Ошибка при загрузке постов:', err)
  }
}

function selectPost(item: IBlogItem) {
  selectedPostId.value = item._id
  form.value.title = item.title
  form.value.body = item.body
}

function newPost() {
  selectedPostId.value = null
  form.value.title = ''
  form.value.body = ''
}

async function savePost() {
  try {
    if (!form.value.title || !form.value.body) {
      alert('Заполните заголовок и текст')
      return
    }

    if (selectedPostId.value) {
      // Обновление
      await apiRequest('PUT', `/blog/${selectedPostId.value}`, {
        title: form.value.title,
        body: form.value.body,
      })
      console.log('Статья обновлена')
    } else {
      // Создание
      await apiRequest('POST', '/blog', {
        title: form.value.title,
        body: form.value.body,
      })
      console.log('Статья создана')
    }
    // Перезагружаем список
    await loadPosts()
    // Очищаем форму
    newPost()
  } catch (error) {
    console.error('Ошибка при сохранении статьи:', error)
  }
}

async function deletePost() {
  if (!selectedPostId.value) return
  if (!confirm('Точно удалить эту статью?')) return

  try {
    await apiRequest('DELETE', `/blog/${selectedPostId.value}`)
    console.log('Статья удалена')
    await loadPosts()
    newPost()
  } catch (error) {
    console.error('Ошибка при удалении статьи:', error)
  }
}

// -------------
// Прочие методы
// -------------
function toggleDrawer() {
  drawer.value = !drawer.value
}

function logout() {
  alert('Выход из системы! (пример)')
}

// --------------
// Мини-редактор
// --------------
function wrapSelectedText(tag: string) {
  const el = bodyTextarea.value?.querySelector('textarea') as HTMLTextAreaElement | null
  if (!el) return

  const { selectionStart, selectionEnd } = el
  if (selectionStart == null || selectionEnd == null) return

  const before = form.value.body.slice(0, selectionStart)
  const selected = form.value.body.slice(selectionStart, selectionEnd)
  const after = form.value.body.slice(selectionEnd)

  let openTag = `<${tag}>`
  let closeTag = `</${tag}>`

  // Особый случай для "strike"
  if (tag === 'strike') {
    openTag = '<s>'
    closeTag = '</s>'
  }

  // Собираем новую строку
  form.value.body = before + openTag + selected + closeTag + after

  // Обновляем курсор
  nextTick(() => {
    el.focus()
    const newPos = selectionEnd + openTag.length + closeTag.length
    el.setSelectionRange(newPos, newPos)
  })
}

function insertQuote() {
  const el = bodyTextarea.value?.querySelector('textarea') as HTMLTextAreaElement | null
  if (!el) return

  const { selectionStart, selectionEnd } = el
  if (selectionStart == null || selectionEnd == null) return

  const before = form.value.body.slice(0, selectionStart)
  const selected = form.value.body.slice(selectionStart, selectionEnd)
  const after = form.value.body.slice(selectionEnd)

  const blockquoteTag = `<blockquote>${selected}</blockquote>`
  form.value.body = before + blockquoteTag + after

  nextTick(() => {
    el.focus()
    const newPos = selectionStart + blockquoteTag.length
    el.setSelectionRange(newPos, newPos)
  })
}

function insertLink() {
  const el = bodyTextarea.value?.querySelector('textarea') as HTMLTextAreaElement | null
  if (!el) return

  const url = prompt('Введите URL для ссылки') || '#'
  const { selectionStart, selectionEnd } = el
  if (selectionStart == null || selectionEnd == null) return

  const before = form.value.body.slice(0, selectionStart)
  const selected = form.value.body.slice(selectionStart, selectionEnd) || 'Текст ссылки'
  const after = form.value.body.slice(selectionEnd)

  const linkTag = `<a href="${url}" target="_blank">${selected}</a>`
  form.value.body = before + linkTag + after

  nextTick(() => {
    el.focus()
    const newPos = selectionStart + linkTag.length
    el.setSelectionRange(newPos, newPos)
  })
}
</script>

<style scoped>
/* Вы можете подкорректировать цвета и стили на свой вкус */

/* Фон боковой панели */
.drawer-bg {
  background-color: #4527a0 !important; /* deep-purple darken-3 */
}

/* Чтобы текст в списке был лучше виден */
.text-white {
  color: #ffffff !important;
}
</style>
