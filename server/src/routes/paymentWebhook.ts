// routes/paymentWebhook.ts
import express from 'express';
import Donation from '../models/StarDonation';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN не задан в файле .env');
}
const bot = new TelegramBot(botToken, { polling: false });

router.post('/paymentWebhook', async (req, res) => {
    const { donationId, status } = req.body;

    if (!donationId || !status) {
        return res.status(400).json({ message: 'Необходимые данные отсутствуют.' });
    }

    try {
        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ message: 'Донат не найден.' });
        }

        donation.status = status;
        await donation.save();

        if (status === 'success') {
            // Отправка сообщения в Telegram
            bot.sendMessage(donation.userId, `Спасибо за ваш донат в размере ${donation.amount}₽! Мы ценим вашу поддержку.`);
        } else {
            bot.sendMessage(donation.userId, `Ваш донат в размере ${donation.amount}₽ не был завершён. Пожалуйста, попробуйте ещё раз.`);
        }

        res.status(200).json({ message: 'Статус обновлён.' });
    } catch (error) {
        console.error('Ошибка при обработке webhook:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера.' });
    }
});

export default router;
