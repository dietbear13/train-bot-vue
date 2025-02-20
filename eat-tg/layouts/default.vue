<template>
  <v-app>
    <v-main>
      <Transition :name="transitionName" mode="out-in">
        <NuxtPage/>
      </Transition>
    </v-main>

    <v-bottom-navigation
        v-model="currentTab"
        color="primary"
        app
        height="62"
        class="bottom-navigation"
        grow
    >
      <v-btn
          v-for="item in menuItems"
          :key="item.name"
          :value="item.name"
          @click="navigate(item.path)"
          icon

      >
        <v-icon size="large" :class="{ 'selected-icon': currentTab === item.name }">{{ item.icon }}</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { onMounted } from "vue";
import { useUserStore } from "../stores/userStore";

const userStore = useUserStore();

onMounted(async () => {
  await userStore.fetchUserData();
});

const router = useRouter();
const route = useRoute();

const menuItems = [
  { name: 'home', path: '/', icon: 'mdi-dumbbell', order: 1 },
  { name: 'blog', path: '/blog', icon: 'mdi-school', order: 2 },
  { name: 'nutrition', path: '/nutrition', icon: 'mdi-food-apple', order: 3 },
  { name: 'profile', path: '/profile', icon: 'mdi-account', order: 4 },
];

const currentTab = ref('home');
const previousOrder = ref(1);
const previousPath = ref('/');

const navigate = (path) => {
  router.push(path);
};

const transitionName = computed(() => {
  const currentItem = menuItems.find((item) => item.path === route.path);
  const previousItem = menuItems.find((item) => item.path === previousPath.value);

  // Если переходим с главной страницы на другую — всегда "slide-left"
  if (previousPath.value === '/' && route.path !== '/') {
    return 'slide-left';
  }

  if (currentItem && previousItem) {
    if (currentItem.order > previousItem.order) {
      return 'slide-left';
    } else {
      return 'slide-right';
    }
  }

  // По умолчанию
  return 'slide-left';
});

watch(
    () => route.path,
    (newPath, oldPath) => {
      console.log("paths: ",oldPath, newPath);
      const currentItem = menuItems.find((item) => item.path === newPath);
      const previousItem = menuItems.find((item) => item.path === oldPath);

      if (currentItem) {
        currentTab.value = currentItem.name;
      }

      if (previousItem) {
        previousOrder.value = previousItem.order;
        previousPath.value = previousItem.path;
      } else {
        previousOrder.value = 0;
        previousPath.value = '/';
      }
    },
    { immediate: true }
);
</script>

<style scoped>
/* Анимация слайда влево */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.2s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-enter-to {
  transform: translateX(0%);
}

.slide-left-leave-from {
  transform: translateX(0%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

/* Анимация слайда вправо */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.2s ease;
}

.slide-right-enter-from {
  transform: translateX(-100%);
}

.slide-right-enter-to {
  transform: translateX(0%);
}

.slide-right-leave-from {
  transform: translateX(0%);
}

.slide-right-leave-to {
  transform: translateX(100%);
}

/* Стили для нижнего меню */
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

/* Новый стиль для увеличенной иконки выбранного пункта */
.selected-icon {
  font-size: 40px; /* Увеличьте значение по необходимости */
  transition: font-size 0.2s ease;
}
</style>
