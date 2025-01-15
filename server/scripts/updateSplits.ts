import mongoose from 'mongoose';
import xlsx from 'xlsx';
import path from 'path';

// Импортируем модель
import SplitModel, { ISplitDocument } from '../src/models/Split';

const filePath = path.join(__dirname, 'сплиты.xlsx');

const updateSplits = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/fitness-app');
        console.log('Connected to MongoDB');

        // Очищаем коллекцию
        await SplitModel.deleteMany({});
        console.log('Splits collection cleared');

        // Считываем Excel
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Преобразуем в массив массивов
        const rawData: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rawData.length < 2) {
            throw new Error('В Excel-файле недостаточно данных.');
        }

        // Первая строка — заголовки
        const headers = rawData[0];
        const dataRows = rawData.slice(1);

        // Определяем индексы столбцов для гибкости
        const indexMap: Record<string, number> = {};
        headers.forEach((header, index) => {
            indexMap[header.trim()] = index;
        });

        // Проверяем наличие необходимых столбцов
        const requiredHeaders = [
            'split',
            'splitComment',
            'splitId',
            'gender',
            'splitDays',
            'numberDay',
            'patternOrExercise',
            'difficultyLevelSplit',
        ];

        for (const header of requiredHeaders) {
            if (!(header in indexMap)) {
                throw new Error(`Отсутствует обязательный столбец: ${header}`);
            }
        }

        // Промежуточная группировка
        const grouped: Record<string, {
            split: string;
            splitComment: string;
            splitId: number;
            gender: string;
            splitDays: string;
            difficultyLevelSplit: number;
            days: Record<number, string[]>;
        }> = {};

        for (const row of dataRows) {
            const split = row[indexMap['split']] as string;
            const splitComment = row[indexMap['splitComment']] as string;
            const splitId = Number(row[indexMap['splitId']]) || 0;
            const gender = row[indexMap['gender']] as string;
            const splitDays = row[indexMap['splitDays']] as string;
            const numberDay = Number(row[indexMap['numberDay']]) || 0;
            const patternOrExercise = row[indexMap['patternOrExercise']] as string;
            const difficultyLevelSplit = Number(row[indexMap['difficultyLevelSplit']]) || 0;

            // Формируем ключ группировки без difficultyLevelSplit, предполагая, что оно одно для каждой группы
            const key = `${split}|${splitComment}|${splitId}|${gender}|${splitDays}`;

            if (!grouped[key]) {
                grouped[key] = {
                    split,
                    splitComment,
                    splitId,
                    gender,
                    splitDays,
                    difficultyLevelSplit, // Добавляем difficultyLevelSplit
                    days: {},
                };
            }

            // Проверяем, совпадает ли difficultyLevelSplit для одной группы
            if (grouped[key].difficultyLevelSplit !== difficultyLevelSplit) {
                console.warn(`Различные значения difficultyLevelSplit для одной группы: ${key}`);
                // Можно решить, как поступить в этом случае. Например, использовать максимальное значение
                grouped[key].difficultyLevelSplit = Math.max(grouped[key].difficultyLevelSplit, difficultyLevelSplit);
            }

            if (!grouped[key].days[numberDay]) {
                grouped[key].days[numberDay] = [];
            }
            grouped[key].days[numberDay].push(patternOrExercise);
        }

        // Формируем массив для сохранения
        const splitsToInsert: Partial<ISplitDocument>[] = [];

        for (const key of Object.keys(grouped)) {
            const item = grouped[key];
            const daysArray = Object.entries(item.days).map(([dayNum, patterns]) => ({
                numberDay: Number(dayNum),
                patternOrExercise: patterns,
            }));

            splitsToInsert.push({
                split: item.split,
                splitComment: item.splitComment,
                splitId: item.splitId,
                gender: item.gender,
                splitDays: item.splitDays,
                difficultyLevelSplit: item.difficultyLevelSplit, // Добавляем новое поле
                days: daysArray,
            });
        }

        if (splitsToInsert.length > 0) {
            // Сохраняем в MongoDB
            await SplitModel.insertMany(splitsToInsert);
            console.log(`Inserted ${splitsToInsert.length} splits successfully`);
        } else {
            console.log('Нет данных для вставки.');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error in updateSplits:', error);
        try {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB due to error');
        } catch (disconnectError) {
            console.error('Error during disconnection:', disconnectError);
        }
    }
};

updateSplits();
