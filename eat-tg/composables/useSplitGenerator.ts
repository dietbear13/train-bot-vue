// ~/composables/useSplitGenerator.ts
import { ref, onMounted, type Ref } from 'vue'
import { useApi } from './useApi'
import { useUserStore } from '../stores/userStore'
import { Exercise, RepetitionLevels } from './types'

// ======================= Интерфейсы =======================
interface FoundExercise {
    _id: string
    name: string
    sets: number
    reps: number
    originalPattern?: string
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
    difficultyLevelSplit?: number
}

interface GeneratedDay {
    dayName: string
    exercises: FoundExercise[]
    patternOrExercise?: string[]
}

interface UseSplitGeneratorParams {
    isLoading: Ref<boolean>
    isGenerating: Ref<boolean>
    showBottomSheet: Ref<boolean>
    errorMessages: Ref<string[]>
    showSnackbar: (msg: string, color?: string) => void
    telegramUserId: Ref<number | null | undefined>
    selectedSplitRef: Ref<SplitItem | null>
}

// Интерфейс для фильтров травм
export interface InjuryFilters {
    spine: boolean
    knee: boolean
    shoulder: boolean
}

// ======================= Основные зависимости =======================
const { apiRequest } = useApi()
const userStore = useUserStore()
const exercises = ref<Exercise[]>([])

// ======================= Константы и вспомогательные =======================
const levelMapping: { [key: string]: string } = {
    'лёгкая': 'Light',
    'легкая': 'Light',
    'средняя': 'Medium',
    'тяжёлая': 'Heavy',
    'тяжелая': 'Heavy'
}

/** Капитализация строки (для составления ключей: maleRepsLight и т.п.) */
function capitalize(str: string): string {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

/** Количество подходов в зависимости от reps */
function getSets(reps: number): number {
    if (reps === 5) return 5
    if (reps === 6 || reps === 8) return 4
    if (reps === 10 || reps === 12 || reps === 15 || reps === 20) return 3
    return 3
}

/** Случайный уровень нагрузки */
function getRandomLoadLevel(): string {
    const r = Math.random()
    if (r < 0.5) return 'средняя'
    else if (r < 0.75) return 'лёгкая'
    else return 'тяжёлая'
}

/** Возвращает строку (например "5,10,12") для выбранного упражнения, пола и нагрузки */
function getRepsOptions(
    exercise: Exercise,
    repetitionLevel: string,
    genderStr: string,
    loadLevel: string
): string | null {
    const normalizedLoadLevel = loadLevel.toLowerCase().replace('ё', 'е')
    const mappedLevel = levelMapping[normalizedLoadLevel]
    if (!mappedLevel) {
        console.warn(`Неизвестный уровень нагрузки: "${loadLevel}"`)
        return null
    }
    // maleRepsLight / femaleRepsLight / etc.
    const repsKey = `${genderStr === 'Мужчина' ? 'male' : 'female'}Reps${capitalize(mappedLevel)}` as keyof RepetitionLevels
    const repsValue = (exercise as any)[repsKey]
    if (!repsValue || repsValue === '—') {
        return null
    }
    return repsValue
}

// ======================= ЛОГИКА ПОДБОРА УПРАЖНЕНИЯ =======================
function tryFindExercise(
    matchingExercises: Exercise[],
    repetitionLevel: string,
    genderStr: string,
    usedIds: Set<string>,
    goal: string,              // <-- Добавили goal
    maxTries: number = 500
): { exercise: Exercise; reps: number; sets: number } | null {
    let attempt = 0

    while (attempt < maxTries) {
        attempt++
        // Фильтруем упражнения, которые ещё не использованы
        const availableExercises = matchingExercises.filter(e => !usedIds.has(e._id))
        if (availableExercises.length === 0) {
            console.warn('Нет доступных упражнений для подбора.')
            break
        }

        // Случайная выборка
        const selectedExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)]
        // Случайный уровень нагрузки
        const randomLoad = getRandomLoadLevel()

        // Получаем список повторений, например "5,8,10"
        const repsOptions = getRepsOptions(selectedExercise, repetitionLevel, genderStr, randomLoad)
        if (!repsOptions) {
            continue
        }

        const repsArray = repsOptions
            .split(',')
            .map(num => parseInt(num, 10))
            .filter(n => !isNaN(n))

        if (repsArray.length === 0) {
            continue
        }

        // Случайно берём один вариант из массива
        let chosenReps = repsArray[Math.floor(Math.random() * repsArray.length)]

        // === ДОБАВЛЯЕМ ЛОГИКУ ДЛЯ goal ===
        if (goal === 'Похудение') {
            // Похудение: случайно 15 или 20
            const variants = [15, 20]
            chosenReps = variants[Math.floor(Math.random() * variants.length)]
        } else if (goal === 'Общие') {
            // Общие: случайно от 6 до 15
            const variants = [8, 10, 12, 15]
            chosenReps = variants[Math.floor(Math.random() * variants.length)]
        } else if (goal === 'Массонабор') {
            // Массонабор: случайно от 6 до 12
            const variants = [6, 8, 10, 12]
            chosenReps = variants[Math.floor(Math.random() * variants.length)]
        }

        const sets = getSets(chosenReps)

        return {
            exercise: selectedExercise,
            reps: chosenReps,
            sets
        }
    }

    return null
}

