import express, { Request, Response } from 'express'
import axios from 'axios'
import StarDonation from '../../models/StarDonation'

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
    const { userId, stars } = req.body

    if (!userId || !stars) {
        return res.status(400).json({ message: 'Необходимые данные отсутствуют.' })
    }

    try {
        // Сохраняем информацию о донате (опционально)
        const starDonation = new StarDonation({ userId, stars })
        await starDonation.save()

        // Формируем URL для запроса к Telegram Bot API
        const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`
        console.log('stars apiUrl', apiUrl)

        // Параметры запроса
        const payload = {
            title: 'Поддержка проекта',
            description: 'Донат для поддержки нашего проекта',
            payload: JSON.stringify({ userId, stars }),
            provider_token: '',
            currency: 'XTR',
            prices: [
                {
                    label: 'Донат',
                    amount: stars,
                },
            ],
        }

        // Вместо явного типа AxiosResponse<T> – указываем generic для post
        const response = await axios.post<TelegramInvoiceResponse>(apiUrl, payload)
        const data = response.data
        console.log('stars response', response)
        console.log('stars data', data)

        if (!data.ok) {
            console.error('Ошибка от Telegram Bot API:', data)
            return res.status(500).json({
                message: 'Ошибка Telegram при создании ссылки на инвойс.'
            })
        }

        const invoiceLink = data.result

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
