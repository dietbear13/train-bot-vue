// ~/stores/userStore.ts

import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => ({
        telegramId: null as number | null,
        role: 'freeUser' as 'admin' | 'freeUser' | 'paidUser',
    }),
    actions: {
        setTelegramId(id: number) {
            this.telegramId = id
            console.log(`Telegram ID в Pinia Store: ${id}`)

        },
        setRole(role: 'admin' | 'freeUser' | 'paidUser') {
            this.role = role
            console.log(`Роль в Pinia Store: ${role}`)

        },
    },
})
