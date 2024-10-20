// server/readExcel.ts
import * as XLSX from 'xlsx';
import mongoose from 'mongoose';
import Exercise from './models/Exercise'; // путь до модели

const filePath = './упражнения.xlsx';

// Чтение Excel файла
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

// Преобразование данных
const exercises = sheet.slice(1).map((row: any) => ({
    category: row['категории мышц'],
    subcategory: row['подкатегория мышцы'],
    mainMuscles: row['основные мышцы'],
    additionalMuscles: row['дополнительные мышцы'],
    difficultyLevel: row['Уровень упражнения'],
    name: row['Список упражнений'],
    equipment: row['снаряд'],
    maleRepsLight: row['Число повторений легкая треня, мужчины'],
    maleRepsMedium: row['Число повторений, средняя треня, мужчины'],
    maleRepsHeavy: row['Число повторений тяжёлая треня, мужчины'],
    femaleRepsLight: row['Число повторений легкая треня, женщины'],
    femaleRepsMedium: row['Число повторений средняя треня, женщины'],
    femaleRepsHeavy: row['Число повторений тяжёлая треня, женщины'],
}));

// Подключение к MongoDB и загрузка данных
mongoose.connect('mongodb://localhost:27017/fitness-app', {} as mongoose.ConnectOptions)
    .then(async () => {
        console.log('Подключено к MongoDB');
        try {
            await Exercise.deleteMany({}); // Очистка старых данных
            await Exercise.insertMany(exercises); // Загрузка данных из Excel
            console.log('Данные загружены в базу');
            mongoose.disconnect();
        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
            mongoose.disconnect();
        }
    })
    .catch((error) => {
        console.error('Ошибка при подключении к MongoDB:', error);
    });
