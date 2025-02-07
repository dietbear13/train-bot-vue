// ~/utils/dateUtils.ts

/**
 * Парсим дату в формате "дд.мм.гггг" и возвращаем объект Date
 * или null, если формат неверный.
 */
export function parseDateDMY(dateStr: string): Date | null {
    if (!dateStr) return null
    const match = dateStr.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
    if (!match) return null

    const [_, d, m, y] = match
    const day = parseInt(d, 10)
    const month = parseInt(m, 10)
    const year = parseInt(y, 10)

    // Простейшие проверки
    if (year < 1900 || year > 2100) return null
    if (month < 1 || month > 12) return null
    if (day < 1 || day > 31) return null

    const dateObj = new Date(year, month - 1, day, 0, 0, 0)
    // Доп. проверка правильности
    if (
        dateObj.getFullYear() !== year ||
        dateObj.getMonth() !== month - 1 ||
        dateObj.getDate() !== day
    ) {
        return null
    }
    return dateObj
}

/**
 * Форматирует объект Date в строку вида "YYYY-MM-DD",
 * чтобы использовать как ключ в словаре или как "категорию" на графике.
 */
export function formatDayKey(d: Date): string {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
