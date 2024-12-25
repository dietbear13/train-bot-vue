// updatePatterns.ts
import mongoose, { Schema, Document, model } from 'mongoose';
import xlsx from 'xlsx';
import path from 'path';

// Подключение к MongoDB
mongoose
    .connect('mongodb://localhost:27017/fitness-app', {})
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

/**
 * Интерфейс для одного упражнения внутри паттерна
 * (соответствует колонкам: muscleGroup, subcategory, mainMuscle, exercise)
 */
interface IPatternExercise {
    muscleGroup: string;
    subcategory: string;
    mainMuscle: string;
    exercise: string;
}

/**
 * Интерфейс для документа паттерна
 */
interface IPattern extends Document {
    gender: string;
    complexNumber: number; // Изменили на number
    exercises: IPatternExercise[];
}

// Схема для "одного упражнения" внутри паттерна
const patternExerciseSchema = new Schema<IPatternExercise>({
    muscleGroup: { type: String },
    subcategory: { type: String },
    mainMuscle: { type: String },
    exercise: { type: String },
});

// Схема для самого паттерна
const patternSchema = new Schema<IPattern>({
    gender: { type: String, required: true },
    complexNumber: { type: Number, required: true },
    exercises: [patternExerciseSchema],
});

const Pattern = model<IPattern>('Pattern', patternSchema);

// Путь к Excel-файлу (обновите, если нужно)
const filePath = path.join(__dirname, 'Все упражнения (2).xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = 'Сплиты по группам'; // Название листа
const worksheet = workbook.Sheets[sheetName];

// Преобразование данных Excel в массив массивов (header: 1)
const rawData = xlsx.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

// Допустим, первая строка — заголовки, поэтому срезаем со второй
// (или с третьей, если у вас там ещё какая-то строка)
const dataRows = rawData.slice(1);

async function populatePatternsDB() {
    try {
        // Очищаем коллекцию перед перезаписью
        await Pattern.deleteMany({});
        console.log('Patterns collection cleared.');

        /**
         * Временный объект, где ключ — (gender + '-' + complexNumber),
         * значение — паттерн с массивом упражнений
         */
        const patternsMap: { [key: string]: IPattern } = {};

        // Обрабатываем каждую строку
        for (const row of dataRows) {
            /**
             * Предполагаем, что порядок столбцов:
             * 0: gender
             * 1: muscleGroup
             * 2: subcategory
             * 3: mainMuscle
             * 4: complexNumber
             * 5: exercises (тип/название упражнения)
             */
            const gender = (row[0] || '').toString().trim();
            const muscleGroup = (row[1] || '').toString().trim();
            const subcategory = (row[2] || '').toString().trim();
            const mainMuscle = (row[3] || '').toString().trim();
            // Парсим complexNumber как число
            const complexNumber = Number(row[4] || 0);
            const exercise = (row[5] || '').toString().trim();

            // Формируем ключ, чтобы сгруппировать упражнения в один паттерн
            const patternKey = `${gender}-${complexNumber}`;

            if (!patternsMap[patternKey]) {
                // Создаём паттерн впервые
                patternsMap[patternKey] = new Pattern({
                    gender,
                    complexNumber,
                    exercises: [],
                });
            }

            // Добавляем упражнение в массив exercises
            patternsMap[patternKey].exercises.push({
                muscleGroup,
                subcategory,
                mainMuscle,
                exercise,
            });
        }

        // Преобразуем объект в массив
        const patternsToInsert = Object.values(patternsMap);

        // Сохраняем паттерны в базу
        await Pattern.insertMany(patternsToInsert);

        console.log('Database successfully populated with new patterns');
    } catch (error) {
        console.error('Error while populating patterns:', error);
    } finally {
        mongoose.disconnect();
    }
}

// Запуск
populatePatternsDB();
