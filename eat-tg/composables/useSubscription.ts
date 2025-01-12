// ~/composables/useSubscription.ts

import { ref } from 'vue';
import { useUserStore } from '~/stores/userStore';
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
        try {
            // Если пользователь админ, не меняем статус
            if (userStore.role === 'admin') {
                showSnackbar('Вы являетесь администратором. Статус не может быть изменен.', 'warning');
                return;
            }

            // Запрос к вашему бэкенду, который возвращает isSubscribed = true/false
            const response = await apiRequest('post', 'check-subscription', {
                telegramId: userStore.telegramId,
            });

            if (response.data.isSubscribed) {
                // Если пользователь подписан
                if (userStore.role !== 'paidUser') {
                    await updateUserRoleInDB('paidUser');
                    showSnackbar('Подтверждаю подписку! У тебя полный доступ к боту.', 'success');
                } else {
                    // Если пользователь уже paidUser, просто покажем уведомление
                    showSnackbar('Ваша подписка подтверждена.', 'success');
                }
            } else {
                // Если пользователь не подписан
                if (userStore.role === 'paidUser') {
                    // Был подписан, но теперь отписался
                    await updateUserRoleInDB('freeUser');
                    showSnackbar('Вы отписались от канала. Статус изменён на "Без подписки".', 'error');
                } else {
                    showSnackbar('Ты не подписался на канал или уже отписался.', 'error');
                }
            }
        } catch (error: any) {
            console.error('Ошибка при проверке подписки:', error);
            showSnackbar(
                'Произошла ошибка при проверке подписки, сообщите об этом разработчику.',
                'error'
            );
        }
    };

    return {
        snackbar,
        showSnackbar,
        checkSubscription,
    };
}
