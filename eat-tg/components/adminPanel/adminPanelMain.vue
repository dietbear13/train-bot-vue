<template>
  <v-card class="d-flex" style="min-height: 100vh;">
    <!-- Боковая панель навигации -->
    <v-navigation-drawer
        v-model="drawer"
        app
        :permanent="!display.smAndDown.value"
    :temporary="display.smAndDown.value"
    dark
    class="bg-deep-purple"
    >
    <!-- На мобильных можно добавить заголовок/кнопку для закрытия меню -->
    <v-list dense class="pl-6">
      <!-- Заголовок меню (виден только на мобильных) -->
      <v-list-item
          v-if="display.smAndDown.value"
          title="Меню"
          prepend-icon="mdi-menu"
          @click="toggleDrawer"
      ></v-list-item>

      <!-- Список пунктов меню -->
      <v-list-item
          v-for="(item, index) in menuItems"
          :key="index"
          :prepend-icon="item.icon"
          :title="item.title"
          @click="changeComponent(item.component)"
      ></v-list-item>
    </v-list>

    <!-- Кнопка выхода -->
    <template v-slot:append>
      <div class="pa-2">
        <v-btn block color="red" dark @click="logout">
          Выйти
        </v-btn>
      </div>
    </template>
    </v-navigation-drawer>

    <!-- Основная область для подгружаемых компонентов -->
    <v-main class="pa-4">
      <component :is="activeComponent" />
    </v-main>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

// Импорт компонентов для разделов
import UsersAnalytics from '../../components/adminPanel/UsersAnalytics.vue'
import Blog from '../../components/adminPanel/Blog.vue'
import ExercisesTrainings from '../../components/adminPanel/ExercisesTrainings.vue'
import NutritionTips from '../../components/adminPanel/NutritionTips.vue'
import CommunicatorMain from "./communicator/CommunicatorMain.vue"

// Массив пунктов меню
const menuItems = [
  {
    title: 'Пользователи и аналитика',
    icon: 'mdi-account-multiple',
    component: UsersAnalytics,
  },
  {
    title: 'Блог',
    icon: 'mdi-notebook',
    component: Blog,
  },
  {
    title: 'Упражнения и тренировки',
    icon: 'mdi-dumbbell',
    component: ExercisesTrainings,
  },
  {
    title: 'Советы по питанию',
    icon: 'mdi-food-apple',
    component: NutritionTips,
  },
  {
    title: 'Коммуникатор',
    icon: 'mdi-chat',
    component: CommunicatorMain,
  },
]

// По умолчанию подгружаем первый компонент
const activeComponent = ref(menuItems[0].component)

// Для определения размеров экрана используем Vuetify composable
const display = useDisplay()

// Управление состоянием выдвижного меню (drawer)
const drawer = ref(true)

// Инициализация состояния drawer в зависимости от устройства:
// на десктопе меню открыто, а на мобильных по умолчанию скрыто.
watch(
    () => display.smAndDown.value,
    (isMobile) => {
      drawer.value = !isMobile
    },
    { immediate: true }
)

// Функция для смены активного компонента
function changeComponent(component: any) {
  activeComponent.value = component
  // Если на мобильном устройстве, закрываем меню после выбора
  if (display.smAndDown.value) {
    drawer.value = false
  }
}

// Функция для переключения состояния меню (на мобильных)
function toggleDrawer() {
  drawer.value = !drawer.value
}

// Простейшая функция выхода
function logout() {
  console.log('Выполнен выход из системы')
}
</script>
