// ~/composables/useWorkoutGenerator.ts

import { ref } from 'vue'
import type { Ref } from 'vue'
import axios from 'axios'
import type { AxiosRequestConfig, Method } from 'axios'

// Интерфейсы
interface RepetitionLevels {
    maleRepsLight: string
    maleRepsMedium: string
    maleRepsHeavy: string
    femaleRepsLight: string
    femaleRepsMedium: string
    femaleRepsHeavy: string
}

export interface Exercise extends RepetitionLevels {
    _id: string
    category: string
    subcategory: string
    mainMuscle: string
    additionalMuscles: string
    difficultyLevel: string
    name: string
    equipment: string
}

interface PatternExercise {
    muscleGroup: string
    subcategory: string
    mainMuscle: string
    exercise: string
    _id?: string
}

export interface Pattern {
    _id: string
    gender: string // "мужчина", "женщина", "мужчина,женщина"
    complexNumber: number
    exerciseLevel?: string
    exercises: PatternExercise[]
}

export interface WorkoutResult {
    _id: string
    name: string
    sets: number
    reps: number
}

export interface SnackbarState {
    show: boolean
    message: string
    color: string
    timeout: number
}

const primaryBaseURL = 'https://fit-server-bot.ru.tuna.am/api/'
const fallbackBaseURL = 'http://localhost:3002/api/'

