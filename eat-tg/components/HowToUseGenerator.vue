<!-- components/HowToUse.vue -->
<template>
  <div v-if="visible">
    <!-- Контейнер для кнопки помощи и кнопки закрытия -->
    <div class="how-to-use-container">
      <!-- Кнопка в нижнем правом углу -->
      <v-btn
          fab
          dark
          color="primary"
          class="how-to-use-btn"
          @click="openDialog"
          elevation="2"
      >
        <v-icon>mdi-help-circle</v-icon>
      </v-btn>

      <!-- Кнопка закрытия, отображается только если иконка видима -->
      <v-btn
          icon
          size="24px"
          class="close-btn"
          @click="closeHowToUse"
      >
        <v-icon size="24px">mdi-close</v-icon>
      </v-btn>
    </div>

    <!-- Всплывающее окно (Диалог) -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Как пользоваться</span>
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio.
            Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh
            elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed
            augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla.
            Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.
          </p>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'

export default defineComponent({
  name: 'HowToUse',
  setup() {
    // Состояние диалога
    const dialog = ref(false)
    // Состояние видимости иконки
    const visible = ref(true)

    // Проверка localStorage при монтировании
    onMounted(() => {
      const isClosed = localStorage.getItem('howToUseClosed')
      if (isClosed === 'true') {
        visible.value = false
        console.log('Иконка "Как пользоваться" закрыта пользователем ранее.')
      } else {
        visible.value = true
        console.log('Иконка "Как пользоваться" отображается.')
      }
    })

    // Функция для открытия диалога
    const openDialog = () => {
      dialog.value = true
      console.log('Открыт диалог "Как пользоваться".')
    }

    // Функция для закрытия иконки и сохранения состояния в localStorage
    const closeHowToUse = () => {
      visible.value = false
      localStorage.setItem('howToUseClosed', 'true')
      console.log('Пользователь закрыл иконку "Как пользоваться".')
    }

    return {
      dialog,
      visible,
      openDialog,
      closeHowToUse
    }
  }
})
</script>

<style scoped>
/* Контейнер для кнопки помощи и кнопки закрытия */
.how-to-use-container {
  position: fixed;
  bottom: 70px;
  right: 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
}

/* Кнопка помощи */
.how-to-use-btn {
  background-color: rgba(67, 160, 71, 0.7) !important; /* Полупрозрачный цвет */
  border-radius: 16px;
}

/* Кнопка закрытия */
.close-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: white;
  color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  padding: 4px;
}
</style>
