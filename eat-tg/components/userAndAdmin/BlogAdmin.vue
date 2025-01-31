<!-- components/userAndAdmin/BlogAdmin.vue -->

<template>
  <v-app>
    <v-navigation-drawer
        v-model="drawer"
        :temporary="!isDesktop"
        :permanent="isDesktop"
        app
        class="drawer-bg"
        theme="dark"
        :width="drawerWidth"
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

      <!-- Кнопка "Выйти" внизу -->
      <template #append>
        <div class="pa-2">
          <v-btn block color="secondary" @click="logout">
            Выйти
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-main>
      <!-- Верхняя панель (AppBar) -->
      <v-app-bar
          color="deep-purple darken-3"
          dark
          elevated
          app
      >
        <v-app-bar-nav-icon @click="toggleDrawer" />
        <v-toolbar-title>Админка блога</v-toolbar-title>

        <v-spacer />

        <!-- Кнопка на тулбаре для перехода в fullscreen -->
        <v-btn icon @click="web_app_request_fullscreen" title="Полноэкранный режим">
          <v-icon>mdi-fullscreen</v-icon>
        </v-btn>
      </v-app-bar>

      <!-- Основное содержимое: поля редактирования -->
      <v-container fluid class="py-2">
        <v-row>
          <v-col cols="12" md="8" lg="6" xl="5">
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
                    :dense="!isDesktop"
                ></v-text-field>

                <!-- ПАНЕЛЬ ФОРМАТИРОВАНИЯ -->
                <div class="d-flex flex-wrap mb-2">
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
                  <!-- Новые кнопки форматирования -->
                  <v-btn icon @click="insertParagraph" title="Абзац">
                    <v-icon>mdi-format-paragraph</v-icon>
                  </v-btn>
                  <v-btn icon @click="insertOrderedList" title="Нумерованный список">
                    <v-icon>mdi-format-list-numbered</v-icon>
                  </v-btn>
                  <v-btn icon @click="insertUnorderedList" title="Маркированный список">
                    <v-icon>mdi-format-list-bulleted</v-icon>
                  </v-btn>
                  <!-- Кнопка для демонстрации HTML-кода -->
                  <v-btn icon @click="toggleHtmlView" title="Переключить HTML">
                    <v-icon>mdi-code-tags</v-icon>
                  </v-btn>
                </div>

                <!-- Поле "Текст статьи" или его HTML-представление -->
                <div v-if="!isHtmlView">
                  <!-- WYSIWYG-редактор -->
                  <div
                      class="wysiwyg-editor"
                      contenteditable="true"
                      @input="updateBodyFromEditor"
                      @keydown.enter.prevent="handleEnter"
                      ref="wysiwygEditor"
                      v-html="form.body"
                  ></div>
                </div>
                <div v-else>
                  <!-- Редактор HTML-кода -->
                  <v-textarea
                      label="HTML-код статьи"
                      v-model="form.body"
                      rows="10"
                      variant="outlined"
                      :dense="!isDesktop"
                  ></v-textarea>
                </div>
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
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useApi } from '../../composables/useApi'
import { useDisplay } from 'vuetify'

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
const bodyTextarea = ref<any>(null)

// Переключение между отображением HTML-кода
const isHtmlView = ref(false)

// Ссылка на WYSIWYG-редактор
const wysiwygEditor = ref<HTMLElement | null>(null)

// Импорт API-запросов
const { apiRequest } = useApi()

// Получение информации о текущем размере экрана
const display = useDisplay()
const isDesktop = computed(() => display.mdAndUp)
const drawerWidth = computed(() => (isDesktop.value ? 270 : 240)) // Пример адаптивной ширины

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

    if (isHtmlView.value) {
      // Валидация HTML-кода
      if (!validateHTML(form.value.body)) {
        alert('Неправильный HTML-код. Пожалуйста, исправьте ошибки.')
        return
      }
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

// ------------------------------
// Метод для перехода в fullscreen
// ------------------------------
function web_app_request_fullscreen() {
  const docEl = document.documentElement

  // Проверяем, поддерживает ли браузер requestFullscreen
  if (docEl.requestFullscreen) {
    docEl.requestFullscreen()
  } else if ((docEl as any).mozRequestFullScreen) {
    (docEl as any).mozRequestFullScreen()
  } else if ((docEl as any).webkitRequestFullscreen) {
    (docEl as any).webkitRequestFullscreen()
  } else if ((docEl as any).msRequestFullscreen) {
    (docEl as any).msRequestFullscreen()
  } else {
    alert('Полноэкранный режим не поддерживается вашим браузером')
  }
}

// --------------
// Мини-редактор
// --------------

// Функция для оборачивания выделенного текста в заданные теги
function wrapSelectedText(tag: string) {
  if (isHtmlView.value) {
    // Если в режиме HTML, вставляем теги непосредственно в textarea
    insertTagInTextarea(tag)
  } else {
    // Если в режиме WYSIWYG, оборачиваем выделенный текст
    insertTagInWysiwyg(tag)
  }
}

function insertTagInTextarea(tag: string) {
  const textarea = bodyTextarea.value?.$refs.input as HTMLTextAreaElement | null
  if (!textarea) return

  const { selectionStart, selectionEnd } = textarea
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
    textarea.focus()
    const newPos = selectionEnd + openTag.length + closeTag.length
    textarea.setSelectionRange(newPos, newPos)
  })
}

