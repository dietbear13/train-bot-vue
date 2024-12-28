// ~/composables/useSplitGenerator.ts
import { ref, onMounted } from 'vue'
import axios from 'axios'

// Интерфейсы
interface FoundExercise {
    name: string
    sets: number
    reps: number
}

interface SplitDay {
    numberDay: number
    patternOrExercise: string[]
}

interface SplitItem {
    _id: string
    split: string
    splitId: number
    gender: string
    splitDays: string
    days: SplitDay[]
}

interface GeneratedDay {
    exercises: FoundExercise[]
}

interface UseSplitGeneratorParams {
    isLoading: any        // Ref<boolean>
    isGenerating: any     // Ref<boolean>
    showBottomSheet: any  // Ref<boolean>
    errorMessages: any    // Ref<string[]>
    showSnackbar: (msg: string, color?: string) => void
    telegramUserId: any   // Ref<number|null>
}

interface Exercise {
    _id: string
    name: string
    category: string
    typeExercise: string
    mainMuscle: string
    additionalMuscles: string
    maleRepsLight: string
    maleRepsMedium: string
    maleRepsHeavy: string
    femaleRepsLight: string
    femaleRepsMedium: string
    femaleRepsHeavy: string
    // Добавьте остальные поля, необходимые для фильтрации
}

interface RepetitionLevels {
    maleRepsLight: string
    maleRepsMedium: string
    maleRepsHeavy: string
    femaleRepsLight: string
    femaleRepsMedium: string
    femaleRepsHeavy: string
}

// Карта соответствия уровней нагрузки
const levelMapping: { [key: string]: string } = {
    'лёгкая': 'Light',
    'легкая': 'Light',
    'средняя': 'Medium',
    'тяжёлая': 'Heavy',
    'тяжелая': 'Heavy'
}

