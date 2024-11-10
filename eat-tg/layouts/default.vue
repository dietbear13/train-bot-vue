<template>
  <v-app>
    <v-main>
      <Transition :name="transitionName" mode="out-in">
        <NuxtPage />
      </Transition>
    </v-main>

    <v-bottom-navigation
        v-model="currentTab"
        color="primary"
        app
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
        <v-icon size="x-large">{{ item.icon }}</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const menuItems = [
  { name: 'home', path: '/', icon: 'mdi-home', order: 1 },
  { name: 'nutrition', path: '/nutrition', icon: 'mdi-food-apple', order: 2 },
  { name: 'training', path: '/training', icon: 'mdi-dumbbell', order: 3 },
  { name: 'profile', path: '/profile', icon: 'mdi-account', order: 4 },
];

const currentTab = ref('home');
const previousOrder = ref(1);

const navigate = (path) => {
  router.push(path);
};

const transitionName = computed(() => {
  const currentItem = menuItems.find((item) => item.name === currentTab.value);
  if (currentItem.order > previousOrder.value) {
    return 'slide-left';
  } else {
    return 'slide-right';
  }
});

watch(
    () => route.path,
    (newPath, oldPath) => {
      const currentItem = menuItems.find((item) => item.path === newPath);
      const previousItem = menuItems.find((item) => item.path === oldPath);

      if (currentItem) {
        currentTab.value = currentItem.name;

        if (previousItem) {
          previousOrder.value = previousItem.order;
        } else {
          previousOrder.value = currentItem.order;
        }
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
</style>