function insertTagInWysiwyg(tag: string) {
  const editor = wysiwygEditor.value
  if (!editor) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const selectedText = range.toString()

  if (!selectedText) {
    alert('Выделите текст для применения форматирования.')
    return
  }

  // Создаем элемент с нужным тегом
  const element = document.createElement(tag)
  element.textContent = selectedText

  // Заменяем выделенный текст на новый элемент
  range.deleteContents()
  range.insertNode(element)

  // Обновляем `form.body` с новым содержимым редактора
  form.value.body = editor.innerHTML
}

// Функция для вставки абзаца
function insertParagraph() {
  if (isHtmlView.value) {
    insertTagInTextarea('p')
  } else {
    const editor = wysiwygEditor.value
    if (!editor) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)

    // Создаем новый абзац
    const p = document.createElement('p')
    p.innerHTML = '<br>' // Добавляем перенос строки внутри абзаца

    // Вставляем абзац в текущую позицию курсора
    range.deleteContents()
    range.insertNode(p)

    // Перемещаем курсор внутрь нового абзаца
    range.setStart(p, 0)
    range.setEnd(p, 0)
    selection.removeAllRanges()
    selection.addRange(range)

    // Обновляем `form.body` с новым содержимым редактора
    form.value.body = editor.innerHTML
  }
}

// Функция для вставки цитаты
function insertQuote() {
  if (isHtmlView.value) {
    insertTagInTextarea('blockquote')
  } else {
    const editor = wysiwygEditor.value
    if (!editor) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    if (!selectedText) {
      alert('Выделите текст для вставки цитаты.')
      return
    }

    // Создаем блок цитаты
    const blockquote = document.createElement('blockquote')
    blockquote.textContent = selectedText

    // Заменяем выделенный текст на блок цитаты
    range.deleteContents()
    range.insertNode(blockquote)

    // Обновляем `form.body` с новым содержимым редактора
    form.value.body = editor.innerHTML
  }
}

// Функция для вставки ссылки
function insertLink() {
  if (isHtmlView.value) {
    insertLinkInTextarea()
  } else {
    insertLinkInWysiwyg()
  }
}

function insertLinkInTextarea() {
  const textarea = bodyTextarea.value?.$refs.input as HTMLTextAreaElement | null
  if (!textarea) return

  const url = prompt('Введите URL для ссылки') || '#'
  const { selectionStart, selectionEnd } = textarea
  if (selectionStart == null || selectionEnd == null) return

  const before = form.value.body.slice(0, selectionStart)
  const selected = form.value.body.slice(selectionStart, selectionEnd) || 'Текст ссылки'
  const after = form.value.body.slice(selectionEnd)

  const linkTag = `<a href="${url}" target="_blank">${selected}</a>`
  form.value.body = before + linkTag + after

  // Обновляем курсор
  nextTick(() => {
    textarea.focus()
    const newPos = selectionStart + linkTag.length
    textarea.setSelectionRange(newPos, newPos)
  })
}

function insertLinkInWysiwyg() {
  const url = prompt('Введите URL для ссылки') || '#'
  if (!url) return

  document.execCommand('createLink', false, url)
  // Обновляем `form.body` с новым содержимым редактора
  const editor = wysiwygEditor.value
  if (editor) {
    form.value.body = editor.innerHTML
  }
}

// Функция для вставки нумерованного списка
function insertOrderedList() {
  if (isHtmlView.value) {
    insertListInTextarea('ol', 'custom-ol')
  } else {
    document.execCommand('insertOrderedList', false, null)
    const editor = wysiwygEditor.value
    if (editor) {
      form.value.body = editor.innerHTML
    }
  }
}

// Функция для вставки маркированного списка
function insertUnorderedList() {
  if (isHtmlView.value) {
    insertListInTextarea('ul', 'custom-ul')
  } else {
    document.execCommand('insertUnorderedList', false, null)
    const editor = wysiwygEditor.value
    if (editor) {
      form.value.body = editor.innerHTML
    }
  }
}

