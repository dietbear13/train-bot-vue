import { defineStore } from 'pinia'
import { ref } from 'vue'
defineStore('tabs', () => {
    const activeTab = ref<'main' | 'workoutMuscles' | 'exerciseSearch'>('main')

    function setTab(tab: 'main' | 'workoutMuscles' | 'exerciseSearch') {
        activeTab.value = tab
    }

    return { activeTab, setTab }
});
