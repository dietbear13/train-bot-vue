// ~/composables/useSubscription.ts

import { ref } from 'vue';
import { useUserStore } from '../stores/userStore';
import { useApi } from '~/composables/useApi';

/**
 * Composable для проверки подписки.
 * Содержит логику, общую и для UserInit, и для Profile.
 */
export function useSubscription() {
    const userStore = useUserStore();
    const { apiRequest } = useApi();

    // Настройки для вывода сообщений через Snackbar
    const snackbar = ref({
        show: false,
        message: '',
        color: 'info', // 'success', 'error', 'info', 'warning'
        timeout: 1500,
    });

    // Удобный метод для отображения сообщений
    const showSnackbar = (message: string, color: string = 'info') => {
        snackbar.value.message = message;
        snackbar.value.color = color;
        snackbar.value.show = true;
    };

    /**
     * Обновление роли пользователя в базе данных и в Pinia-хранилище
     * @param newRole 'freeUser' | 'paidUser'
     */
    const updateUserRoleInDB = async (newRole: 'freeUser' | 'paidUser') => {
        try {
            if (userStore.role === 'admin') {
                showSnackbar('Вы являетесь администратором. Статус не может быть изменен.', 'warning');
                return;
            }

            const response = await apiRequest('post', 'update-userAndAdmin-role', {
                telegramId: userStore.telegramId,
                role: newRole,
            });

            if (response.success) {
                userStore.setRole(newRole);
                showSnackbar(
                    `Ваш статус обновлен на "${newRole === 'paidUser' ? 'Платный пользователь' : 'Без подписки'}"`,
                    'success'
                );
            } else {
                showSnackbar('Не удалось обновить статус пользователя на сервере.', 'error');
            }
        } catch (error: any) {
            console.error('Ошибка при обновлении роли пользователя:', error);
            showSnackbar('Произошла ошибка при обновлении статуса, обратитесь к разработчику.', 'error');
        }
    };

    /**
     * Основная функция проверки подписки
     * Вызывается как вручную (со страницы профиля), так и автоматически (из UserInit).
     * Внутри:
     *  - Если роль = admin, выходим, статус не меняем.
     *  - Делаем запрос на бэкенд 'check-subscription', проверяем реальную подписку.
     *  - При необходимости (если unsub) делаем updateUserRoleInDB('freeUser'),
     *    если sub — updateUserRoleInDB('paidUser'), либо ничего не меняем, если уже такой статус.
     */
    const checkSubscription = async () => {
        if (isCheckingSubscription.value || userStore.role !== 'freeUser') return; // Избегаем повторных запросов

        isCheckingSubscription.value = true;

        try {
            if (userStore.telegramId === 327844310) {
                showSnackbar('Вы администратор. Статус не изменяется.', 'warning');
                return;
            }

            const response = await apiRequest('post', 'check-subscription', {
                telegramId: userStore.telegramId,
            });

            if (response.data.isSubscribed) {
                if (userStore.role !== 'paidUser') {
                    await updateUserRoleInDB('paidUser');
                    showSnackbar('Подтверждаю подписку! У тебя полный доступ.', 'success');
                }
            } else {
                if (userStore.role === 'paidUser') {
                    await updateUserRoleInDB('freeUser');
                    showSnackbar('Вы отписались. Статус изменён на "Без подписки".', 'error');
                }
            }
        } catch (error) {
            console.error('Ошибка при проверке подписки:', error);
            showSnackbar('Ошибка при проверке подписки. Сообщите разработчику.', 'error');
        } finally {
            isCheckingSubscription.value = false;
        }
    };

    return {
        snackbar,
        showSnackbar,
        checkSubscription,
    };
}
