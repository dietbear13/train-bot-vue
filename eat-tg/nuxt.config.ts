// nuxt.config.ts
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// Типовая настройка Nuxt 3
export default defineNuxtConfig({
  build: {
    transpile: ['vuetify', 'vue3-quill'],
  },

  app: {
    head: {
      meta: [
        { name: 'robots', content: 'noindex, nofollow' }
      ],
      script: [
        { src: 'https://telegram.org/js/telegram-web-app.js' }
      ],
    },
  },

  css: [
    'vuetify/styles',
    'assets/global.css',
    '@mdi/font/css/materialdesignicons.min.css',
  ],

  ssr: false,

  runtimeConfig: {
    telegramBotApiKey: process.env.TELEGRAM_BOT_API_KEY || '',
    public: {
      apiBaseUrl:
          process.env.NODE_ENV === 'production'
              ? process.env.VITE_API_BASE_URL_PROD
              : process.env.VITE_API_BASE_URL_DEV,
      fallbackBaseURL:
          process.env.NODE_ENV === 'production'
              ? process.env.VITE_API_BASE_URL_FALLBACK_PROD
              : process.env.VITE_API_BASE_URL_FALLBACK_DEV,
      telegramBotApiKey: process.env.TELEGRAM_BOT_API_KEY || '', // Делаем доступным публично
    },
  },

  modules: [
      '@nuxt/fonts',
    '@pinia/nuxt',
    '@nuxtjs/device',
    [
      'nuxt-yandex-metrika',
      {
        id: 99643818,
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true      }
    ],
  ],

  fonts: {
    provider: 'google'
  },

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    plugins: [
      vuetify({ autoImport: true }),
    ],
  },

  compatibilityDate: '2025-01-21',
})