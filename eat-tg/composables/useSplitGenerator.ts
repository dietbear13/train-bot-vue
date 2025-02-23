// ~/composables/useSplitGenerator.ts

import { ref, onMounted, type Ref } from 'vue'
import { useApi } from './useApi'
import { useUserStore } from '../stores/userStore'
import type { Exercise, RepetitionLevels } from './types'

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
// Здесь можно явно указать тип, чтобы TS не ругался на методы userStore.
const userStore: ReturnType<typeof useUserStore> = useUserStore()

const exercises = ref<Exercise[]>([]) // ожидаем массив

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
        console.warn(`⚠️ Неизвестный уровень нагрузки: "${loadLevel}"`)
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
    goal: string,
    maxTries: number = 500
): { exercise: Exercise; reps: number; sets: number } | null {
    let attempt = 0

    console.log('🔎 [tryFindExercise] Начинаем подбор упражнения...', {
        repetitionLevel,
        genderStr,
        goal
    })

    while (attempt < maxTries) {
        attempt++
        // Фильтруем упражнения, которые ещё не использованы
        const availableExercises = matchingExercises.filter(e => !usedIds.has(e._id))
        if (availableExercises.length === 0) {
            console.warn('⚠️ Нет доступных упражнений для подбора.')
            break
        }

        const selectedExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)]
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

        let chosenReps = repsArray[Math.floor(Math.random() * repsArray.length)]

        if (goal === 'Похудение') {
            const variants = [15, 20]
            chosenReps = variants[Math.floor(Math.random() * variants.length)]
        } else if (goal === 'Общие') {
            const variants = [8, 10, 12, 15]
            chosenReps = variants[Math.floor(Math.random() * variants.length)]
        } else if (goal === 'Массонабор') {
            const variants = [6, 8, 10, 12]
            chosenReps = variants[Math.floor(Math.random() * variants.length)]
        }

        const sets = getSets(chosenReps)

        console.log(`✅ [tryFindExercise] Успешно нашли упражнение: "${selectedExercise.name}" (reps=${chosenReps}, sets=${sets})`)
        return {
            exercise: selectedExercise,
            reps: chosenReps,
            sets
        }
    }

    console.warn('⚠️ [tryFindExercise] Не удалось подобрать упражнение за maxTries.')
    return null
}

