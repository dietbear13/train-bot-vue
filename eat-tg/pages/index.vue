<!-- pages/index.vue -->
<template>
  <v-container class="home-container" fluid>
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
    >
    <transition-group name="fade" tag="div" class="v-row">
      <!-- Карточки -->
      <v-col
          v-for="card in cards"
          :key="card.title"
          cols="12"
          sm="6"
          md="4"
          lg="3"
          class="px-4 pb-0"
          variant="tonal"
      >
        <NuxtLink :to="card.link" class="nuxt-link">
          <v-card
              class="dark-background clickable-card rounded-lg"
              outlined
              dark
              tile
          >
            <v-card-title class="headline">
              <v-icon left large>{{ card.icon }}</v-icon>
              {{ card.title }}
            </v-card-title>
            <v-card-text class="card-description">
              <!-- Вложенные карточки для описания -->
              <v-card
                  v-for="(item, index) in card.descriptions"
                  :key="index"
                  class="sub-card rounded-lg"
                  outlined
                  flat
                  tile
              >
                <v-card-text class="sub-description pa-2">
                  {{ item }}
                </v-card-text>
              </v-card>
            </v-card-text>
          </v-card>
        </NuxtLink>
      </v-col>
    </transition-group>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Card {
  title: string;
  descriptions: string[]; // Список строк описания
  link: string;
  icon: string;
}

const cards = ref<Card[]>([
  {
    title: 'Программы питания',
    descriptions: [
      'Калькулятор КБЖУ для занимающихся в тренажёрном зале.',
      'Основы питания для силовых тренировок.',
      'Примеры рационов питания для мужчин и женщин.'
    ],
    link: '/nutrition',
    icon: 'mdi-food-apple'
  },
  {
    title: 'Генератор тренировок',
    descriptions: [
      'Генерация бесконечного числа разнообразных тренировок на конкретную мышцу.',
      'Генерация разных сплитов на неделю и подбор упражнений по ним.',
      'База с 1100+ упражнений для дома, йоги, воркаута, TRX, МФР, кроссфита.'
    ],
    link: '/training',
    icon: 'mdi-dumbbell'
  },
  {
    title: 'TODO',
    descriptions: [
      'Подумать можно ли тут сделать ссылку на таб.',
      'Если нет, сделать некликабельный блок с онбордингом.'
    ],
    link: '/profile',
    icon: 'mdi-alert-circle'
  }
]);
</script>

<style scoped>
.home-container {
  padding: 8px;
  background-color: #121212;
  min-height: calc(100vh - 56px);
}

.v-row {
  margin: -1px;
}

.v-col {
  padding: 1px;
}

.clickable-card {
  background-color: #FFFFFF19;
  border-radius: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.clickable-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
}

.headline {
  color: #ffffff;
  display: flex;
  align-items: center;
}

.v-icon {
  margin-right: 8px;
}

.card-description {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sub-card {
  background-color: #FFFFFF19;
  border: none;
  border-radius: 8px;
  padding: 8px;
}

.sub-description {
  color: #b0bec5;
  font-size: 14px;
}

.nuxt-link {
  text-decoration: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 800px) {
  .headline {
    font-size: 20px;
  }

  .sub-description {
    font-size: 16px;
    border-radius: 16px;
  }

  .v-icon {
    margin-right: 4px;
    font-size: 20px;
  }
}

.v-card {
  border: none;
}
</style>