// ======================= ГЕНЕРАЦИЯ УПРАЖНЕНИЙ ИЗ ПАТТЕРНА =======================
function generateExercisesFromPattern(
    pattern: string,
    gender: string,
    usedIdsInDay: Set<string>,
    allExercises: Exercise[],
    goal: string,      // <-- прокидываем goal
    maxTries: number = 55
): FoundExercise[] {
    const exList: FoundExercise[] = []

    // Если есть '|' — значит несколько вариантов
    let chosenVariant = pattern
    if (pattern.includes('|')) {
        const splitted = pattern.split('|')
        chosenVariant = splitted[Math.floor(Math.random() * splitted.length)].trim()

        // Следим за префиксами ex: / pa:
        if (pattern.startsWith('ex:') && !chosenVariant.startsWith('ex:') && !chosenVariant.startsWith('pa:')) {
            chosenVariant = 'ex:' + chosenVariant
        } else if (pattern.startsWith('pa:') && !chosenVariant.startsWith('ex:') && !chosenVariant.startsWith('pa:')) {
            chosenVariant = 'pa:' + chosenVariant
        }
    }

    if (chosenVariant.startsWith('ex:')) {
        // ex:широчайшая мышца,средняя
        const criteria = chosenVariant.replace('ex:', '').trim()
        const [mainMuscle, difficultyLevel] = criteria.split(',').map(s => s.trim())

        if (!mainMuscle || !difficultyLevel) {
            console.warn(`Некорректные критерии ex: "${criteria}"`)
            exList.push({
                _id: '',
                name: `Некорректные критерии: ${criteria}`,
                sets: 0,
                reps: 0,
                originalPattern: pattern
            })
            return exList
        }

        const matchingExercises = allExercises.filter(e => {
            return (
                e.mainMuscle.toLowerCase() === mainMuscle.toLowerCase() &&
                e.difficultyLevel.toLowerCase() === difficultyLevel.toLowerCase()
            )
        })

        if (matchingExercises.length === 0) {
            exList.push({
                _id: '',
                name: `Нет упражнений для ${criteria}`,
                sets: 0,
                reps: 0,
                originalPattern: pattern
            })
            return exList
        }

        const repetitionLevel = getRandomLoadLevel()
        const found = tryFindExercise(
            matchingExercises,
            repetitionLevel,
            gender,
            usedIdsInDay,
            goal, // <-- передаём goal
            maxTries
        )

        if (!found) {
            exList.push({
                _id: '',
                name: `Не удалось подобрать для ${criteria}`,
                sets: 0,
                reps: 0,
                originalPattern: pattern
            })
            return exList
        }

        usedIdsInDay.add(found.exercise._id)
        exList.push({
            _id: found.exercise._id,
            name: found.exercise.name,
            sets: found.sets,
            reps: found.reps,
            originalPattern: pattern
        })
    } else if (chosenVariant.startsWith('pa:')) {
        // pa:спина,широчайшая мышца(2)
        const criteria = chosenVariant.replace('pa:', '').trim()
        let timesToGenerate = 1
        let cleanedCriteria = criteria

        // Если есть (2)
        const bracketMatch = criteria.match(/\((\d+)\)$/)
        if (bracketMatch) {
            timesToGenerate = parseInt(bracketMatch[1], 10)
            cleanedCriteria = criteria.replace(/\(\d+\)$/, '').trim()
        }

        const [category, mm] = cleanedCriteria.split(',').map(s => s.trim().toLowerCase())
        if (!category || !mm) {
            exList.push({
                _id: '',
                name: `Некорректные критерии PA: ${criteria}`,
                sets: 0,
                reps: 0,
                originalPattern: pattern
            })
            return exList
        }

        const matchingExercises = allExercises.filter(e => {
            return (
                e.category.toLowerCase() === category &&
                e.mainMuscle.toLowerCase() === mm &&
                !usedIdsInDay.has(e._id)
            )
        })

        if (matchingExercises.length === 0) {
            exList.push({
                _id: '',
                name: `Нет PA-упражнений для ${criteria}`,
                sets: 0,
                reps: 0,
                originalPattern: pattern
            })
            return exList
        }

        // Нужно timesToGenerate раз
        for (let i = 0; i < timesToGenerate; i++) {
            const repetitionLevel = getRandomLoadLevel()
            const found = tryFindExercise(
                matchingExercises,
                repetitionLevel,
                gender,
                usedIdsInDay,
                goal, // <-- передаём goal
                maxTries
            )
            if (!found) {
                exList.push({
                    _id: '',
                    name: `Не подобрано PA-упражнение ${cleanedCriteria}`,
                    sets: 0,
                    reps: 0,
                    originalPattern: pattern
                })
                continue
            }
            usedIdsInDay.add(found.exercise._id)
            exList.push({
                _id: found.exercise._id,
                name: found.exercise.name,
                sets: found.sets,
                reps: found.reps,
                originalPattern: pattern
            })
        }
    } else {
        // Неизвестный префикс
        exList.push({
            _id: '',
            name: `Неизвестный тип: ${chosenVariant}`,
            sets: 3,
            reps: 10,
            originalPattern: pattern
        })
    }

    return exList
}

