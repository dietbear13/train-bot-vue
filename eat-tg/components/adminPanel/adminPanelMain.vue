<template>
  <v-card class="d-flex" style="min-height: 100vh;">
    <!-- Боковая панель навигации -->
    <v-navigation-drawer app permanent dark class="bg-deep-purple">
      <v-list
          v-model:opened="open"
          dense
          value="menu"
          class="pl-6"
      >
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" title="Меню" prepend-icon="mdi-menu"></v-list-item>
          </template>

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
import { ref } from 'vue'

// Импорт компонентов для разделов
import UsersAnalytics from '../../components/adminPanel/UsersAnalytics.vue'
import Blog from '../../components/adminPanel/Blog.vue'
import ExercisesTrainings from '../../components/adminPanel/ExercisesTrainings.vue'
import NutritionTips from '../../components/adminPanel/NutritionTips.vue'
import CommunicatorMain from "./communicator/CommunicatorMain.vue";

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
    icon: 'mdi-food-apple',
    component: CommunicatorMain,
  },
]

// По умолчанию подгружаем первый компонент
const activeComponent = ref(menuItems[0].component)

// Переменная для управления раскрытием группы меню
const open = ref(['menu'])

// Функция для смены активного компонента
function changeComponent(component: any) {
  activeComponent.value = component
}

// Простейшая функция выхода
function logout() {
  console.log('Выполнен выход из системы')
}
</script>