// ======================= ГЕНЕРАЦИЯ УПРАЖНЕНИЙ ИЗ ПАТТЕРНА =======================
function generateExercisesFromPattern(
    pattern: string,
    gender: string,
    usedIdsInDay: Set<string>,
    allExercises: Exercise[],
    goal: string,
    maxTries: number = 55
): FoundExercise[] {
    // Логируем начало
    console.log(`🔧 [generateExercisesFromPattern] Обработка паттерна: "${pattern}"`)

    const exList: FoundExercise[] = []

    let chosenVariant = pattern
    if (pattern.includes('|')) {
        const splitted = pattern.split('|')
        chosenVariant = splitted[Math.floor(Math.random() * splitted.length)].trim()

        if (pattern.startsWith('ex:') && !chosenVariant.startsWith('ex:') && !chosenVariant.startsWith('pa:')) {
            chosenVariant = 'ex:' + chosenVariant
        } else if (pattern.startsWith('pa:') && !chosenVariant.startsWith('ex:') && !chosenVariant.startsWith('pa:')) {
            chosenVariant = 'pa:' + chosenVariant
        }
    }

    if (chosenVariant.startsWith('ex:')) {
        const criteria = chosenVariant.replace('ex:', '').trim()
        const [mainMuscle, difficultyLevel] = criteria.split(',').map(s => s.trim())

        if (!mainMuscle || !difficultyLevel) {
            console.warn(`⚠️ [generateExercisesFromPattern] Некорректные критерии ex: "${criteria}"`)
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
            goal,
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
        const criteria = chosenVariant.replace('pa:', '').trim()
        let timesToGenerate = 1
        let cleanedCriteria = criteria

        const bracketMatch = criteria.match(/\(\d+\)$/)
        if (bracketMatch) {
            timesToGenerate = parseInt(bracketMatch[0].replace(/\(|\)/g, ''), 10)
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

        for (let i = 0; i < timesToGenerate; i++) {
            const repetitionLevel = getRandomLoadLevel()
            const found = tryFindExercise(
                matchingExercises,
                repetitionLevel,
                gender,
                usedIdsInDay,
                goal,
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

function dayName(index: number): string {
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    return days[index % 7]
}

// ======================= ОСНОВНОЙ ХУК =======================
export default function useSplitGenerator(params: UseSplitGeneratorParams) {
    const finalPlan = ref<GeneratedDay[]>([])

    onMounted(async () => {
        // Проверка, есть ли уже упражнения в userStore
        if (!userStore.exercises.data || userStore.exercises.data.length === 0) {
            console.log('🔄 [useSplitGenerator] Упражнений нет — загружаем из API exercises...')
            const response = await apiRequest('GET', 'exercises')

            let loadedExercises: Exercise[] = []
            if (Array.isArray(response)) {
                loadedExercises = response
            } else if (
                response &&
                (response as any).data &&
                Array.isArray((response as any).data)
            ) {
                loadedExercises = (response as { data: Exercise[] }).data
            } else {
                loadedExercises = []
            }

            console.log(`🗂️ [useSplitGenerator] Загружено упражнений: ${loadedExercises.length}`)
            ;(userStore as any).setExercises(loadedExercises)
            exercises.value = loadedExercises
        } else {
            console.log('✅ [useSplitGenerator] Используем кешированные упражнения из userStore.')
            exercises.value = userStore.exercises.data
        }
    })

    /**
     * Генерация плана сплита с учётом пола, выбранного сплита, цели и фильтров по травмам.
     */
    async function generateSplitPlan(
        gender: string,
        chosenSplit: SplitItem,
        goal: string,
        finalPlanRef: Ref<GeneratedDay[]>,
        injuryFilters: InjuryFilters
    ) {
        console.log('🚀 [generateSplitPlan] Начинаем генерацию сплита...', {
            gender,
            goal,
            split: chosenSplit?.split
        })

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

            // Фильтруем (exclude) упражнения, где ограничения == true
            const filteredExercises = exercises.value.filter(e => {
                if (injuryFilters.spine && e.spineRestrictions) return false
                if (injuryFilters.knee && e.kneeRestrictions) return false
                if (injuryFilters.shoulder && e.shoulderRestrictions) return false
                return true
            })

            console.log('🎯 [generateSplitPlan] Фильтруем травмы...', injuryFilters)
            console.log(`🔍 [generateSplitPlan] Всего после фильтра: ${filteredExercises.length} упражнений`)

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

            console.log(`✅ [generateSplitPlan] Генерация завершена. Всего дней: ${finalPlanRef.value.length}`)
            params.showBottomSheet.value = true
        } catch (err: any) {
            console.error('💥 [generateSplitPlan] Ошибка в генерации:', err)
            params.errorMessages.value.push(`Ошибка генерации: ${err.message || err}`)
            params.showSnackbar(`Ошибка генерации: ${err.message || err}`, 'error')
        } finally {
            params.isLoading.value = false
            params.isGenerating.value = false
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

        console.log('📨 [sendWorkoutPlan] Отправляемый план тренировок:', plan)

        try {
            await apiRequest('post', 'send-detailed-plan', {
                userId: params.telegramUserId.value,
                plan: plan,
                splitName: params.selectedSplitRef.value?.split || '',
                splitComment: params.selectedSplitRef.value?.splitComment || ''
            })
            params.showSnackbar('Тренировка успешно отправлена!', 'success')
            console.log('✅ [sendWorkoutPlan] Успешно отправлено пользователю.')
        } catch (err) {
            console.error('💥 [sendWorkoutPlan] Ошибка при отправке тренировки:', err)
            params.showSnackbar('Не удалось отправить тренировку.', 'error')
        }
    }

    // ======================= Модификация плана =======================

    function removeExercise(dayIndex: number, exerciseIndex: number) {
        if (finalPlan.value[dayIndex] && finalPlan.value[dayIndex].exercises[exerciseIndex]) {
            const removed = finalPlan.value[dayIndex].exercises.splice(exerciseIndex, 1)[0]
            console.log(`🗑️ [removeExercise] Удалено упражнение: ${removed.name}`)
        }
    }

    /**
     * Перегенерация одного упражнения, с учётом injuryFilters.
     */
    function regenerateExercise(
        dayIndex: number,
        exerciseIndex: number,
        gender: string,
        finalPlanRef: Ref<GeneratedDay[]>,
        injuryFilters: InjuryFilters
    ) {
        console.log(`🔄 [regenerateExercise] Перегенерация упражнения в dayIndex=${dayIndex}, exIndex=${exerciseIndex}`)
        const day = finalPlanRef.value[dayIndex]
        if (!day) return

        const oldEx = day.exercises[exerciseIndex]
        if (!oldEx || !oldEx.originalPattern) return

        // Список использованных Id упражнений (кроме текущего)
        const usedIdsInDay = new Set<string>()
        day.exercises.forEach((ex, idx) => {
            if (idx !== exerciseIndex && ex._id) {
                usedIdsInDay.add(ex._id)
            }
        })

        // Фильтруем весь список упражнений по injuryFilters
        const filteredExercises = exercises.value.filter(e => {
            if (injuryFilters.spine && e.spineRestrictions) return false
            if (injuryFilters.knee && e.kneeRestrictions) return false
            if (injuryFilters.shoulder && e.shoulderRestrictions) return false
            return true
        })

        const newExList = generateExercisesFromPattern(
            oldEx.originalPattern,
            gender,
            usedIdsInDay,
            filteredExercises,
            '',
            10000
        )

        if (newExList.length > 0) {
            day.exercises[exerciseIndex] = newExList[0]
            console.log(`✨ [regenerateExercise] Упражнение перегенерировано: ${newExList[0].name}`)
        } else {
            console.warn('⚠️ [regenerateExercise] Не удалось перегенерировать упражнение.')
        }
    }

    /**
     * Перегенерация всего дня (можно было бы тоже учитывать фильтры).
     * Не вызывается напрямую в текущем коде, но оставим для примера.
     */
    function regenerateDayPlan(dayIndex: number, gender: string, finalPlanRef: Ref<GeneratedDay[]>, injuryFilters: InjuryFilters) {
        console.log(`🔁 [regenerateDayPlan] Перегенерация целого дня: dayIndex=${dayIndex}`)
        const day = finalPlanRef.value[dayIndex]
        if (!day || !day.patternOrExercise) return

        const exList: FoundExercise[] = []
        const usedIdsInDay = new Set<string>()

        // Фильтруем весь список по injuryFilters
        const filteredExercises = exercises.value.filter(e => {
            if (injuryFilters.spine && e.spineRestrictions) return false
            if (injuryFilters.knee && e.kneeRestrictions) return false
            if (injuryFilters.shoulder && e.shoulderRestrictions) return false
            return true
        })

        for (const pat of day.patternOrExercise) {
            const result = generateExercisesFromPattern(
                pat,
                gender,
                usedIdsInDay,
                filteredExercises,
                '',
                10000
            )
            exList.push(...result)
        }

        day.exercises = exList
        console.log('✅ [regenerateDayPlan] День перегенерирован:', day)
    }

    function increaseReps(dayIndex: number, exerciseIndex: number) {
        const ex = finalPlan.value[dayIndex]?.exercises[exerciseIndex]
        if (ex) {
            ex.reps++
            console.log(`⬆️ [increaseReps] reps=${ex.reps} у упражнения "${ex.name}"`)
        }
    }

    function decreaseReps(dayIndex: number, exerciseIndex: number) {
        const ex = finalPlan.value[dayIndex]?.exercises[exerciseIndex]
        if (ex && ex.reps > 1) {
            ex.reps--
            console.log(`⬇️ [decreaseReps] reps=${ex.reps} у упражнения "${ex.name}"`)
        }
    }

    function increaseSets(dayIndex: number, exerciseIndex: number) {
        const ex = finalPlan.value[dayIndex]?.exercises[exerciseIndex]
        if (ex) {
            ex.sets++
            console.log(`🆙 [increaseSets] sets=${ex.sets} у упражнения "${ex.name}"`)
        }
    }

    function decreaseSets(dayIndex: number, exerciseIndex: number) {
        const ex = finalPlan.value[dayIndex]?.exercises[exerciseIndex]
        if (ex && ex.sets > 1) {
            ex.sets--
            console.log(`🔽 [decreaseSets] sets=${ex.sets} у упражнения "${ex.name}"`)
        }
    }

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
