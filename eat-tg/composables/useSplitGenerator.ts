// ~/composables/useSplitGenerator.ts
import { ref, onMounted } from 'vue'
import axios from 'axios'

// Интерфейсы
interface FoundExercise {
    _id: string // Уникальный идентификатор упражнения
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
    splitComment?: string
    splitId: number
    gender: string
    splitDays: string
    days: SplitDay[]
}

interface GeneratedDay {
    dayName: string
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
    difficultyLevel: string
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
    maxTries: number = 10
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
            // 1) Парсим chosenSplit.splitDays, например: "2(пн,ср,чт,пт)"
            const matchDays = chosenSplit.splitDays.match(/^(\d+)\(([^)]+)\)/)
            if (!matchDays) {
                params.errorMessages.value.push(`Некорректное поле splitDays: ${chosenSplit.splitDays}`)
                params.showSnackbar(`Некорректное поле splitDays: ${chosenSplit.splitDays}`, 'error')
                console.warn(`Некорректное поле splitDays: ${chosenSplit.splitDays}`)
                return
            }
            const countDays = parseInt(matchDays[1], 10) // напр. "2"
            const dayNames = matchDays[2].split(',').map(s => s.trim().toLowerCase()) // ["пн","ср","чт","пт"]

            console.log('countDays:', countDays)
            console.log('dayNames:', dayNames)

            // 2) Определяем дни недели (7 дней: пн..вс)
            const weekDays = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']

            // 3) Очищаем finalPlan
            finalPlan.value = []

            // 4) Инициализируем индекс паттерна для цикличного распределения
            let patternIndex = 0

            // 5) Генерируем план для каждого дня недели
            for (let i = 0; i < weekDays.length; i++) {
                const currentDay = weekDays[i]

                if (dayNames.includes(currentDay)) {
                    // Берём день по циклу (0..countDays-1)
                    // но на всякий случай используем % выбранного фактического количества дней в chosenSplit.days
                    const maxIndex = chosenSplit.days.length
                    if (maxIndex === 0) {
                        // Если в базе вообще нет days — добавим отдых
                        console.warn('chosenSplit.days.length = 0, нечего генерировать.')
                        finalPlan.value.push({
                            dayName: capitalize(currentDay),
                            exercises: []
                        })
                        continue
                    }
                    const safeIndex = patternIndex % maxIndex
                    patternIndex++

                    const currentPatternDay = chosenSplit.days[safeIndex]
                    if (!currentPatternDay) {
                        // Если всё же не нашли нужный индекс, добавим день отдыха
                        console.warn(
                            `Не найден currentPatternDay по индексу ${safeIndex}. Массив days:`,
                            chosenSplit.days
                        )
                        finalPlan.value.push({
                            dayName: capitalize(currentDay),
                            exercises: []
                        })
                        continue
                    }

                    // Теперь генерируем список упражнений
                    const exList: FoundExercise[] = []
                    // Соберём ID упражнений, чтобы не повторяться в рамках одного дня
                    const usedIdsInDay = new Set<string>()

                    for (const item of currentPatternDay.patternOrExercise) {
                        // --- Логика обработки "или" (|) ---
                        let chosenVariant = item
                        if (item.includes('|')) {
                            const splittedVariants = item.split('|')
                            chosenVariant = splittedVariants[Math.floor(Math.random() * splittedVariants.length)].trim()

                            // Если в исходной строке был префикс ex: или pa:, добавляем его при необходимости
                            if (item.startsWith('ex:') && !chosenVariant.startsWith('ex:') && !chosenVariant.startsWith('pa:')) {
                                chosenVariant = 'ex:' + chosenVariant
                            } else if (item.startsWith('pa:') && !chosenVariant.startsWith('pa:') && !chosenVariant.startsWith('ex:')) {
                                chosenVariant = 'pa:' + chosenVariant
                            }
                        }
                        // --- Конец логики "|"

                        if (chosenVariant.startsWith('ex:')) {
                            // Пример: "ex:широчайшая мышца,многосуставное-простое"
                            const criteria = chosenVariant.replace('ex:', '').trim()
                            const [mainMuscle, difficultyLevel] = criteria.split(',').map(s => s.trim())
                            if (!mainMuscle || !difficultyLevel) {
                                console.warn(`Некорректные критерии: "${criteria}"`)
                                exList.push({ _id: '', name: `Некорректные критерии: ${criteria}`, sets: 0, reps: 0 })
                                continue
                            }

                            console.log(`Поиск упражнений для "mainMuscle: ${mainMuscle}", "difficultyLevel: ${difficultyLevel}"`)

                            const matchingExercises = exercises.value.filter(e => {
                                return e.mainMuscle.toLowerCase() === mainMuscle.toLowerCase() &&
                                    e.difficultyLevel.toLowerCase() === difficultyLevel.toLowerCase()
                            })

                            console.log(`Найдено упражнений для "${criteria}":`, matchingExercises)

                            if (matchingExercises.length === 0) {
                                console.warn(`Нет упражнений для критериев: "${criteria}"`)
                                exList.push({ _id: '', name: `Нет упражнений для ${criteria}`, sets: 0, reps: 0 })
                                continue
                            }

                            // Используем случайный уровень повторений
                            const repetitionLevel = getRandomLoadLevel()
                            console.log(`Используем уровень повторений: ${repetitionLevel}`)

                            const found = tryFindExercise(
                                matchingExercises,
                                repetitionLevel,
                                gender,
                                usedIdsInDay,
                                5
                            )

                            if (!found) {
                                console.warn(`Не удалось подобрать упражнение для "${criteria}"`)
                                exList.push({ _id: '', name: `Не удалось подобрать упражнение для ${criteria}`, sets: 0, reps: 0 })
                                continue
                            }

                            usedIdsInDay.add(found.exercise._id)
                            exList.push({
                                _id: found.exercise._id,
                                name: found.exercise.name,
                                sets: found.sets,
                                reps: found.reps
                            })
                            console.log(`Добавлено упражнение: ${found.exercise.name} - ${found.sets}x${found.reps}`)
                        } else if (chosenVariant.startsWith('pa:')) {
                            /**
                             *  Логика «паттерна»:
                             *  Пример: "pa:спина,широчайшая мышца(2)" => category=спина, mainMuscle=широчайшая мышца, и нам нужно 2 упражнения
                             */
                            const criteria = chosenVariant.replace('pa:', '').trim()
                            // Сначала проверяем, есть ли число в скобках (N)
                            let timesToGenerate = 1
                            const bracketMatch = criteria.match(/\((\d+)\)$/)
                            let cleanedCriteria = criteria
                            if (bracketMatch) {
                                timesToGenerate = parseInt(bracketMatch[1], 10)
                                // Удаляем "(N)" из конца
                                cleanedCriteria = criteria.replace(/\(\d+\)$/, '').trim()
                            }

                            // Дальше разберём оставшуюся строку как "category, mainMuscle"
                            const [category, mm] = cleanedCriteria.split(',').map(s => s.trim().toLowerCase())

                            if (!category || !mm) {
                                console.warn(`Некорректные критерии PA: "${criteria}"`)
                                exList.push({ _id: '', name: `Некорректные критерии PA: ${criteria}`, sets: 0, reps: 0 })
                                continue
                            }

                            console.log(`PA-логика: ищем ${timesToGenerate} упр. для category="${category}", mainMuscle="${mm}"`)

                            // Фильтруем упражнения по category и mainMuscle
                            const matchingExercises = exercises.value.filter(e => {
                                const cat = e.category.toLowerCase()
                                const muscle = e.mainMuscle.toLowerCase()
                                return (
                                    cat === category &&
                                    muscle === mm &&
                                    !usedIdsInDay.has(e._id)
                                )
                            })

                            console.log(`Найдено упражнений по PA:`, matchingExercises)

                            if (matchingExercises.length === 0) {
                                console.warn(`Нет упражнений для PA-критериев: "${cleanedCriteria}"`)
                                exList.push({ _id: '', name: `Нет PA-упражнений для ${criteria}`, sets: 0, reps: 0 })
                                continue
                            }

                            // Генерируем нужное количество (timesToGenerate) упражнений
                            for (let iPa = 0; iPa < timesToGenerate; iPa++) {
                                const repetitionLevel = getRandomLoadLevel()
                                console.log(`Используем уровень повторений (PA): ${repetitionLevel}`)

                                const found = tryFindExercise(
                                    matchingExercises,
                                    repetitionLevel,
                                    gender,
                                    usedIdsInDay,
                                    5
                                )

                                if (!found) {
                                    console.warn(`Не удалось подобрать PA-упражнение #${iPa + 1} для "${cleanedCriteria}"`)
                                    exList.push({ _id: '', name: `Не подобрано PA-упражнение ${cleanedCriteria}`, sets: 0, reps: 0 })
                                    continue
                                }

                                usedIdsInDay.add(found.exercise._id)
                                exList.push({
                                    _id: found.exercise._id,
                                    name: found.exercise.name,
                                    sets: found.sets,
                                    reps: found.reps
                                })
                                console.log(`Добавлено PA-упражнение: ${found.exercise.name} - ${found.sets}x${found.reps}`)
                            }
                        } else {
                            // Неизвестный тип
                            exList.push({ _id: '', name: `Неизвестный тип: ${chosenVariant}`, sets: 3, reps: 10 })
                            console.warn(`Неизвестный тип: ${chosenVariant}`)
                        }
                    }

                    finalPlan.value.push({
                        dayName: capitalize(currentDay),
                        exercises: exList
                    })
                    console.log(`День ${i + 1} (${currentDay}):`, exList)
                } else {
                    // День отдыха
                    finalPlan.value.push({
                        dayName: capitalize(currentDay),
                        exercises: []
                    })
                    console.log(`День ${i + 1} (${currentDay}): отдых`)
                }
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

    // Добавляем методы для модификации плана
    function removeExercise(dayIndex: number, exerciseIndex: number) {
        if (finalPlan.value[dayIndex] && finalPlan.value[dayIndex].exercises[exerciseIndex]) {
            const removedExercise = finalPlan.value[dayIndex].exercises.splice(exerciseIndex, 1)[0]
            console.log(`Удалено упражнение: ${removedExercise.name} из дня ${dayIndex + 1}`)
        } else {
            console.warn(`Не удалось удалить упражнение: неверные индексы dayIndex=${dayIndex}, exerciseIndex=${exerciseIndex}`)
        }
    }

    function regenerateExercise(dayIndex: number, exerciseIndex: number, gender: string) {
        const day = finalPlan.value[dayIndex]
        if (!day) {
            console.warn(`День с индексом ${dayIndex} не найден.`)
            return
        }

        const exercise = day.exercises[exerciseIndex]
        if (!exercise || !exercise._id) {
            console.warn(`Упражнение с индексом ${exerciseIndex} в дне ${dayIndex + 1} не найдено или имеет некорректный ID.`)
            return
        }

        // Найти упражнение в базе данных по _id
        const matchingExercise = exercises.value.find(e => e._id === exercise._id)
        if (!matchingExercise) {
            console.warn(`Упражнение с ID ${exercise._id} не найдено в базе данных.`)
            return
        }

        // Использовать существующую логику для подбора нового упражнения
        const repetitionLevel = getRandomLoadLevel()
        const found = tryFindExercise(
            exercises.value.filter(e => e._id === exercise._id),
            repetitionLevel,
            gender,
            new Set<string>(),
            10
        )

        if (found) {
            day.exercises[exerciseIndex] = {
                _id: found.exercise._id,
                name: found.exercise.name,
                sets: found.sets,
                reps: found.reps
            }
            console.log(`Регенерировано упражнение: ${found.exercise.name} - ${found.sets}x${found.reps}`)
        } else {
            console.warn(`Не удалось регенерировать упражнение для ${exercise.name}`)
        }
    }

    function increaseReps(dayIndex: number, exerciseIndex: number) {
        const exercise = finalPlan.value[dayIndex]?.exercises[exerciseIndex]
        if (exercise) {
            exercise.reps += 1
            console.log(`Увеличено количество повторений для ${exercise.name} до ${exercise.reps}`)
        }
    }

    function decreaseReps(dayIndex: number, exerciseIndex: number) {
        const exercise = finalPlan.value[dayIndex]?.exercises[exerciseIndex]
        if (exercise && exercise.reps > 1) {
            exercise.reps -= 1
            console.log(`Уменьшено количество повторений для ${exercise.name} до ${exercise.reps}`)
        }
    }

    function increaseSets(dayIndex: number, exerciseIndex: number) {
        const exercise = finalPlan.value[dayIndex]?.exercises[exerciseIndex]
        if (exercise) {
            exercise.sets += 1
            console.log(`Увеличено количество подходов для ${exercise.name} до ${exercise.sets}`)
        }
    }

    function decreaseSets(dayIndex: number, exerciseIndex: number) {
        const exercise = finalPlan.value[dayIndex]?.exercises[exerciseIndex]
        if (exercise && exercise.sets > 1) {
            exercise.sets -= 1
            console.log(`Уменьшено количество подходов для ${exercise.name} до ${exercise.sets}`)
        }
    }

    return {
        finalPlan,
        generateSplitPlan,
        sendWorkoutPlan,
        removeExercise,
        regenerateExercise,
        increaseReps,
        decreaseReps,
        increaseSets,
        decreaseSets
    }
}
