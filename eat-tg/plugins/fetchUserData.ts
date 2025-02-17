import { defineNuxtRouteMiddleware } from '#app'
import { useUserStore } from '../stores/userStore'
import { useApi } from '../composables/useApi'

export default defineNuxtRouteMiddleware(async (to, from) => {
    const userStore = useUserStore()
    const { apiRequest } = useApi()

    if (!userStore.splits.length) {
        userStore.setSplits(await apiRequest('GET', 'splits'))
    }

    else if (!userStore.exercises.length) {
        userStore.setExercises(await apiRequest('GET', 'exercises'))
    }

    else if (!userStore.blogArticles.length) {
        userStore.setBlogArticles(await apiRequest('GET', 'blog-articles'))
    }

    else if (!userStore.users.length) {
        const usersData = await apiRequest('GET', 'users')
        userStore.setUsers(usersData)
    }
})
