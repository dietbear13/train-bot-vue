import mongoose from 'mongoose';
import xlsx from 'xlsx';
import path from 'path';

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/fitness-app', {})
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

// Определение схемы для упражнений внутри паттернов
const exerciseSchema = new mongoose.Schema({
    muscleGroup: String,
    mainMuscle: String,
    repetitionLevel: String,
    additionalColumn: String, // Добавлен дополнительный столбец
});

// Определение основной схемы для паттернов
const patternSchema = new mongoose.Schema({
    gender: String,
    complexNumber: String,
    exerciseLevel: String,
    exercises: [exerciseSchema],
});

const Pattern = mongoose.model('Pattern', patternSchema);

// Чтение данных из Excel файла
const filePath = path.join(__dirname, 'Все упражнения (2).xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = 'Сплиты по группам';
const worksheet = workbook.Sheets[sheetName];

// Преобразование данных Excel в JSON
const jsonData: any[] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

// Удаление заголовков (предполагается, что первые две строки — заголовки)
const headers = jsonData[0];
const dataRows = jsonData.slice(2);

// Функция для заполнения базы данных паттернов
const populatePatternsDB = async () => {
    try {
        // Очистка коллекции паттернов перед добавлением новых данных
        await Pattern.deleteMany({});
        console.log('Collection cleared.');

        const patterns: { [key: string]: any } = {};

        // Обработка каждой строки данных
        for (const row of dataRows) {
            const [gender, muscleGroup, mainMuscle, complexNumber, ...exerciseData] = row;

            // Формирование упражнений и добавление последнего столбца в объект упражнения
            for (let i = 0; i < exerciseData.length - 1; i += 2) {
                const exerciseLevel = exerciseData[i];
                const repetitionLevel = exerciseData[i + 1];
                const additionalColumn = exerciseData[exerciseData.length - 1]; // Последний столбец

                if (exerciseLevel && repetitionLevel) {
                    const patternKey = `${complexNumber}-${exerciseLevel}`;
                    if (!patterns[patternKey]) {
                        patterns[patternKey] = {
                            gender: gender.trim().toLowerCase(),
                            complexNumber: complexNumber.trim(),
                            exerciseLevel: exerciseLevel.trim(),
                            exercises: [],
                        };
                    }

                    patterns[patternKey].exercises.push({
                        muscleGroup: muscleGroup.trim().toLowerCase(),
                        mainMuscle: mainMuscle.trim().toLowerCase(),
                        repetitionLevel: repetitionLevel.trim(),
                        additionalColumn: additionalColumn.trim(),
                    });
                }
            }
        }

        // Вставка всех сгруппированных паттернов в базу данных
        const patternsToInsert = Object.values(patterns);
        await Pattern.insertMany(patternsToInsert);

        console.log('Database successfully populated with patterns');
        mongoose.disconnect();
    } catch (error) {
        console.error('Error while populating database:', error);
        mongoose.disconnect();
    }
};

// Запуск функции для заполнения базы данных
populatePatternsDB();
