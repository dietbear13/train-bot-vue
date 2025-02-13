// nuxt.config.ts
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

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
    '@/assets/global.css',
    '@mdi/font/css/materialdesignicons.min.css'
  ],

  plugins: [
    '~/plugins/pinia',
    '~/plugins/vuetify',
  ],

  ssr: false,
  runtimeConfig: {
    telegramBotApiKey: process.env.TELEGRAM_BOT_API_KEY || '',
    public: {
      apiBaseUrl: process.env.VITE_API_BASE_URL_PROD || '',
      fallbackBaseURL: process.env.VITE_API_BASE_URL_FALLBACK_PROD || '',
      telegramBotApiKey: process.env.TELEGRAM_BOT_API_KEY || '',
      tinyMceKey: process.env.TinyMCE_KEY || '',
      kassaKey: process.env.KASSA_KEY || '',
      adminTelegramId: process.env.ADMIN_TELEGRAM_ID || '',
    },
  },

  modules: [
    // 'pinia-plugin-persistedstate/nuxt',
    '@nuxt/fonts',
    // '@pinia/nuxt',
    '@nuxtjs/device',
    [
      'nuxt-yandex-metrika',
      {
        id: 99643818,
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true,
      },
    ],
  ],

  fonts: {
    provider: 'google'
  },

  vite: {
    vue: {
      template: { transformAssetUrls },
    },
    plugins: [
      vuetify({
        autoImport: true,
        styles: {
          configFile: 'assets/variable.scss'
        }
      }),

    ],
  },

  compatibilityDate: '2025-02-08',
})