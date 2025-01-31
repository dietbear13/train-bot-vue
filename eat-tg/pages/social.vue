<!-- pages/social.vue -->

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center" class="pa-4">
      <v-col cols="12" sm="10" md="8">
        <!-- Заголовок страницы -->
        <v-card class="pa-4" outlined>
          <v-card-title class="text-h5 text-center">Наши Социальные Сети</v-card-title>
          <v-divider class="my-4"></v-divider>

          <!-- Сетка социальных сетей -->
          <v-row>
            <!-- Telegram Канал -->
            <v-col cols="6" sm="6" md="6" lg="3" class="my-2">
              <v-card class="social-card" outlined>
                <v-card-actions>
                  <v-icon color="primary" size="36">mdi-telegram</v-icon>
                  <v-spacer></v-spacer>
                </v-card-actions>
                <v-card-text class="text-center">
                  <a href="https://t.me/training_health" target="_blank" class="social-link">
                    <div class="font-weight-bold">Telegram Канал</div>
                  </a>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Telegram Чат -->
            <v-col cols="6" sm="6" md="6" lg="3" class="my-2">
              <v-card class="social-card" outlined>
                <v-card-actions>
                  <v-icon color="primary" size="36">mdi-telegram</v-icon>
                  <v-spacer></v-spacer>
                </v-card-actions>
                <v-card-text class="text-center">
                  <a href="https://t.me/dietbear_chat" target="_blank" class="social-link">
                    <div class="font-weight-bold">Telegram Чат</div>
                  </a>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Яндекс.Дзен -->
            <v-col cols="6" sm="6" md="6" lg="3" class="my-2">
              <v-card class="social-card" outlined>
                <v-card-actions>
                  <v-icon color="orange" size="36">mdi-format-list-text</v-icon>
                  <v-spacer></v-spacer>
                </v-card-actions>
                <v-card-text class="text-center">
                  <a href="https://dzen.ru/kochalka" target="_blank" class="social-link">
                    <div class="font-weight-bold">Яндекс.Дзен</div>
                  </a>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- ВКонтакте -->
            <v-col cols="6" sm="6" md="6" lg="3" class="my-2">
              <v-card class="social-card" outlined>
                <v-card-actions>
                  <v-icon color="blue" size="36">mdi-vk</v-icon>
                  <v-spacer></v-spacer>
                </v-card-actions>
                <v-card-text class="text-center">
                  <a href="https://vk.com/ko4alka" target="_blank" class="social-link">
                    <div class="font-weight-bold">ВКонтакте</div>
                  </a>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
// В данном случае страница статична, поэтому скрипт не требуется.
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}

.pa-4 {
  padding: 16px;
}

.my-2 {
  margin-top: 8px;
  margin-bottom: 8px;
}

.social-card {
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: box-shadow 0.3s ease;
}

.social-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.social-link {
  text-decoration: none;
  color: inherit;
}

.social-link:hover {
  text-decoration: underline;
}

.font-weight-bold {
  font-weight: bold;
}
</style>
