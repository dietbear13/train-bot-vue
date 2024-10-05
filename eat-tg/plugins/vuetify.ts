// plugins/vuetify.js
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
// import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import 'vuetify/styles'
import { aliases, mdi } from 'vuetify/iconsets/mdi' // Используем 'mdi' для @mdi/font

import '@mdi/font/css/materialdesignicons.css'


export default defineNuxtPlugin(app => {
    const vuetify = createVuetify({
        components,
        directives,
        icons: {
            defaultSet: 'mdi',
            aliases,
            sets: {
                mdi,
            },
        },
        theme: {
            defaultTheme: 'dark', // Можно настроить тему по желанию
        },
    })

    app.vueApp.use(vuetify)
})
