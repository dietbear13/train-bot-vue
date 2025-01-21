<template>
  <v-card>
    <v-card-title>Реферальная система</v-card-title>

    <!-- Если пользователь пришёл по чужой ссылке, мы просто показываем,
         что данные о реферале отправлены, или можно отобразить другое сообщение -->
    <v-card-text v-if="invitedById !== null">
      <p>
        Спасибо, что пришли по реферальной ссылке (ID пригласившего: {{ invitedById }})!
      </p>
      <p>
        Ваш Telegram ID (приглашённого): {{ invitedUserId }} <br />
        Данные успешно отправлены на сервер.
      </p>
    </v-card-text>

    <!-- Иначе показываем поле для копирования / расшаривания ссылки -->
    <v-card-text v-else>
      <v-text-field
          v-model="referralLink"
          label="Ваша реферальная ссылка"
          readonly
          append-icon="mdi-content-copy"
          @click:append="copyReferralLink"
      />
    </v-card-text>

    <v-card-actions v-if="referralLink">
      <v-btn color="primary" @click="shareOnTelegram">
        Поделиться в Telegram
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
/**
 * ReferralLink.vue
 *
 * - Если у текущего пользователя в initDataUnsafe есть start_param,
 *   значит он "приглашённый" (invited user).
 * - Иначе он "пригласивший" (referrer), и мы генерируем ему ссылку.
 */

import { ref, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';

// Поля для контроля состояния
const invitedById = ref<number | null>(null);    // ID пригласившего (если пользователь пришёл по ссылке)
const invitedUserId = ref<number | null>(null); // ID приглашённого (текущего пользователя)
const referralLink = ref<string>('');           // Реферальная ссылка (для пригласившего)

// Инициализация в onMounted (когда компонент загружен)
onMounted(() => {
  if (typeof window === 'undefined') return; // safety check на SSR

  const telegram = window.Telegram;
  if (!telegram || !telegram.WebApp) {
    console.warn('Запущено вне Telegram WebApp или недоступно window.Telegram.');
    return;
  }

  // initDataUnsafe = распакованная информация о юзере, start_param и пр.
  const initDataUnsafe = telegram.WebApp.initDataUnsafe;
  console.log('initDataUnsafe:', initDataUnsafe);

  if (!initDataUnsafe) {
    console.error('Не удалось получить initDataUnsafe.');
    return;
  }

  // 1) Проверяем, есть ли start_param (ID пригласившего)
  if (initDataUnsafe.start_param) {
    // Это значит, что текущий пользователь пришёл по чужой ссылке
    const referrerId = parseInt(initDataUnsafe.start_param, 10);
    invitedById.value = !isNaN(referrerId) ? referrerId : null;
  }

  // 2) ID текущего пользователя
  if (initDataUnsafe.user && initDataUnsafe.user.id) {
    invitedUserId.value = initDataUnsafe.user.id;
  }

  // 3) Если invitedById.value есть, значит пользователь пришёл по ссылке
  //    => отправляем данные на сервер (кто пригласил, кого, время)
  //    Иначе (нет start_param), генерируем реферальную ссылку для самого пользователя.
  if (invitedById.value && invitedUserId.value) {
    // отправляем данные на сервер
    sendReferralData(invitedById.value, invitedUserId.value);
  } else if (invitedUserId.value) {
    // пользователь зашёл сам, значит он может генерировать свою ссылку
    referralLink.value = `https://t.me/kochalkatg_bot?start=${invitedUserId.value}`;
  }
});

/**
 * Копирование ссылки в буфер
 */
const copyReferralLink = () => {
  if (!referralLink.value) return;
  navigator.clipboard
      .writeText(referralLink.value)
      .then(() => {
        alert('Реферальная ссылка скопирована в буфер обмена.');
      });
};

/**
 * Открыть ссылку в Telegram (если нужно поделиться в самом WebApp)
 */
const shareOnTelegram = () => {
  if (referralLink.value) {
    window.Telegram.WebApp.openTelegramLink(referralLink.value);
  }
};

/**
 * Отправка реферальных данных на сервер
 */
const sendReferralData = (referrerId: number, newUserId: number) => {
  const { apiRequest } = useApi();
  const timestamp = new Date().toISOString();

  apiRequest('POST', '/referrals', {
    invitedBy: referrerId,
    invitedUser: newUserId,
    timestamp
  })
      .then((response) => {
        console.log('Реферальные данные успешно отправлены:', response);
      })
      .catch((err) => {
        console.error('Ошибка при отправке реферальных данных:', err);
      });
};
</script>
