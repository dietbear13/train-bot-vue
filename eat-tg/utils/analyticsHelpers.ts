// ~/utils/analyticsHelpers.ts

import {formatDayKey} from "./dateUtils";

export interface IAggregatedData {
    trainGenerated: number
    trainSent: number
    kbzhuCount: number
    likesCount: number
    starDonations: number
}

export type AggregatedMap = Record<string, IAggregatedData>

/**
 * Пример интерфейса пользователя (упрощённый),
 * если нужно для типизации в этом файле.
 */
export interface IUser {
    _id: string
    trainingHistory?: Array<{
        timestamp: number
        isSended?: boolean
    }>
    kbzhuHistory?: Array<{
        timestamp: number
    }>
    blogLikes?: Array<{
        date: number
    }>
    starDonationHistory?: Array<{
        timestamp: number
        stars: number
    }>
    // ... и другие поля
}

/**
 * Проходимся по всем пользователям и группируем их действия по датам.
 * Ключом служит строка вида "2025-01-01".
 */
export function aggregateUserData(users: IUser[]): AggregatedMap {
    const result: AggregatedMap = {}

    // Хелпер для инкремента счетчика
    function increment(dayKey: string, field: keyof IAggregatedData, amount = 1) {
        if (!result[dayKey]) {
            result[dayKey] = {
                trainGenerated: 0,
                trainSent: 0,
                kbzhuCount: 0,
                likesCount: 0,
                starDonations: 0
            }
        }
        result[dayKey][field] += amount
    }

    for (const user of users) {
        // 1) Тренировки (сгенерированные и отправленные)
        if (user.trainingHistory) {
            for (const train of user.trainingHistory) {
                const d = new Date(train.timestamp) // предположим, ms
                const dayKey = formatDayKey(d)
                increment(dayKey, 'trainGenerated', 1)
                if (train.isSended) {
                    increment(dayKey, 'trainSent', 1)
                }
            }
        }
        // 2) КБЖУ
        if (user.kbzhuHistory) {
            for (const kbzhu of user.kbzhuHistory) {
                const d = new Date(kbzhu.timestamp)
                const dayKey = formatDayKey(d)
                increment(dayKey, 'kbzhuCount', 1)
            }
        }
        // 3) Лайки
        if (user.blogLikes) {
            for (const like of user.blogLikes) {
                const d = new Date(like.date)
                const dayKey = formatDayKey(d)
                increment(dayKey, 'likesCount', 1)
            }
        }
        // 4) Донаты
        if (user.starDonationHistory) {
            for (const donation of user.starDonationHistory) {
                const d = new Date(donation.timestamp)
                const dayKey = formatDayKey(d)
                // Если нужно просто считать, сколько раз донатили:
                increment(dayKey, 'starDonations', 1)
                // Если хотим суммировать звёздочки:
                // increment(dayKey, 'starDonations', donation.stars)
            }
        }
    }
    return result
}

/**
 * Генерация массива дат (Date[]) от startDate до endDate (включая оба).
 * Чтобы не было ошибки "d implicitly has an any type",
 * указываем тип для d: Date.
 */
export function getDatesInRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = []
    let current = new Date(startDate)
    while (current <= endDate) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }
    return dates
}

/**
 * Пример «универсальной» функции, если вы хотите собрать все series
 * сразу по всем метрикам — по схеме multiline или stacked bar.
 * Но в коде компонента обычно удобнее делать что-то более кастомное
 * (как buildSeriesData).
 */
export function buildChartSeries(aggregated: AggregatedMap, dateList: Date[]) {
    // Пример, если хотим 5 метрик (trainGenerated, trainSent, kbzhuCount, likesCount, starDonations)
    const seriesNames = ['trainGenerated', 'trainSent', 'kbzhuCount', 'likesCount', 'starDonations']
    const seriesResult: any[] = []

    // Для каждого "seriesName" соберём массив data
    for (const name of seriesNames) {
        const data: number[] = []
        for (const d of dateList) {
            const key = formatDayKey(d)
            const dayData = aggregated[key] || {
                trainGenerated: 0,
                trainSent: 0,
                kbzhuCount: 0,
                likesCount: 0,
                starDonations: 0
            }
            data.push(dayData[name as keyof IAggregatedData])
        }
        // Превращаем "trainGenerated" в более читабельное название
        const niceLabel = makeNiceLabel(name)
        seriesResult.push({ name: niceLabel, data })
    }
    return seriesResult
}

/** Пример конвертации "trainGenerated" -> "Сген. тренировки" и т.д. */
function makeNiceLabel(key: string): string {
    switch (key) {
        case 'trainGenerated': return 'Сген. тренировки'
        case 'trainSent': return 'Отправл. тренировки'
        case 'kbzhuCount': return 'КБЖУ'
        case 'likesCount': return 'Лайки'
        case 'starDonations': return 'Донаты'
        default: return key
    }
}

/**
 * Аналогично aggregateUserData, но берёт только «последние» события
 * для каждого пользователя по каждому типу.
 */
export function aggregateUserDataLast(users: IUser[]): AggregatedMap {
    const result: AggregatedMap = {}

    // Хелпер
    function increment(dayKey: string, field: keyof IAggregatedData, amount = 1) {
        if (!result[dayKey]) {
            result[dayKey] = {
                trainGenerated: 0,
                trainSent: 0,
                kbzhuCount: 0,
                likesCount: 0,
                starDonations: 0
            }
        }
        result[dayKey][field] += amount
    }

    for (const user of users) {
        // 1) Последняя тренировка
        if (user.trainingHistory && user.trainingHistory.length > 0) {
            // Находим запись с макс timestamp
            const lastTrain = user.trainingHistory.reduce((acc, curr) => {
                return (curr.timestamp > acc.timestamp) ? curr : acc
            })
            const d = new Date(lastTrain.timestamp)
            const dayKey = formatDayKey(d)
            increment(dayKey, 'trainGenerated', 1)
            if (lastTrain.isSended) {
                increment(dayKey, 'trainSent', 1)
            }
        }

        // 2) Последняя КБЖУ
        if (user.kbzhuHistory && user.kbzhuHistory.length > 0) {
            const lastKbzhu = user.kbzhuHistory.reduce((acc, curr) => {
                return (curr.timestamp > acc.timestamp) ? curr : acc
            })
            const d = new Date(lastKbzhu.timestamp)
            const dayKey = formatDayKey(d)
            increment(dayKey, 'kbzhuCount', 1)
        }

        // 3) Последний лайк
        if (user.blogLikes && user.blogLikes.length > 0) {
            const lastLike = user.blogLikes.reduce((acc, curr) => {
                return (curr.date > acc.date) ? curr : acc
            })
            const d = new Date(lastLike.date)
            const dayKey = formatDayKey(d)
            increment(dayKey, 'likesCount', 1)
        }

        // 4) Последний донат
        if (user.starDonationHistory && user.starDonationHistory.length > 0) {
            const lastDonation = user.starDonationHistory.reduce((acc, curr) => {
                return (curr.timestamp > acc.timestamp) ? curr : acc
            })
            const d = new Date(lastDonation.timestamp)
            const dayKey = formatDayKey(d)
            increment(dayKey, 'starDonations', 1)
            // Или, если нужно суммировать звёздочки:
            // increment(dayKey, 'starDonations', lastDonation.stars)
        }
    }

    return result
}

