// ~/scripts/updateExercises.ts

import mongoose, { Schema, Document, model } from 'mongoose';
import xlsx from 'xlsx';
import path from 'path';

interface ExerciseData {
    category: string;
    subcategory: string;
    mainMuscle: string;
    additionalMuscles: string;
    typeExercise: string;
    difficultyLevel: string;
    difficultyLevelOld?: string; // Если необходимо
    name: string;
    equipment: string;
    isWarnGif: boolean;
    technique: string;
    gifImage: string; // Добавлено поле для пути к GIF
    maleRepsLight: string;
    maleRepsMedium: string;
    maleRepsHeavy: string;
    femaleRepsLight: string;
    femaleRepsMedium: string;
    femaleRepsHeavy: string;
    spineRestrictions: boolean;
    kneeRestrictions: boolean;
    shoulderRestrictions: boolean;
}

interface ExerciseDocument extends ExerciseData, Document {}

// Подключение к MongoDB
mongoose.connect('mongodb://mongodb:27017/fitness-app', {})
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

const exerciseSchema = new Schema({
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    mainMuscle: { type: String, required: true },
    additionalMuscles: { type: String },
    typeExercise: { type: String },
    difficultyLevel: { type: String, required: true },
    difficultyLevelOld: { type: String },
    name: { type: String, required: true },
    equipment: { type: String, required: true },
    isWarnGif: { type: Boolean },
    technique: { type: String },
    gifImage: { type: String }, // Добавлено поле в схему
    maleRepsLight: { type: String },
    maleRepsMedium: { type: String },
    maleRepsHeavy: { type: String },
    femaleRepsLight: { type: String },
    femaleRepsMedium: { type: String },
    femaleRepsHeavy: { type: String },
    spineRestrictions: { type: Boolean },
    kneeRestrictions: { type: Boolean },
    shoulderRestrictions: { type: Boolean },
});

const Exercise = model<ExerciseDocument>('Exercise', exerciseSchema);

// Путь к Excel-файлу
const filePath = path.join(__dirname, 'упражнения.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Преобразование данных Excel в JSON
const jsonData = xlsx.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

// Первая строка - заголовки
const headers = jsonData[0];

// Данные со второй строки
const dataRows = jsonData.slice(1);

function toBoolean(value: string | undefined): boolean {
    return value?.toUpperCase() === 'TRUE';
}

const updateExercises = async () => {
    try {
        // Очищаем коллекцию Exercise
        await Exercise.deleteMany({});
        console.log('Коллекция Exercise очищена');

        for (const row of dataRows) {
            const exerciseData: ExerciseData = {
                category: row[0] || '',
                subcategory: row[1] || '',
                mainMuscle: row[2] || '',
                additionalMuscles: row[3] || '',
                typeExercise: row[4] || '',
                difficultyLevel: row[5] || '',
                difficultyLevelOld: row[6] || '', // Если нужно
                name: row[7] || '',
                equipment: row[8] || '',
                isWarnGif: toBoolean(row[9]),
                technique: row[10] || '',
                gifImage: row[11] || '', // Добавлено поле для пути к GIF
                maleRepsLight: row[12] || '',
                maleRepsMedium: row[13] || '',
                maleRepsHeavy: row[14] || '',
                femaleRepsLight: row[15] || '',
                femaleRepsMedium: row[16] || '',
                femaleRepsHeavy: row[17] || '',
                spineRestrictions: toBoolean(row[18]),
                kneeRestrictions: toBoolean(row[19]),
                shoulderRestrictions: toBoolean(row[20]),
            };

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

updateExercises();
