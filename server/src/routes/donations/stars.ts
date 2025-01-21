// routes/donations/stars.ts
import express, { Request, Response } from 'express';
// import axios from 'axios';
import StarDonation from '../../models/StarDonation';

const axios = require('axios');

const router = express.Router();

const BOT_TOKEN = process.env.BOT_TOKEN;

/**
 * POST /api/donations/stars
 * Body: { userId: number, stars: number }
 */
router.post('/stars', async (req: Request, res: Response) => {
    const { userId, stars } = req.body;

    if (!userId || !stars) {
        return res.status(400).json({ message: 'Необходимые данные отсутствуют.' });
    }

    try {
        // Пример: перед генерацией ссылки можно сохранять «черновик»,
        // либо дождаться подтверждения платежа по webhook'у и сохранять уже там.
        // Здесь для примера просто сохраняем сразу.
        const starDonation = new StarDonation({ userId, stars });
        await starDonation.save();

        // Формируем запрос к Bot API
        const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`;

        // Параметры запроса:
        // - business_connection_id: опционально (для Stars можно указать, если есть);
        // - provider_token: для Telegram Stars можно отправить пустую строку;
        // - currency: XTR;
        // - prices: укажите итоговую сумму в "мелких" единицах (для XTR обычно * 100).
        const payload = {
            // business_connection_id: 'ВАШ_ID_БИЗНЕС_ПОДКЛЮЧЕНИЯ', // если нужно
            title: 'Поддержка проекта',
            description: 'Донат для поддержки нашего проекта',
            payload: JSON.stringify({ userId, stars }), // произвольные данные
            provider_token: '', // для Telegram Stars — пустой
            currency: 'XTR',
            prices: JSON.stringify([
                {
                    label: 'Донат',
                    amount: stars,
                },
            ]),
        };

        // Делаем POST-запрос напрямую к Bot API
        const response = await axios.post(apiUrl, payload);
        const data = response.data;

        if (!data.ok) {
            console.error('Ошибка от Telegram Bot API:', data);
            return res
                .status(500)
                .json({ message: 'Ошибка Telegram при создании ссылки на инвойс.' });
        }

        // В data.result вернётся сама ссылка на инвойс
        const invoiceLink = data.result;

        // При желании можно отправить сообщение пользователю (но обычно отправляют после оплаты)
        // await bot.sendMessage(userId, `Спасибо! Чтобы оплатить, перейдите по ссылке: ${invoiceLink}`);

        return res.status(200).json({
            message: 'Ссылка на инвойс успешно создана.',
            invoiceLink,
        });
    } catch (error) {
        console.error('Ошибка при создании invoiceLink:', error);
        return res.status(500).json({ message: 'Внутренняя ошибка сервера.' });
    }
});

export default router;
