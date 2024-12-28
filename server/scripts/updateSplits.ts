import mongoose from 'mongoose';
import xlsx from 'xlsx';
import path from 'path';

// Импортируем модель
import SplitModel, { ISplit } from '../src/models/Split';

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
        const rawData = xlsx.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
        // Первая строка — заголовки
        const headers = rawData[0];
        // Все строки кроме первой
        const dataRows = rawData.slice(1);

        // Промежуточная группировка
        const grouped: Record<string, {
            split: string;
            splitId: number;
            gender: string;
            splitDays: string;
            days: Record<number, string[]>;
        }> = {};

        for (const row of dataRows) {
            const split = row[0] || '';
            const splitId = Number(row[1] || 0);
            const gender = row[2] || '';
            const splitDays = row[3] || '';
            const numberDay = Number(row[4] || 0);
            const patternOrExercise = row[5] || '';

            const key = `${split}|${splitId}|${gender}|${splitDays}`;
            if (!grouped[key]) {
                grouped[key] = {
                    split,
                    splitId,
                    gender,
                    splitDays,
                    days: {},
                };
            }
            if (!grouped[key].days[numberDay]) {
                grouped[key].days[numberDay] = [];
            }
            grouped[key].days[numberDay].push(patternOrExercise);
        }

        // Формируем массив для сохранения
        const splitsToInsert: ISplit[] = [];

        for (const key of Object.keys(grouped)) {
            const item = grouped[key];
            const daysArray = Object.entries(item.days).map(([dayNum, patterns]) => ({
                numberDay: Number(dayNum),
                patternOrExercise: patterns,
            }));

            splitsToInsert.push({
                split: item.split,
                splitId: item.splitId,
                gender: item.gender,
                splitDays: item.splitDays,
                days: daysArray,
            });
        }

        // Сохраняем в MongoDB
        await SplitModel.insertMany(splitsToInsert);
        console.log('Splits inserted successfully');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error in updateSplits:', error);
        await mongoose.disconnect();
    }
};

updateSplits();
