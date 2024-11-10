// utils/parseNumber.ts

export const parseNumber = (value: string | number): number => {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        // Заменяем запятые на точки и удаляем пробелы
        const normalized = value.replace(',', '.').trim();
        const parsed = parseFloat(normalized);
        return isNaN(parsed) ? 0 : parsed; // Возвращаем 0, если не удалось распарсить
    }
    return 0;
};
