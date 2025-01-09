import { type Ref } from 'vue'

import type { Exercise, WorkoutResult, Pattern } from '~/components/training/TrainingByMuscles.vue'
import axios, { type AxiosRequestConfig, type Method } from 'axios'

const primaryBaseURL = 'http://fitnesstgbot.ru/api/'
const fallbackBaseURL = 'http://localhost:3002/api/'

// Функция для запросов с fallback
const apiRequest = async <T>(
    method: Method,
    endpoint: string,
    data?: any,
    params?: any
): Promise<T> => {
    const config: AxiosRequestConfig = {
        method,
        url: primaryBaseURL + endpoint,
        data,
        params,
        timeout: 5000
    }
    try {
        const response = await axios(config)
        return response.data
    } catch (primaryError) {
        console.warn(
            `Основной сервер не доступен: ${primaryError}. Переключение на резервный сервер.`
        )
        // Пробуем резервный сервер
        const fallbackConfig: AxiosRequestConfig = {
            method,
            url: fallbackBaseURL + endpoint,
            data,
            params,
            timeout: 5000
        }
        try {
            const response = await axios(fallbackConfig)
            return response.data
        } catch (fallbackError) {
            console.error(`Резервный сервер также не доступен: ${fallbackError}`)
            throw fallbackError
        }
    }
}

// Вспомогательные функции
function getSets(reps: number): number {
    if (reps === 5) return 5
    if (reps === 6 || reps === 8) return 4
    if (reps === 10 || reps === 12 || reps === 15 || reps === 20) return 3
    return 3
}

const levelMapping: { [key: string]: string } = {
    'лёгкая': 'Light',
    'легкая': 'Light',
    'средняя': 'Medium',
    'тяжёлая': 'Heavy',
    'тяжелая': 'Heavy'
}

function capitalize(str: string): string {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

function getRandomLoadLevel(): string {
    const r = Math.random()
    if (r < 0.5) return 'средняя'
    else if (r < 0.75) return 'лёгкая'
    else return 'тяжёлая'
}

/**
 * Возвращает строку повторений (например, "10,12,15") или null,
 * если значение не подходит под нужные условия.
 */
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

    // Ключ типа 'maleRepsLight', 'femaleRepsMedium' и т.д.
    const repsKey = `${genderStr === 'Мужчина' ? 'male' : 'female'}Reps${capitalize(mappedLevel)}` as keyof Exercise

    // Явно считаем, что хранимые значения — это строки (с запятыми).
    const possibleRepsValue = exercise[repsKey]
    // Если нет значения или оно равно '—', возвращаем null
    if (typeof possibleRepsValue !== 'string' || possibleRepsValue === '—') {
        return null
    }
    return possibleRepsValue
}

