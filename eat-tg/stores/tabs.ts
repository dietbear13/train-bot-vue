import { defineStore } from 'pinia'
import { ref } from 'vue'
defineStore('tabs', () => {
    const activeTab = ref<'main' | 'workout-muscles' | 'exercise-search'>('main')

    function setTab(tab: 'main' | 'workout-muscles' | 'exercise-search') {
        activeTab.value = tab
    }

    return { activeTab, setTab }
});
