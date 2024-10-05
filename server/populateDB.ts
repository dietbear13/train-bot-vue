// server/populateDB.ts
import mongoose from 'mongoose'
import Exercise from '../server/models/Exercise'
import Pattern from '../server/models/Pattern'

const exercises = [
    {
        category: 'грудь',
        subcategory: 'большая грудная',
        mainMuscles: 'большая грудная',
        additionalMuscles: 'трицепс',
        difficultyLevel: 'Многосуставное (сложное)',
        name: 'Жим штанги лёжа',
        equipment: 'штанга',
        maleRepsLight: '12,15,20',
        maleRepsMedium: '8,10,12',
        maleRepsHeavy: '6,8',
        femaleRepsLight: '15,20',
        femaleRepsMedium: '10,12',
        femaleRepsHeavy: '8,10',
    },
    {
        category: 'грудь',
        subcategory: 'большая грудная',
        mainMuscles: 'большая грудная',
        additionalMuscles: 'трицепс',
        difficultyLevel: 'Многосуставное (сложное)',
        name: 'Жим гантелей лёжа',
        equipment: 'гантели',
        maleRepsLight: '12,15,20',
        maleRepsMedium: '8,10,12',
        maleRepsHeavy: '6,8',
        femaleRepsLight: '15,20',
        femaleRepsMedium: '10,12',
        femaleRepsHeavy: '8,10',
    },
    {
        category: 'грудь',
        subcategory: 'большая грудная',
        mainMuscles: 'большая грудная',
        additionalMuscles: 'передняя дельта, трицепс',
        difficultyLevel: 'Многосуставное (простое)',
        name: 'Отжимания',
        equipment: 'коврик',
        maleRepsLight: '15,20,25',
        maleRepsMedium: '25,30,35',
        maleRepsHeavy: '25,30,35',
        femaleRepsLight: '8',
        femaleRepsMedium: '10',
        femaleRepsHeavy: '12',
    },
    {
        category: 'грудь',
        subcategory: 'большая грудная',
        mainMuscles: 'большая грудная',
        additionalMuscles: 'трицепс',
        difficultyLevel: 'Многосуставное (простое)',
        name: 'Отжимания на брусьях с весом или без',
        equipment: 'Тренажёр',
        maleRepsLight: '15,20',
        maleRepsMedium: '10,12',
        maleRepsHeavy: '8,10',
        femaleRepsLight: '8',
        femaleRepsMedium: '10',
        femaleRepsHeavy: '12',
    },
    {
        category: 'грудь',
        subcategory: 'большая грудная',
        mainMuscles: 'большая грудная',
        additionalMuscles: 'трицепс, широчайшая',
        difficultyLevel: 'Многосуставное (простое)',
        name: 'Пулловер с 1 гантелью',
        equipment: 'гантели',
        maleRepsLight: '12,15',
        maleRepsMedium: '8,10',
        maleRepsHeavy: '6,8',
        femaleRepsLight: '15,20',
        femaleRepsMedium: '10,12',
        femaleRepsHeavy: '8,10',
    },
    {
        category: 'грудь',
        subcategory: 'большая грудная',
        mainMuscles: 'большая грудная',
        additionalMuscles: '—',
        difficultyLevel: 'Изолирующее',
        name: 'Сведение рук с гантелями лёжа',
        equipment: 'гантели',
        maleRepsLight: '12,15',
        maleRepsMedium: '8,10',
        maleRepsHeavy: '6,8',
        femaleRepsLight: '15,20',
        femaleRepsMedium: '12,15',
        femaleRepsHeavy: '10',
    },
    {
        category: 'грудь',
        subcategory: 'большая грудная',
        mainMuscles: 'большая грудная',
        additionalMuscles: '—',
        difficultyLevel: 'Изолирующее',
        name: 'Сведение рук в кроссовере',
        equipment: 'кроссовер',
        maleRepsLight: '15,20',
        maleRepsMedium: '10,12',
        maleRepsHeavy: '8,10',
        femaleRepsLight: '15,20',
        femaleRepsMedium: '12,15',
        femaleRepsHeavy: '10',
    },
    {
        category: 'грудь',
        subcategory: 'большая грудная',
        mainMuscles: 'большая грудная',
        additionalMuscles: '—',
        difficultyLevel: 'Изолирующее',
        name: 'Сведение рук в тренажёре пэк-дек (бабочка)',
        equipment: 'тренажёр',
        maleRepsLight: '15,20',
        maleRepsMedium: '10,12',
        maleRepsHeavy: '8,10',
        femaleRepsLight: '15,20',
        femaleRepsMedium: '12,15',
        femaleRepsHeavy: '10',
    },
    {
        category: 'грудь',
        subcategory: 'верх груди',
        mainMuscles: 'верхняя грудная',
        additionalMuscles: 'передняя дельта, трицепс',
        difficultyLevel: 'Многосуставное (сложное)',
        name: 'Жим штанги в наклоне',
        equipment: 'штанга',
        maleRepsLight: '12,15,20',
        maleRepsMedium: '8,10,12',
        maleRepsHeavy: '6,8',
        femaleRepsLight: '15,20',
        femaleRepsMedium: '10,12',
        femaleRepsHeavy: '8,10',
    },
    {
        category: 'грудь',
        subcategory: 'верх груди',
        mainMuscles: 'верхняя грудная',
        additionalMuscles: 'передняя дельта, трицепс',
        difficultyLevel: 'Многосуставное (сложное)',
        name: 'Жим гантелей в наклоне 30°',
        equipment: 'гантели',
        maleRepsLight: '12,15,20',
        maleRepsMedium: '8,10,12',
        maleRepsHeavy: '6,8',
        femaleRepsLight: '15,20',
        femaleRepsMedium: '10,12',
        femaleRepsHeavy: '8,10',
    },
    {
        category: 'грудь',
        subcategory: 'верх груди',
        mainMuscles: 'верхняя грудная',
        additionalMuscles: 'передняя дельта, трицепс',
        difficultyLevel: 'Многосуставное (сложное)',
        name: 'Жим гантелей в наклоне 45°',
        equipment: 'гантели',
        maleRepsLight: '12,15,20',
        maleRepsMedium: '8,10,12',
        maleRepsHeavy: '6,8',
        femaleRepsLight: '15,20',
        femaleRepsMedium: '10,12',
        femaleRepsHeavy: '8,10',
    },
    {
        category: 'грудь',
        subcategory: 'верх груди',
        mainMuscles: 'верхняя грудная',
        additionalMuscles: 'передняя дельта, трицепс',
        difficultyLevel: 'Многосуставное (простое)',
        name: 'Жим в тренажёре Хаммера на верх груди',
        equipment: 'тренажёр',
        maleRepsLight: '12,15,20',
        maleRepsMedium: '8,10,12',
        maleRepsHeavy: '6,8',
        femaleRepsLight: '15,20',
        femaleRepsMedium: '10,12',
        femaleRepsHeavy: '8,10',
    },
    {
        category: 'грудь',
        subcategory: 'верх груди',
        mainMuscles: 'верхняя грудная',
        additionalMuscles: 'передняя дельта',
        difficultyLevel: 'Изолирующее',
        name: 'Сведение рук с гантелями в наклоне 30°',
        equipment: 'гантели',
        maleRepsLight: '15,20',
        maleRepsMedium: '10,12',
        maleRepsHeavy: '8,10',
        femaleRepsLight: '15,20',
        femaleRepsMedium: '10,12',
        femaleRepsHeavy: '8,10',
    },
    {
        category: 'грудь',
        subcategory: 'верх груди',
        mainMuscles: 'верхняя грудная',
        additionalMuscles: 'передняя дельта',
        difficultyLevel: 'Изолирующее',
        name: 'Сведение рук с гантелями в наклоне 45°',
        equipment: 'гантели',
        maleRepsLight: '15,20',
        maleRepsMedium: '10,12',
        maleRepsHeavy: '8,10',
        femaleRepsLight: '15,20',
        femaleRepsMedium: '10,12',
        femaleRepsHeavy: '8,10',
    },
    {
        category: 'грудь',
        subcategory: 'верх груди',
        mainMuscles: 'верхняя грудная',
        additionalMuscles: 'передняя дельта',
        difficultyLevel: 'Изолирующее',
        name: 'Сведение рук в кроссовере с нижнего блока на уровне плеч',
        equipment: 'кроссовер',
        maleRepsLight: '15,20',
        maleRepsMedium: '10,12',
        maleRepsHeavy: '8,10',
        femaleRepsLight: '15,20',
        femaleRepsMedium: '12,15',
        femaleRepsHeavy: '10',
    },
    // Добавьте остальные упражнения аналогичным образом
]