// Функция для капитализации строки
function capitalize(str: string): string {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

// Функция для определения количества подходов
function getSets(reps: number): number {
    if (reps === 5) return 5
    if (reps === 6 || reps === 8) return 4
    if (reps === 10 || reps === 12 || reps === 15 || reps === 20) return 3
    return 3
}

// Функция для получения случайного уровня нагрузки
function getRandomLoadLevel(): string {
    const r = Math.random()
    if (r < 0.5) return 'средняя'
    else if (r < 0.75) return 'лёгкая'
    else return 'тяжёлая'
}

// Функция для получения вариантов повторений
function getRepsOptions(
    exercise: Exercise,
    repetitionLevel: string,
    genderStr: string,
    loadLevel: string
): string | null {
    if (!loadLevel) {
        console.warn('loadLevel is undefined or empty')
        return null
    }
    const normalizedLoadLevel = loadLevel.toLowerCase().replace('ё', 'е')
    const mappedLevel = levelMapping[normalizedLoadLevel]
    if (!mappedLevel) {
        console.warn(`Неизвестный уровень нагрузки: "${loadLevel}"`)
        return null
    }
    const repsKey = `${genderStr === 'Мужчина' ? 'male' : 'female'}Reps${capitalize(mappedLevel)}` as keyof RepetitionLevels

    const repsValue = (exercise as any)[repsKey]
    if (!repsValue || repsValue === '—') {
        return null
    }
    return repsValue
}

// Поиск упражнения (до 5 попыток)
function tryFindExercise(
    matchingExercises: Exercise[],
    repetitionLevel: string,
    genderStr: string,
    usedIds: Set<string>,
    maxTries: number = 5
): { exercise: Exercise; reps: number; sets: number } | null {
    let attempt = 0
    while (attempt < maxTries) {
        attempt++

        console.log(
            `Попытка ${attempt} из ${maxTries} для повторений "${repetitionLevel}" и пола "${genderStr}"`
        )

        const availableExercises = matchingExercises.filter(e => !usedIds.has(e._id))
        if (availableExercises.length === 0) {
            console.warn('Нет доступных упражнений для подбора.')
            break
        }

        const selectedExercise =
            availableExercises[Math.floor(Math.random() * availableExercises.length)]

        console.log('Выбранное упражнение:', selectedExercise.name)

        const randomLoad = getRandomLoadLevel()
        console.log('Случайный уровень нагрузки:', randomLoad)

        const repsOptions = getRepsOptions(
            selectedExercise,
            repetitionLevel,
            genderStr,
            randomLoad
        )
        console.log('Варианты повторений:', repsOptions)

        if (!repsOptions) {
            console.warn('Нет доступных повторений для этого упражнения.')
            continue
        }

        const repsArray = repsOptions
            .split(',')
            .map((x) => parseInt(x, 10))
            .filter((n) => !isNaN(n))

        console.log('Парсенные повторения:', repsArray)

        if (repsArray.length === 0) {
            console.warn('Повторения не были распознаны.')
            continue
        }

        const reps = repsArray[Math.floor(Math.random() * repsArray.length)]
        const sets = getSets(reps)

        console.log(`Выбраны повторения: ${reps}, подходы: ${sets}`)

        return {
            exercise: selectedExercise,
            reps,
            sets
        }
    }
    console.warn(
        'Не удалось найти подходящее упражнение после максимального количества попыток.'
    )
    return null
}

export default function useSplitGenerator(params: UseSplitGeneratorParams) {
    const finalPlan = ref<GeneratedDay[]>([]) // 7 дней, exercises: FoundExercise[]

    // Загружаем упражнения из API
    const exercises = ref<Exercise[]>([])

    // Функция для загрузки упражнений
    async function loadExercises() {
        try {
            const baseURL = 'https://fit-server-bot.ru.tuna.am/api'
            console.log(`Загрузка упражнений с URL: ${baseURL}/exercises`)
            const { data } = await axios.get<Exercise[]>(`${baseURL}/exercises`)
            exercises.value = Array.isArray(data) ? data : []
            console.log('Загружены упражнения:', exercises.value)
        } catch (err: any) {
            console.error('Ошибка при загрузке упражнений:', err)
            params.showSnackbar('Ошибка при загрузке упражнений.', 'error')
        }
    }

    // Загружаем упражнения при монтировании хука
    onMounted(() => {
        loadExercises()
    })

    // Функция для генерации плана сплита
    async function generateSplitPlan(gender: string, chosenSplit: SplitItem) {
        params.errorMessages.value = []
        if (!chosenSplit) {
            params.errorMessages.value.push('Не выбран сплит.')
            params.showSnackbar('Не выбран сплит.', 'error')
            console.warn('Не выбран сплит для генерации.')
            return
        }
        params.isLoading.value = true
        params.isGenerating.value = true

        try {
            // 1) Парсим chosenSplit.splitDays, например: "2(пн,ср,пт)"
            const matchDays = chosenSplit.splitDays.match(/^(\d+)\(([^)]+)\)/)
            if (!matchDays) {
                params.errorMessages.value.push(`Некорректное поле splitDays: ${chosenSplit.splitDays}`)
                params.showSnackbar(`Некорректное поле splitDays: ${chosenSplit.splitDays}`, 'error')
                console.warn(`Некорректное поле splitDays: ${chosenSplit.splitDays}`)
                return
            }
            const countDays = parseInt(matchDays[1], 10) // "2"
            const dayNames = matchDays[2].split(',').map(s => s.trim()) // ["пн","ср","пт"]

            console.log('countDays:', countDays)
            console.log('dayNames:', dayNames)

            // 2) Очищаем finalPlan
            finalPlan.value = []

            // 3) Генерируем 7 дней
            const usedExerciseIds = new Set<string>() // Для избежания повторений

            for (let i = 0; i < 7; i++) {
                const dayIndex = (i % countDays) + 1
                const dayObj = chosenSplit.days.find((d) => d.numberDay === dayIndex)
                if (!dayObj) {
                    // Нет такого дня => отдых
                    finalPlan.value.push({ exercises: [] })
                    console.log(`День ${i + 1}: отдых`)
                    continue
                }

                // dayObj.patternOrExercise: string[]
                const exList: FoundExercise[] = []
                for (const item of dayObj.patternOrExercise) {
                    if (item.startsWith('ex:')) {
                        // Пример: "ex:широчайшая мышца,многосуставное-сложное"
                        const criteria = item.replace('ex:', '').trim()
                        // Разбираем criteria
                        const [category, type] = criteria.split(',').map(s => s.trim())
                        if (!category || !type) {
                            console.warn(`Некорректные критерии: "${criteria}"`)
                            exList.push({ name: `Некорректные критерии: ${criteria}`, sets: 0, reps: 0 })
                            continue
                        }

                        // Находим упражнения по критериям
                        const matchingExercises = exercises.value.filter(e => {
                            return e.category.toLowerCase() === category.toLowerCase() &&
                                e.typeExercise.toLowerCase() === type.toLowerCase()
                        })

                        console.log(`Найдено упражнений для "${criteria}":`, matchingExercises)

                        if (matchingExercises.length === 0) {
                            console.warn(`Нет упражнений для критериев: "${criteria}"`)
                            exList.push({ name: `Нет упражнений для ${criteria}`, sets: 0, reps: 0 })
                            continue
                        }

                        // Используем случайный уровень повторений
                        const repetitionLevel = getRandomLoadLevel()
                        console.log(`Используем уровень повторений: ${repetitionLevel}`)

                        const found = tryFindExercise(
                            matchingExercises,
                            repetitionLevel,
                            gender,
                            usedExerciseIds,
                            5
                        )

                        if (!found) {
                            console.warn(`Не удалось подобрать упражнение для "${criteria}"`)
                            exList.push({ name: `Не удалось подобрать упражнение для ${criteria}`, sets: 0, reps: 0 })
                            continue
                        }

                        exList.push({
                            name: found.exercise.name,
                            sets: found.sets,
                            reps: found.reps
                        })
                        usedExerciseIds.add(found.exercise._id) // Добавляем ID упражнения в использованные
                        console.log(`Добавлено упражнение: ${found.exercise.name} - ${found.sets}x${found.reps}`)
                    } else if (item.startsWith('pa:')) {
                        // Обработка других типов, например 'pa:...'
                        const criteria = item.replace('pa:', '').trim()
                        // Здесь можно реализовать другую логику подбора
                        exList.push({ name: `PA-Logic: ${criteria}`, sets: 2, reps: 15 })
                        console.log(`Добавлено упражнение по PA-логике: PA-Logic: ${criteria}`)
                    } else {
                        // Неизвестный тип
                        exList.push({ name: `Неизвестный тип: ${item}`, sets: 3, reps: 10 })
                        console.warn(`Неизвестный тип: ${item}`)
                    }
                }

                finalPlan.value.push({
                    exercises: exList
                })
                console.log(`День ${i + 1}:`, exList)
            }

            // Показываем BottomSheet с результатами
            params.showBottomSheet.value = true
            console.log('BottomSheet показан с планом:', finalPlan.value)
        } catch (err: any) {
            console.error('Ошибка в generateSplitPlan:', err)
            params.errorMessages.value.push(`Ошибка генерации: ${err.message || err}`)
            params.showSnackbar(`Ошибка генерации: ${err.message || err}`, 'error')
        } finally {
            params.isLoading.value = false
            params.isGenerating.value = false
            console.log('Завершена генерация сплита.')
        }
    }

    // Функция для отправки плана через Telegram
    async function sendWorkoutPlan() {
        if (!params.telegramUserId.value) {
            params.showSnackbar('Не указан Telegram ID.', 'error')
            console.warn('Пользователь не авторизован в Telegram.')
            return
        }

        try {
            const baseURL = 'https://fit-server-bot.ru.tuna.am/api'
            console.log(`Отправка плана тренировок на URL: ${baseURL}/send-workout`)
            await axios.post(`${baseURL}/send-workout`, {
                userId: params.telegramUserId.value,
                plan: finalPlan.value,
            })
            params.showSnackbar('Тренировка успешно отправлена!', 'success')
            console.log('Тренировка успешно отправлена пользователю:', params.telegramUserId.value)
        } catch (err: any) {
            console.error('Ошибка при отправке тренировки:', err)
            params.showSnackbar('Не удалось отправить тренировку.', 'error')
        }
    }

    return {
        finalPlan,
        generateSplitPlan,
        sendWorkoutPlan
    }
}