/** Названия дней недели (0..6) */
function dayName(index: number): string {
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    return days[index % 7]
}

// ======================= ОСНОВНОЙ ХУК =======================
export default function useSplitGenerator(params: UseSplitGeneratorParams) {
    const finalPlan = ref<GeneratedDay[]>([])

    // При монтировании загружаем упражнения
    /**
     * Генерация плана сплита с учётом пола, выбранного сплита, цели и фильтров по травмам.
     *
     * @param gender - выбранный пол
     * @param chosenSplit - выбранный сплит
     * @param goal - цель тренировок
     * @param finalPlanRef - ссылка на финальный план
     * @param injuryFilters - фильтры по травмам (исключаем упражнения с ограничениями)
     */
    async function generateSplitPlan(
        gender: string,
        chosenSplit: SplitItem,
        goal: string,
        injuryFilters: InjuryFilters,
    finalPlanRef: Ref<GeneratedDay[]>
    ) {
        params.errorMessages.value = []
        if (!chosenSplit) {
            params.errorMessages.value.push('Не выбран сплит.')
            params.showSnackbar('Не выбран сплит.', 'error')
            return
        }

        params.isLoading.value = true
        params.isGenerating.value = true

        try {
            const matchDays = chosenSplit.splitDays.match(/^(\d+)\(([^)]+)\)/)
            if (!matchDays) {
                params.errorMessages.value.push(`Некорректное поле splitDays: ${chosenSplit.splitDays}`)
                params.showSnackbar(`Некорректное поле splitDays: ${chosenSplit.splitDays}`, 'error')
                return
            }
            const dayNamesStr = matchDays[2]
            const dayNamesArr = dayNamesStr.split(',').map(s => s.trim().toLowerCase())

            // 7 дней (пн..вс)
            const weekDays = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']

            // Очищаем предыдущий результат
            finalPlanRef.value = []

            console.log('🚨 exercises.value:', exercises.value);


            // Фильтруем упражнения согласно выбранным фильтрам по травмам
            const filteredExercises = exercises.value.filter(e => {
                if (injuryFilters.spine && e.spineRestrictions) return false
                if (injuryFilters.knee && e.kneeRestrictions) return false
                if (injuryFilters.shoulder && e.shoulderRestrictions) return false
                return true
            })

            console.log('🚨 filteredExercises:', filteredExercises);

            // Для чередования паттернов
            let patternIndex = 0

            for (let i = 0; i < weekDays.length; i++) {
                const currentDay = weekDays[i]

                if (dayNamesArr.includes(currentDay)) {
                    const maxIndex = chosenSplit.days.length
                    if (maxIndex === 0) {
                        finalPlanRef.value.push({ dayName: dayName(i), exercises: [] })
                        continue
                    }

                    const safeIndex = patternIndex % maxIndex
                    patternIndex++

                    const currentPatternDay = chosenSplit.days[safeIndex]
                    if (!currentPatternDay) {
                        finalPlanRef.value.push({ dayName: dayName(i), exercises: [] })
                        continue
                    }

                    const exList: FoundExercise[] = []
                    const usedIdsInDay = new Set<string>()

                    // Генерируем все упражнения для данного дня, используя отфильтрованный список
                    for (const pat of currentPatternDay.patternOrExercise) {
                        const result = generateExercisesFromPattern(
                            pat,
                            gender,
                            usedIdsInDay,
                            filteredExercises,
                            goal,
                            10000
                        )
                        exList.push(...result)
                    }

                    finalPlanRef.value.push({
                        dayName: dayName(i),
                        exercises: exList,
                        patternOrExercise: currentPatternDay.patternOrExercise
                    })
                } else {
                    // День отдыха
                    finalPlanRef.value.push({
                        dayName: dayName(i),
                        exercises: []
                    })
                }
            }

            // Показываем BottomSheet
            params.showBottomSheet.value = true
        } catch (err: any) {
            console.error('Ошибка в generateSplitPlan:', err)
            params.errorMessages.value.push(`Ошибка генерации: ${err.message || err}`)
            params.showSnackbar(`Ошибка генерации: ${err.message || err}`, 'error')
        } finally {
            params.isLoading.value = false
            params.isGenerating.value = false
        }
    }

    onMounted(async () => {
        if (userStore.exercises.length === 0) {
            console.log('🔄 Загружаем упражнения с API...')
            const data = await apiRequest<Exercise[]>('get', 'exercises')
            userStore.setExercises(data)
            exercises.value = data
        } else {
            console.log('✅  Используем кешированные упражнения.')
        }
    })

    async function loadExercises() {
        try {
            const data = await apiRequest<Exercise[]>('get', 'exercises')
            exercises.value = data
        } catch (err) {
            console.error('Ошибка при загрузке упражнений:', err)
        }
    }

    /**
     * Отправка готового плана в Telegram непосредственно в чат пользователю.
     */
    async function sendWorkoutPlan(plan: GeneratedDay[]) {
        if (!params.telegramUserId.value) {
            params.showSnackbar('Не указан Telegram ID.', 'error')
            return
        }

        console.log('Отправляемый план тренировок (из finalPlan):', plan)

        try {
            await apiRequest('post', 'send-detailed-plan', {
                userId: params.telegramUserId.value,
                plan: plan,
                splitName: params.selectedSplitRef.value?.split || '',
                splitComment: params.selectedSplitRef.value?.splitComment || ''
            })
            params.showSnackbar('Тренировка успешно отправлена!', 'success')
        } catch (err) {
            console.error('Ошибка при отправке тренировки:', err)
            params.showSnackbar('Не удалось отправить тренировку.', 'error')
        }
    }

    // ======================= Модификация плана =======================
    function removeExercise(dayIndex: number, exerciseIndex: number) {
        if (finalPlan.value[dayIndex] && finalPlan.value[dayIndex].exercises[exerciseIndex]) {
            const removed = finalPlan.value[dayIndex].exercises.splice(exerciseIndex, 1)[0]
            console.log(`Удалено упражнение: ${removed.name}`)
        }
    }

    /** Перегенерация одного упражнения (по тому же originalPattern) */
    function regenerateExercise(
        dayIndex: number,
        exerciseIndex: number,
        gender: string,
        finalPlanRef: Ref<GeneratedDay[]>
    ) {
        const day = finalPlanRef.value[dayIndex]
        if (!day) return

        const oldEx = day.exercises[exerciseIndex]
        if (!oldEx || !oldEx.originalPattern) return

        const usedIdsInDay = new Set<string>()
        day.exercises.forEach((ex, idx) => {
            if (idx !== exerciseIndex && ex._id) {
                usedIdsInDay.add(ex._id)
            }
        })

        // Генерируем новое упражнение
        const newExList = generateExercisesFromPattern(
            oldEx.originalPattern,
            gender,
            usedIdsInDay,
            exercises.value,
            '', // goal можно передавать, если нужно
            255
        )

        if (newExList.length > 0) {
            day.exercises[exerciseIndex] = newExList[0]
        }
    }

    /** Перегенерация всего дня заново */
    function regenerateDayPlan(dayIndex: number, gender: string) {
        const day = finalPlan.value[dayIndex]
        if (!day || !day.patternOrExercise) return

        const exList: FoundExercise[] = []
        const usedIdsInDay = new Set<string>()

        for (const pat of day.patternOrExercise) {
            const result = generateExercisesFromPattern(
                pat,
                gender,
                usedIdsInDay,
                exercises.value,
                '',
                255
            )
            exList.push(...result)
        }

        day.exercises = exList
    }

    // Пример увеличения/уменьшения повторений
    function increaseReps(dayIndex: number, exerciseIndex: number) {
        const ex = finalPlan.value[dayIndex]?.exercises[exerciseIndex]
        if (ex) {
            ex.reps++
        }
    }
    function decreaseReps(dayIndex: number, exerciseIndex: number) {
        const ex = finalPlan.value[dayIndex]?.exercises[exerciseIndex]
        if (ex && ex.reps > 1) {
            ex.reps--
        }
    }
    function increaseSets(dayIndex: number, exerciseIndex: number) {
        const ex = finalPlan.value[dayIndex]?.exercises[exerciseIndex]
        if (ex) {
            ex.sets++
        }
    }
    function decreaseSets(dayIndex: number, exerciseIndex: number) {
        const ex = finalPlan.value[dayIndex]?.exercises[exerciseIndex]
        if (ex && ex.sets > 1) {
            ex.sets--
        }
    }

    // ======================= Возвращаем из хука =======================
    return {
        finalPlan,
        generateSplitPlan,
        sendWorkoutPlan,

        removeExercise,
        regenerateExercise,
        regenerateDayPlan,

        increaseReps,
        decreaseReps,
        increaseSets,
        decreaseSets
    }
}
