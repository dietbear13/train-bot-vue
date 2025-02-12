import { bot } from './config/bot';
import { handleCallbackQuery } from './handlers/callbackHandler';

// Обработка callback-запросов
bot.on('callback_query', handleCallbackQuery);

// Ловим ошибки polling
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

export default bot;