function insertListInTextarea(listType: 'ol' | 'ul', className: string) {
  const textarea = bodyTextarea.value?.$refs.input as HTMLTextAreaElement | null
  if (!textarea) return

  const { selectionStart, selectionEnd } = textarea
  if (selectionStart == null || selectionEnd == null) return

  const selected = form.value.body.slice(selectionStart, selectionEnd) || 'Элемент списка'
  let listTag = ''

  if (listType === 'ol') {
    listTag = `<ol class="${className}"><li>${selected}</li></ol>`
  } else if (listType === 'ul') {
    listTag = `<ul class="${className}"><li>${selected}</li></ul>`
  }

  const before = form.value.body.slice(0, selectionStart)
  const after = form.value.body.slice(selectionEnd)

  form.value.body = before + listTag + after

  // Обновляем курсор
  nextTick(() => {
    textarea.focus()
    const newPos = selectionStart + listTag.length
    textarea.setSelectionRange(newPos, newPos)
  })
}

// Функция для переключения между режимами отображения
function toggleHtmlView() {
  if (!isHtmlView.value) {
    // При переключении из WYSIWYG в HTML, сохраняем текущее содержимое редактора
    if (wysiwygEditor.value) {
      form.value.body = wysiwygEditor.value.innerHTML
    }
  } else {
    // При переключении из HTML в WYSIWYG, ничего не нужно делать
    // Так как изменения будут обновлены через v-model
  }
  isHtmlView.value = !isHtmlView.value
}

// Функция для обновления `form.body` при изменении содержимого WYSIWYG-редактора
function updateBodyFromEditor(event: Event) {
  const editor = wysiwygEditor.value
  if (editor) {
    form.value.body = editor.innerHTML
  }
}

// Функция для обработки нажатия клавиши Enter в WYSIWYG-редакторе
function handleEnter(event: KeyboardEvent) {
  const editor = wysiwygEditor.value
  if (!editor) return

  // Создаем новую строку с тегом <p>
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const currentNode = range.startContainer.parentNode as HTMLElement

  // Проверяем, находится ли курсор внутри параграфа
  if (currentNode && currentNode.tagName.toLowerCase() === 'p') {
    // Создаем новый параграф
    const newP = document.createElement('p')
    newP.innerHTML = ''

    // Вставляем новый параграф после текущего
    currentNode.parentNode?.insertBefore(newP, currentNode.nextSibling)

    // Перемещаем курсор в новый параграф
    range.setStart(newP, 0)
    range.setEnd(newP, 0)
    selection.removeAllRanges()
    selection.addRange(range)

    // Обновляем `form.body`
    form.value.body = editor.innerHTML
  } else {
    // В других случаях, стандартное поведение
    document.execCommand('insertParagraph')
    form.value.body = editor.innerHTML
  }
}

// Функция для валидации HTML-кода
function validateHTML(html: string): boolean {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const errors = doc.getElementsByTagName('parsererror')
  return errors.length === 0
}
</script>

<style scoped>
/* Фон боковой панели */
.drawer-bg {
  background-color: #4527a0 !important; /* deep-purple darken-3 */
}

/* Чтобы текст в списке был лучше виден */
.text-white {
  color: #ffffff !important;
}

/* Адаптивные отступы для мобильных устройств */
@media (max-width: 600px) {
  .v-card-title {
    font-size: 1.2rem;
  }
}

/* Стили для WYSIWYG-редактора */
.wysiwyg-editor {
  border: 1px solid #ccc;
  border-radius: 4px;
  min-height: 200px;
  padding: 10px;
  overflow: auto;
}

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

/* Стилизация цитат */
.wysiwyg-editor blockquote {
  border-left: 4px solid #cccccc;
  padding-left: 1em;
  color: #666666;
  font-style: italic;
  margin: 1em 0;
  background-color: #f9f9f9;
  border-radius: 4px;
}

/* Дополнительные стили по необходимости */

/* Жирный текст */
.wysiwyg-editor b,
.wysiwyg-editor strong {
  font-weight: bold;
}

/* Курсивный текст */
.wysiwyg-editor i,
.wysiwyg-editor em {
  font-style: italic;
}

/* Подчёркивание текста */
.wysiwyg-editor u {
  text-decoration: underline;
}

/* Зачёркивание текста */
.wysiwyg-editor s,
.wysiwyg-editor strike {
  text-decoration: line-through;
}

/* Стилизация ссылок */
.wysiwyg-editor a {
  color: #1e88e5;
  text-decoration: none;
}

.wysiwyg-editor a:hover {
  text-decoration: underline;
}
</style>
