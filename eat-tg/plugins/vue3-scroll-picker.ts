// plugins/vue3-scroll-picker.ts
import { defineNuxtPlugin } from '#app'
import ScrollPicker from 'vue3-scroll-picker'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.component('ScrollPicker', ScrollPicker)
})