// Общая функция для запросов
async function apiRequest<T>(
    method: Method,
    endpoint: string,
    data?: any,
    params?: any
): Promise<T> {
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
    } catch (error) {
        console.warn(`Основной сервер не доступен: ${error}. Переключение на резервный сервер.`)
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

// Функция для случайного выбора Light/Medium/Heavy:
//  - 25% Light
//  - 50% Medium
//  - 25% Heavy
function getRandomLoadLevel(): string {
    const r = Math.random()
    if (r < 0.25) {
        return 'Light'
    } else if (r < 0.75) {
        return 'Medium'
    } else {
        return 'Heavy'
    }
}

// Базовые значения повторений (для ручного + / -)
const standardRepsValues = [5, 6, 8, 10, 12, 15, 20]

// Хелперы
function capitalize(str: string): string {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function getSets(reps: number): number {
    if (reps === 5) return 5
    if ([6, 8].includes(reps)) return 4
    if ([10, 12, 15, 20].includes(reps)) return 3
    return 3
}

export function useWorkoutGenerator() {
    // Состояние
    const exercises = ref<Exercise[]>([])
    const patterns = ref<Pattern[]>([])
    const workoutResults = ref<WorkoutResult[]>([])

    const usedExerciseIds = ref<Set<string>>(new Set())

    const isGenerating = ref(false)
    const timer = ref(0)
    let intervalId: number | null = null

    const showBottomSheet = ref(false)
    const selectedPattern = ref<Pattern | null>(null)

    const snackbar = ref<SnackbarState>({
        show: false,
        message: '',
        color: 'info',
        timeout: 3000
    })

    // Уведомления
    const showSnackbar = (message: string, color: string = 'info') => {
        snackbar.value.message = message
        snackbar.value.color = color
        snackbar.value.show = true
    }

    // Загрузка упражнений
    async function loadExercises() {
        try {
            const data = await apiRequest<Exercise[]>('get', 'exercises')
            exercises.value = data
            console.log('Упражнения:', exercises.value)
            return exercises.value // если нужно вернуть
        } catch (err) {
            console.error('Ошибка при загрузке упражнений:', err)
            showSnackbar('Ошибка при загрузке упражнений', 'error')
            throw err
        }
    }

    // Загрузка паттернов
    async function loadPatterns() {
        try {
            const data = await apiRequest<Pattern[]>('get', 'patterns')
            patterns.value = data
            console.log('Паттерны:', patterns.value)
            return patterns.value // если нужно вернуть
        } catch (err) {
            console.error('Ошибка при загрузке паттернов:', err)
            showSnackbar('Ошибка при загрузке паттернов', 'error')
            throw err
        }
    }

    // Генерация
    function generateWorkout(gender: string, muscleGroup: string, muscleSubgroup: string) {
        if (isGenerating.value || timer.value > 0) return
        if (!gender || !muscleGroup || !muscleSubgroup) {
            showSnackbar('Пожалуйста, заполните все поля', 'error')
            return
        }

        isGenerating.value = true
        workoutResults.value = []
        usedExerciseIds.value.clear()

        // Фильтруем паттерны по полу и мышечной группе (complexNumber)
        const filtered = patterns.value.filter((p) => {
            const userGenderLower = gender.trim().toLowerCase()
            const patternGenders = p.gender
                .split(',')
                .map(g => g.trim().toLowerCase())
            const isGenderOk = patternGenders.includes(userGenderLower)

            return (
                isGenderOk &&
                p.complexNumber === Number(muscleGroup.trim())
            )
        })

        if (!filtered.length) {
            showSnackbar('Подходящий паттерн не найден', 'error')
            isGenerating.value = false
            return
        }

        // Выбираем случайный паттерн из отфильтрованных
        const pattern = filtered[Math.floor(Math.random() * filtered.length)]
        selectedPattern.value = pattern
        console.log('Выбранный паттерн:', pattern)

        const resultArr: WorkoutResult[] = []

        for (const pEx of pattern.exercises) {
            // Подбираем упражнения, соответствующие выбранной подгруппе мышц
            const match = exercises.value.filter((e) => {
                const categoryMatch = e.category.toLowerCase() === pEx.muscleGroup.toLowerCase()
                const mainMuscleMatch = e.mainMuscle.toLowerCase() === pEx.mainMuscle.toLowerCase()

                // Проверяем, соответствует ли дополнительная мышца выбранной подгруппе
                const additionalMuscleMatch = e.additionalMuscles
                    .toLowerCase()
                    .split(',')
                    .map(m => m.trim())
                    .includes(muscleSubgroup.toLowerCase())

                return (
                    categoryMatch &&
                    mainMuscleMatch &&
                    additionalMuscleMatch &&
                    !usedExerciseIds.value.has(e._id)
                )
            })

            if (!match.length) {
                console.warn(`Нет подходящих упражнений для: ${pEx.mainMuscle} с подгруппой мышцы: ${muscleSubgroup}`)
                continue
            }

            const selectedExercise = match[Math.floor(Math.random() * match.length)]
            usedExerciseIds.value.add(selectedExercise._id)

            // Генерация повторений с заданными вероятностями
            const randomLoadLevel = getRandomLoadLevel()
            const repsKey = `${
                gender.toLowerCase() === 'мужчина' ? 'male' : 'female'
            }Reps${capitalize(randomLoadLevel)}` as keyof RepetitionLevels

            const repsOpt = selectedExercise[repsKey]
            if (!repsOpt) {
                console.warn(`Нет подходящего поля повторений: ${repsKey} у упражнения ${selectedExercise.name}`)
                continue
            }

            let reps: number
            if (repsOpt.includes('сек')) {
                const matchReps = repsOpt.match(/\d+/)
                if (matchReps) {
                    reps = parseInt(matchReps[0], 10)
                } else {
                    console.warn(`Не удалось распарсить reps из "${repsOpt}" у "${selectedExercise.name}"`)
                    continue
                }
            } else {
                const repNums = repsOpt
                    .split(',')
                    .map(n => parseInt(n.trim(), 10))
                    .filter(num => !isNaN(num))
                if (!repNums.length) {
                    console.warn(`Нет корректных повторений в "${repsOpt}" для упражнения: ${selectedExercise.name}`)
                    continue
                }
                reps = repNums[Math.floor(Math.random() * repNums.length)]
            }

            const sets = getSets(reps)

            resultArr.push({
                _id: selectedExercise._id,
                name: selectedExercise.name,
                sets,
                reps
            })
        }

        workoutResults.value = resultArr
        console.log('Сгенерированный workout:', workoutResults.value)
        if (!workoutResults.value.length) {
            showSnackbar('Тренировка пуста', 'error')
        }

        // Таймер "задержки" перед повторной генерацией
        timer.value = 3
        intervalId = window.setInterval(() => {
            timer.value--
            if (timer.value <= 0 && intervalId !== null) {
                window.clearInterval(intervalId)
                intervalId = null
            }
        }, 1000)

        isGenerating.value = false
        showBottomSheet.value = true
    }

    // Удаление одного упражнения
    function removeExercise(index: number) {
        const ex = workoutResults.value[index]
        if (ex) {
            usedExerciseIds.value.delete(ex._id)
            workoutResults.value.splice(index, 1)
        }
    }

    // Перегенерация одного упражнения
    function regenerateExercise(index: number, gender: string) {
        if (!selectedPattern.value) return
        const oldEx = workoutResults.value[index]
        if (!oldEx) return

        usedExerciseIds.value.delete(oldEx._id)
        const pEx = selectedPattern.value.exercises[index]

        const match = exercises.value.filter((e) => {
            // e.category === muscleGroup, e.mainMuscle === mainMuscle
            const categoryMatch = e.category.toLowerCase() === pEx.muscleGroup.toLowerCase()
            const mainMuscleMatch = e.mainMuscle.toLowerCase() === pEx.mainMuscle.toLowerCase()
            const difficultyMatch = e.difficultyLevel.toLowerCase() === pEx.exercise.toLowerCase()

            // Дополнительная фильтрация по additionalMuscles
            const requiredAdditionalMuscles = pEx.exercise.split(',').map(m => m.trim().toLowerCase())
            const additionalMuscleMatch = requiredAdditionalMuscles.some(reqMuscle =>
                e.additionalMuscles.toLowerCase().split(',').map(m => m.trim()).includes(reqMuscle)
            )

            return (
                categoryMatch &&
                mainMuscleMatch &&
                difficultyMatch &&
                additionalMuscleMatch &&
                !usedExerciseIds.value.has(e._id)
            )
        })

        if (!match.length) {
            console.warn(`Нет подходящих упражнений для перегенерации: ${pEx.mainMuscle} с дополнительными мышцами: ${pEx.exercise}`)
            return
        }

        const newEx = match[Math.floor(Math.random() * match.length)]
        usedExerciseIds.value.add(newEx._id)

        // Генерация повторений
        const randomLoadLevel = getRandomLoadLevel()
        const repsKey = `${
            gender.toLowerCase() === 'мужчина' ? 'male' : 'female'
        }Reps${capitalize(randomLoadLevel)}` as keyof RepetitionLevels

        const repsOpt = newEx[repsKey]
        if (!repsOpt) {
            console.warn(`Нет поля повторений "${repsKey}" у упражнения "${newEx.name}"`)
            // Оставим старые sets/reps
            workoutResults.value[index] = {
                _id: newEx._id,
                name: newEx.name,
                sets: oldEx.sets,
                reps: oldEx.reps
            }
            return
        }

        let reps: number
        if (repsOpt.includes('сек')) {
            // Например, "45 сек" -> 45
            const matchReps = repsOpt.match(/\d+/)
            if (matchReps) {
                reps = parseInt(matchReps[0], 10)
            } else {
                console.warn(`Не удалось распарсить reps из "${repsOpt}" у "${newEx.name}"`)
                // Оставим старые sets/reps
                workoutResults.value[index] = {
                    _id: newEx._id,
                    name: newEx.name,
                    sets: oldEx.sets,
                    reps: oldEx.reps
                }
                return
            }
        } else {
            const repNums = repsOpt
                .split(',')
                .map(n => parseInt(n.trim(), 10))
                .filter(num => !isNaN(num))
            if (!repNums.length) {
                console.warn(`Нет корректных повторений в "${repsOpt}" у "${newEx.name}"`)
                // Оставим старые
                workoutResults.value[index] = {
                    _id: newEx._id,
                    name: newEx.name,
                    sets: oldEx.sets,
                    reps: oldEx.reps
                }
                return
            }
            reps = repNums[Math.floor(Math.random() * repNums.length)]
        }

        const sets = getSets(reps)

        workoutResults.value[index] = {
            _id: newEx._id,
            name: newEx.name,
            sets,
            reps
        }
    }

    // Увеличить/уменьшить повторения
    function increaseReps(index: number) {
        const item = workoutResults.value[index]
        const currentIndex = standardRepsValues.indexOf(item.reps)
        if (currentIndex >= 0 && currentIndex < standardRepsValues.length - 1) {
            item.reps = standardRepsValues[currentIndex + 1]
        } else {
            item.reps = item.reps + 1
        }
        item.sets = getSets(item.reps)
    }
    function decreaseReps(index: number) {
        const item = workoutResults.value[index]
        const currentIndex = standardRepsValues.indexOf(item.reps)
        if (currentIndex > 0) {
            item.reps = standardRepsValues[currentIndex - 1]
        } else {
            item.reps = Math.max(1, item.reps - 1)
        }
        item.sets = getSets(item.reps)
    }

    // Отправка тренировки
    async function sendWorkout(
        telegramUserId: number | null,
        muscleSubgroup: string,
        dateStr: string
    ) {
        if (!telegramUserId || !workoutResults.value.length) {
            showSnackbar('Нет userId или тренировка пуста', 'error')
            return
        }
        try {
            const workoutData = JSON.parse(JSON.stringify(workoutResults.value))
            await apiRequest('post', 'send-workout', {
                userId: telegramUserId,
                muscleGroup: muscleSubgroup,
                date: dateStr,
                workout: workoutData
            })
            showSnackbar('Тренировка отправлена', 'success')
        } catch (err) {
            console.error('Ошибка при отправке:', err)
            showSnackbar('Не удалось отправить тренировку', 'error')
        }
    }

    return {
        // State
        exercises,
        patterns,
        workoutResults,
        usedExerciseIds,
        isGenerating,
        timer,
        showBottomSheet,
        selectedPattern,
        snackbar,

        // Methods
        loadExercises,
        loadPatterns,
        generateWorkout,
        removeExercise,
        regenerateExercise,
        increaseReps,
        decreaseReps,
        sendWorkout,
        showSnackbar
    }
}
