// plugins/apexcharts.client.ts
import { defineNuxtPlugin } from '#app'
import VueApexCharts from 'vue3-apexcharts'

export default defineNuxtPlugin((nuxtApp) => {
    // Регистрируем плагин ApexCharts во Vue-приложении
    nuxtApp.vueApp.use(VueApexCharts)
    // Дополнительно можно зарегистрировать компонент с именем <apexchart>,
    // если вы планируете использовать именно такой тег:
    nuxtApp.vueApp.component('apexchart', VueApexCharts)
})
