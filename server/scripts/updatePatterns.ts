// updatePatterns.ts
import mongoose, { Schema, Document, model } from 'mongoose';
import xlsx from 'xlsx';
import path from 'path';

/**
 * Интерфейс для одного упражнения внутри паттерна
 */
interface IPatternExercise {
    exerciseLevel: string;
    repetitionLevel: string;
}

/**
 * Интерфейс для документа паттерна
 */
interface IPattern extends Document {
    gender: string;            // "мужчина", "женщина" или "мужчина,женщина"
    muscleGroup: string;       // Грудь, Спина и т.д.
    subcategory: string;       // Верхняя грудная, ширина спины и т.д.
    mainMuscle: string;        // Верхняя грудная, широчайшая...
    complexNumber: string;     // "29", "30" ...
    exercises: IPatternExercise[];
}

// Схема для "одного упражнения" внутри паттерна
const patternExerciseSchema = new Schema<IPatternExercise>({
    exerciseLevel: { type: String, required: true },
    repetitionLevel: { type: String, required: true },
});

// Схема для самого паттерна
const patternSchema = new Schema<IPattern>({
    gender: { type: String, required: true },
    muscleGroup: { type: String, required: true },
    subcategory: { type: String, required: true },
    mainMuscle: { type: String, required: true },
    complexNumber: { type: String, required: true },
    exercises: { type: [patternExerciseSchema], required: true },
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
const dataRows = rawData.slice(1);

/**
 * Функция для генерации случайного уровня повторений
 */
function getRandomRepetitionLevel(): string {
    const levels = ['легкая', 'средняя', 'тяжелая'];
    return levels[Math.floor(Math.random() * levels.length)];
}

async function populatePatternsDB() {
    try {
        // Очищаем коллекцию перед перезаписью
        await Pattern.deleteMany({});
        console.log('Patterns collection cleared.');

        /**
         * Временный объект, где ключ — комбинация gender, complexNumber, muscleGroup, subcategory, mainMuscle,
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
             * 5: exerciseLevel (тип/название упражнения)
             */
            const gender = (row[0] || '').toString().trim();
            const muscleGroup = (row[1] || '').toString().trim();
            const subcategory = (row[2] || '').toString().trim();
            const mainMuscle = (row[3] || '').toString().trim();
            // Парсим complexNumber как строку
            const complexNumber = (row[4] || '').toString().trim();
            const exerciseLevel = (row[5] || '').toString().trim();

            // Генерируем случайный repetitionLevel
            const repetitionLevel = getRandomRepetitionLevel();

            // Формируем ключ, чтобы сгруппировать упражнения в один паттерн
            const patternKey = `${gender}-${complexNumber}-${muscleGroup}-${subcategory}-${mainMuscle}`;

            if (!patternsMap[patternKey]) {
                // Создаём паттерн впервые
                patternsMap[patternKey] = new Pattern({
                    gender,
                    complexNumber,
                    muscleGroup,
                    subcategory,
                    mainMuscle,
                    exercises: [],
                });
            }

            // Добавляем упражнение в массив exercises
            patternsMap[patternKey].exercises.push({
                exerciseLevel,
                repetitionLevel,
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

async function main() {
    try {
        // Подключение к MongoDB
        await mongoose.connect('mongodb://mongodb:27017/fitness-app');
        console.log('Connected to MongoDB');

        // Запуск функции заполнения базы данных
        await populatePatternsDB();
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Завершить процесс с ошибкой
    }
}

// Запуск
main();