// Поиск упражнения (до 5 или 10 попыток)
function tryFindExercise(
    matchingExercises: Exercise[],
    repetitionLevel: string,
    genderStr: string,
    usedIds: Set<string>,
    maxTries: number = 55
): { exercise: Exercise; reps: number; sets: number } | null {
    let attempt = 0
    while (attempt < maxTries) {
        attempt++

        console.log(
            `Попытка ${attempt} из ${maxTries} для повторений "${repetitionLevel}" и пола "${genderStr}"`
        )

        const selectedExercise =
            matchingExercises[Math.floor(Math.random() * matchingExercises.length)]

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

// Тип для аргумента, принимаемого хуком
interface HookParams {
    gender: Ref<string>,
    muscleGroup: Ref<string>,
    muscleSubgroup: Ref<string>,
    patterns: Ref<Pattern[]>,
    exercises: Ref<Exercise[]>,
    usedExerciseIds: Ref<Set<string>>,
    workoutResults: Ref<WorkoutResult[]>,
    selectedPattern: Ref<Pattern | null>,
    isGenerating: Ref<boolean>,
    timer: Ref<number>,
    errorMessages: Ref<string[]>,
    intervalId: { value: number | null },
    showBottomSheet: Ref<boolean>,
    showSnackbar: (message: string, color?: string) => void
}

// Сам хук
export default function useWorkoutGenerator(params: HookParams) {
    const {
        gender,
        muscleGroup,
        muscleSubgroup,
        patterns,
        exercises,
        usedExerciseIds,
        workoutResults,
        selectedPattern,
        isGenerating,
        timer,
        errorMessages,
        intervalId,
        showBottomSheet,
        showSnackbar
    } = params

    // Тот же generateWorkout, но в конце мы выставляем 3-секундный таймер
    function generateWorkout(): void {
        if (isGenerating.value || timer.value > 0) return

        if (!gender.value || !muscleGroup.value || !muscleSubgroup.value) {
            showSnackbar('Пожалуйста, заполните все поля.', 'error')
            console.log('Некоторые поля не заполнены:', {
                gender: gender.value,
                muscleGroup: muscleGroup.value,
                muscleSubgroup: muscleSubgroup.value
            })
            return
        }

        isGenerating.value = true
        errorMessages.value = []
        workoutResults.value = []

        const filteredPatterns = patterns.value.filter((p) => {
            const gMatch = p.gender.toLowerCase().includes(gender.value.toLowerCase())
            if (!gMatch) return false

            const mgMatch = p.muscleGroup.toLowerCase() === muscleGroup.value.toLowerCase()
            const sgMatch = p.subcategory.toLowerCase() === muscleSubgroup.value.toLowerCase()

            return mgMatch && sgMatch
        })

        console.log('Отфильтрованные паттерны:', filteredPatterns)

        if (filteredPatterns.length === 0) {
            showSnackbar('Подходящий паттерн не найден.', 'error')
            console.log(
                'Не найдено подходящих паттернов для выбранных параметров.'
            )
            isGenerating.value = false
            return
        }

        const pattern = filteredPatterns[Math.floor(Math.random() * filteredPatterns.length)]
        selectedPattern.value = pattern
        usedExerciseIds.value = new Set()

        console.log('Выбранный паттерн:', pattern)

        const workout: WorkoutResult[] = []

        for (const patternExercise of pattern.exercises) {
            const mg = pattern.muscleGroup.toLowerCase()
            const mm = pattern.mainMuscle.toLowerCase()

            console.log(
                `Обрабатываем упражнение паттерна: ${patternExercise.exerciseLevel}, повторения: ${patternExercise.repetitionLevel}`
            )

            const normalizedRepetitionLevel = patternExercise.repetitionLevel
                .toLowerCase()
                .replace('ё', 'е')
            const mappedLevel = levelMapping[normalizedRepetitionLevel]
            if (!mappedLevel) {
                console.warn(
                    `Неизвестный уровень повторений: "${patternExercise.repetitionLevel}". Пропускаем упражнение.`
                )
                continue
            }

            // Формируем ключ для доступа к свойствам exercises: maleRepsLight / femaleRepsHeavy и т.п.
            const repsKey = `${
                gender.value === 'Мужчина' ? 'male' : 'female'
            }Reps${capitalize(mappedLevel)}` as keyof Exercise

            const matchingExercises = exercises.value.filter((e) => {
                if (!e.category || !e.mainMuscle) return false

                const catMatch = e.category.toLowerCase() === mg
                const mmToFind = mm
                const mmMatch =
                    e.mainMuscle.toLowerCase() === mmToFind ||
                    e.additionalMuscles.toLowerCase().includes(mmToFind)

                const notUsed = !usedExerciseIds.value.has(e._id)
                const hasValidReps = e[repsKey] && e[repsKey] !== '—'

                return catMatch && mmMatch && notUsed && hasValidReps
            })

            console.log(
                `Найдено ${matchingExercises.length} подходящих упражнений для паттерна "${patternExercise.exerciseLevel}":`,
                matchingExercises
            )

            if (matchingExercises.length === 0) {
                console.warn('Нет подходящих упражнений для:', patternExercise)
                continue
            }

            const found = tryFindExercise(
                matchingExercises,
                patternExercise.repetitionLevel,
                gender.value,
                usedExerciseIds.value,
                100
            )

            if (!found) {
                console.warn('Не удалось подобрать упражнение для:', patternExercise)
                continue
            }

            console.log(
                'Подобрано упражнение:',
                found.exercise.name,
                'повторения:',
                found.reps,
                'подходы:',
                found.sets
            )

            usedExerciseIds.value.add(found.exercise._id)

            workout.push({
                _id: found.exercise._id,
                name: found.exercise.name,
                sets: found.sets,
                reps: found.reps
            })
        }

        if (workout.length === 0) {
            showSnackbar('Тренировка не сгенерирована. Попробуйте другие параметры.', 'error')
            console.log('Тренировка не сгенерирована. Нет подходящих упражнений.')
        }

        workoutResults.value = workout
        console.log('Результаты тренировки:', workoutResults.value)

        // СТАРЫЙ МЕХАНИЗМ (таймер на 3 секунды) — не удаляем:
        timer.value = 3
        intervalId.value = window.setInterval(() => {
            timer.value--
            if (timer.value <= 0 && intervalId.value !== null) {
                window.clearInterval(intervalId.value)
                intervalId.value = null
            }
        }, 1000)

        isGenerating.value = false
        showBottomSheet.value = true
    }

    function removeExercise(index: number): void {
        const ex = workoutResults.value[index]
        if (ex && ex._id) {
            usedExerciseIds.value.delete(ex._id)
        }
        workoutResults.value.splice(index, 1)
    }

    function regenerateExercise(index: number): void {
        if (!selectedPattern.value) {
            console.warn('Паттерн не выбран.')
            return
        }
        const patternExercise = selectedPattern.value.exercises[index]
        const oldEx = workoutResults.value[index]
        if (oldEx && oldEx._id) {
            usedExerciseIds.value.delete(oldEx._id)
        }

        const mg = selectedPattern.value.muscleGroup.toLowerCase()
        const mm = selectedPattern.value.mainMuscle.toLowerCase()

        // Используем повторений именно из patternExercise, а не из e
        const normalizedRepetitionLevel = patternExercise.repetitionLevel
            .toLowerCase()
            .replace('ё', 'е')
        const mappedLevel = levelMapping[normalizedRepetitionLevel]

        // Если вдруг уровень не распознан, ничего не делаем
        if (!mappedLevel) {
            console.warn(`Неизвестный уровень повторений: "${patternExercise.repetitionLevel}".`)
            return
        }

        const repsKey = `${
            gender.value === 'Мужчина' ? 'male' : 'female'
        }Reps${capitalize(mappedLevel)}` as keyof Exercise

        const matchingExercises = exercises.value.filter((e) => {
            if (!e.category || !e.mainMuscle) return false

            const catMatch = e.category.toLowerCase() === mg
            const mmToFind = mm
            const mmMatch =
                e.mainMuscle.toLowerCase() === mmToFind ||
                e.additionalMuscles.toLowerCase().includes(mmToFind)

            const notUsed = !usedExerciseIds.value.has(e._id)
            const hasValidReps = e[repsKey] && e[repsKey] !== '—'

            return catMatch && mmMatch && notUsed && hasValidReps
        })

        if (matchingExercises.length === 0) {
            console.warn('Нет подходящих упражнений для перегенерации:', patternExercise)
            return
        }

        const found = tryFindExercise(
            matchingExercises,
            patternExercise.repetitionLevel,
            gender.value,
            usedExerciseIds.value,
            100
        )
        if (!found) {
            console.warn('Не удалось подобрать новое упражнение:', patternExercise)
            return
        }

        usedExerciseIds.value.add(found.exercise._id)
        workoutResults.value[index] = {
            _id: found.exercise._id,
            name: found.exercise.name,
            sets: found.sets,
            reps: found.reps
        }
    }

    const standardRepsValues = [5, 6, 8, 10, 12, 15, 20, 30, 45, 60, 75, 90, 105, 120]

    function increaseReps(index: number): void {
        const ex = workoutResults.value[index]
        const current = ex.reps
        const idx = standardRepsValues.indexOf(current)
        let newReps
        if (idx !== -1 && idx < standardRepsValues.length - 1) {
            newReps = standardRepsValues[idx + 1]
        } else {
            newReps = current + 1
        }
        ex.reps = newReps
        ex.sets = getSets(ex.reps)
    }

    function decreaseReps(index: number): void {
        const ex = workoutResults.value[index]
        const current = ex.reps
        const idx = standardRepsValues.indexOf(current)
        let newReps
        if (idx > 0) {
            newReps = standardRepsValues[idx - 1]
        } else if (idx === 0) {
            newReps = current - 1
        } else {
            newReps = current - 1
        }
        if (newReps >= 1) {
            ex.reps = newReps
            ex.sets = getSets(ex.reps)
        }
    }

    return {
        generateWorkout,
        removeExercise,
        regenerateExercise,
        increaseReps,
        decreaseReps
    }
}
