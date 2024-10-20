import mongoose from 'mongoose';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/fitness-app', {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

// Определение схемы для упражнений
const exerciseSchema = new mongoose.Schema({
    category: String,
    subcategory: String,
    mainMuscles: String,
    additionalMuscles: String,
    difficultyLevel: String,
    name: String,
    equipment: String,
    maleRepsLight: String,
    maleRepsMedium: String,
    maleRepsHeavy: String,
    femaleRepsLight: String,
    femaleRepsMedium: String,
    femaleRepsHeavy: String
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

// Чтение данных из Excel файла
const filePath = path.join(__dirname, 'упражнения.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Преобразование данных Excel в JSON
const jsonData: any[] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

// Заголовки для колонок (взяты из первой строки Excel)
const headers = jsonData[0];

// Данные для заполнения (вторая строка)
const dataRows = jsonData.slice(1);

// Функция для заполнения базы данных
const populateDB = async () => {
    try {
        // Обработка каждой строки данных
        for (const row of dataRows) {
            const exerciseData = {
                category: row[0],
                subcategory: row[1],
                mainMuscles: row[2],
                additionalMuscles: row[3],
                difficultyLevel: row[4],
                name: row[5],
                equipment: row[6],
                maleRepsLight: row[7],
                maleRepsMedium: row[8],
                maleRepsHeavy: row[9],
                femaleRepsLight: row[10],
                femaleRepsMedium: row[11],
                femaleRepsHeavy: row[12],
            };

            // Создаем новую запись в базе данных
            const exercise = new Exercise(exerciseData);
            await exercise.save();
            console.log(`Inserted: ${exercise.name}`);
        }

        console.log('База данных успешно заполнена');
        mongoose.disconnect();
    } catch (error) {
        console.error('Ошибка при заполнении базы данных:', error);
        mongoose.disconnect();
    }
};

// Запуск функции для заполнения базы данных
populateDB();