const patterns = [
    {
        gender: 'Мужчина',
        muscleGroup: 'грудь',
        mainMuscle: 'большая грудная',
        complexNumber: 1,
        exercises: [
            { exerciseLevel: 'Многосуставное (сложное)', repetitionLevel: 'средняя' },
            { exerciseLevel: 'Многосуставное (сложное)', repetitionLevel: 'средняя' },
            { exerciseLevel: 'Изолирующее', repetitionLevel: 'тяжелая' },
            { exerciseLevel: 'Изолирующее', repetitionLevel: 'легкая' },
        ],
    },
    {
        gender: 'Мужчина',
        muscleGroup: 'грудь',
        mainMuscle: 'большая грудная',
        complexNumber: 2,
        exercises: [
            { exerciseLevel: 'Изолирующее', repetitionLevel: 'легкая' },
            { exerciseLevel: 'Многосуставное (сложное)', repetitionLevel: 'тяжелая' },
            { exerciseLevel: 'Многосуставное (простое)', repetitionLevel: 'средняя' },
            { exerciseLevel: 'Изолирующее', repetitionLevel: 'легкая' },
        ],
    },
    {
        gender: 'Женщина',
        muscleGroup: 'грудь',
        mainMuscle: 'большая грудная',
        complexNumber: 1,
        exercises: [
            { exerciseLevel: 'Многосуставное (простое)', repetitionLevel: 'средняя' },
            { exerciseLevel: 'Изолирующее', repetitionLevel: 'тяжелая' },
            { exerciseLevel: 'Изолирующее', repetitionLevel: 'легкая' },
        ],
    },
    // Добавьте остальные паттерны аналогичным образом
]

mongoose.connect('mongodb://localhost:27017/fitness-app', {
} as mongoose.ConnectOptions)
    .then(async () => {
        console.log('Connected to MongoDB')

        try {
            // Очищаем существующие данные
            await Exercise.deleteMany({})
            await Pattern.deleteMany({})

            // Добавляем упражнения
            await Exercise.insertMany(exercises)
            console.log('Inserted exercises')

            // Добавляем паттерны
            await Pattern.insertMany(patterns)
            console.log('Inserted patterns')

            mongoose.disconnect()
        } catch (error) {
            console.error('Error populating database:', error)
            mongoose.disconnect()
        }
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error)
    })
