<!-- pages/index.vue -->
<template>
  <v-container class="home-container" fluid>
    <transition-group name="fade" tag="div" class="v-row">
      <!-- Карточка "Nutrition" -->
      <v-col
          v-for="card in cards"
          :key="card.title"
          cols="12"
          sm="6"
          md="4"
          lg="3"
          class="pa-0.5"
          variant="tonal"
      >
        <NuxtLink :to="card.link" class="nuxt-link">
          <v-card
              class="home-card clickable-card rounded-lg"
              outlined
              dark
              tile
          >
            <v-card-title class="headline">
              <v-icon left large>{{ card.icon }}</v-icon>
              {{ card.title }}
            </v-card-title>
            <v-card-text class="card-description">
              {{ card.description }}
            </v-card-text>
          </v-card>
        </NuxtLink>
      </v-col>
    </transition-group>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Card {
  title: string
  description: string
  link: string
  icon: string
}

const cards = ref<Card[]>([
  {
    title: 'Программы питания',
    description: 'Основы гибкого питания и совмещение с силовыми тренировками. ',
    link: '/nutrition',
    icon: 'mdi-food-apple'
  },
  {
    title: 'Генератор тренировок',
    description: 'Генерируй бесконечное число вариантов тренировок на конкретную мышцу или сразу целыми сплитами.',
    link: '/training',
    icon: 'mdi-dumbbell'
  },
  {
    title: 'TODO',
    description: 'Подумать можно ли тут сделать ссылку на таб. Если нет, сделать некликабельный блок с онбордингом.',
    link: '/profile',
    icon: 'mdi-alert-circle'
  }
  // Добавьте дополнительные карточки по необходимости
])
</script>

<style scoped>
.home-container {
  padding: 16px;
  background-color: #121212; /* Тёмный фон страницы */
  min-height: calc(100vh - 56px); /* Учёт высоты нижней навигации */
}

.v-row {
  margin: -1px; /* Для компенсации внутренних отступов колонок */
}

.v-col {
  padding: 1px;
}

.clickable-card {
  background-color: #1e1e1e; /* Тёмный фон карточек */
  border-radius: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer; /* Индикатор кликабельности */
}

.clickable-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
}

.headline {
  color: #ffffff; /* Светлый текст заголовка */
  display: flex;
  align-items: center;
}

.v-icon {
  margin-right: 8px;
}

.card-description {
  color: #b0bec5; /* Светло-серый текст описания */
  font-size: 14px;
  margin-top: 8px;
}

.nuxt-link {
  text-decoration: none;
}

/* Плавные переходы при загрузке карточек */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 800px) {
  .headline {
    font-size: 20px;
  }

  .card-description {
    font-size: 16px;
  }

  .v-icon {
    margin-right: 4px;
    font-size: 20px;
  }
}

.v-card {
  border: #FFFFFF19 1px;
  border-radius: 10px;
}
</style>
