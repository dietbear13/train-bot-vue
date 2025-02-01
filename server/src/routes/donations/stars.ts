import express, { Request, Response } from 'express'
import axios from 'axios'
import User from '../../models/User'

// Интерфейс для ответа от Telegram Bot API
interface TelegramInvoiceResponse {
    ok: boolean
    result: string
    error_code?: number
    description?: string
}

const router = express.Router()
const BOT_TOKEN = process.env.TELEGRAM_BOT_API_KEY // Убедитесь, что переменная окружения TELEGRAM_BOT_API_KEY установлена

router.post('/donations/stars', async (req: Request, res: Response) => {
    const { telegramId, stars }: { telegramId: number; stars: number } = req.body

    if (!telegramId || !stars) {
        return res.status(400).json({ message: 'Необходимые данные отсутствуют.' })
    }

    try {
        // Формируем URL для запроса к Telegram Bot API
        const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`
        console.log('stars apiUrl', apiUrl)

        // Параметры запроса к Telegram
        const payload = {
            title: 'Поддержка проекта',
            description: 'Донат для поддержки нашего проекта',
            payload: JSON.stringify({ telegramId, stars }),
            provider_token: '',
            currency: 'XTR',
            prices: [
                {
                    label: 'Донат',
                    amount: stars,
                },
            ],
        }

        // Отправляем запрос к Telegram Bot API
        const response = await axios.post<TelegramInvoiceResponse>(apiUrl, payload)
        const data = response.data
        console.log('stars response', response)
        console.log('stars data', data)

        // Проверяем, успешно ли Telegram создал инвойс
        if (!data.ok) {
            console.error('Ошибка от Telegram Bot API:', data)
            return res.status(500).json({
                message: 'Ошибка Telegram при создании ссылки на инвойс.',
            })
        }

        const invoiceLink = data.result

        // Находим пользователя по его telegramId
        const user = await User.findOne({ telegramId: telegramId })
        console.log('/donations/stars найден user', user)
        if (user) {
            // Если пользователь найден, записываем информацию о нажатии в starDonationHistory
            user.starDonationHistory = user.starDonationHistory || []
            user.starDonationHistory.push({
                telegramId: telegramId,
                stars: stars,
                timestamp: Date.now(),
            })

            // Сохраняем изменения в документе пользователя
            await user.save()
        } else {
            console.warn('Пользователь с таким telegramId не найден, запись не выполнена.')
        }

        return res.status(200).json({
            message: 'Ссылка на инвойс успешно создана.',
            invoiceLink,
        })
    } catch (error: any) {
        console.error('Ошибка при создании invoiceLink:', error)
        return res.status(500).json({ message: 'Внутренняя ошибка сервера.' })
    }
})

export default router
