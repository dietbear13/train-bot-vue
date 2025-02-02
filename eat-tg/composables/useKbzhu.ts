// composables/useKbzhu.ts
import { ref, computed, type Ref } from 'vue'
import {number} from "@telegram-apps/sdk";

// Интерфейсы для типов данных
interface KbzhuResult {
    calories: number
    extraCalories: number
    proteins: number
    fats: number
    carbs: number
}

interface FormData {
    gender: string
    bodyType: string
    age: number | null
    height: number | null
    weight: number | null
    goal: string
    workoutsPerWeek: number
}

export function useKbzhu() {
    // Внутренняя ref-переменная, где может быть и null, и результат
    const kbzhuResultRef = ref<KbzhuResult | null>(null)

    // Флаг, что идёт расчёт
    const isGenerating = ref(false)

    // Массив с ошибками
    const errorMessages = ref<string[]>([])

    /**
     * Основная функция расчёта КБЖУ.
     * @param formData — объект реактивных данных формы (gender, bodyType, height и т.д.)
     * @param showBottomSheet — ref, управляющий v-bottom-sheet (передаётся из компонента)
     * @param nextTick — из Vue, чтобы дождаться рендера перед построением диаграммы
     * @param updateMacroChart — функция, которая строит/обновляет диаграмму (она осталась в .vue)
     */
    const calculateKbzhu = async (
        formData: FormData,
        showBottomSheet: Ref<boolean>,
        nextTick: () => Promise<void>,
        updateMacroChart: () => void
    ) => {
        if (isGenerating.value) {
            return
        }

        // Сбрасываем первоначальные значения
        isGenerating.value = true
        errorMessages.value = []
        kbzhuResultRef.value = null

        // Разбираем необходимые переменные из formData
        // Если height (или weight, age) === null, используем NaN
        const gender = formData.gender.toLowerCase()
        const bodyType = formData.bodyType.toLowerCase()
        const goal = formData.goal.toLowerCase()
        const height = formData.height ?? NaN
        const weight = formData.weight ?? NaN
        const age = formData.age ?? NaN
        const workoutsPerWeek = formData.workoutsPerWeek

        // Сбор ошибок, если что-то не заполнено или некорректно
        if (!gender) {
            errorMessages.value.push('Выберите пол.')
        }
        if (!bodyType) {
            errorMessages.value.push('Выберите телосложение.')
        }
        if (!goal) {
            errorMessages.value.push('Выберите цель питания.')
        }
        if (isNaN(height) || height < 150 || height > 210) {
            errorMessages.value.push('Введите корректный рост (150-210 см).')
        }
        if (isNaN(weight) || weight < 40 || weight > 160) {
            errorMessages.value.push('Введите корректный вес (40-160 кг).')
        }
        if (isNaN(workoutsPerWeek) || workoutsPerWeek < 0 || workoutsPerWeek > 10) {
            errorMessages.value.push('Введите корректное число тренировок в неделю (0-10).')
        }
        if (isNaN(age) || age < 18 || age > 60) {
            errorMessages.value.push('Введите корректный возраст (18-60 лет).')
        }

        // Если ошибки уже есть - прерываем расчёт
        if (errorMessages.value.length > 0) {
            isGenerating.value = false
            return
        }

        try {
            // Считаем BMR по формуле Миффлина-Сан Жеора
            let BMR: number
            if (gender === 'мужчина') {
                BMR = (10 * weight) + (6.25 * height) - (5 * age) + 5

            } else if (gender === 'женщина') {
                BMR = (10 * weight) + (6.25 * height) - (5 * age) - 161
            } else {
                throw new Error('Некорректный пол.')
            }

            let activityCoefficient: number
            if (gender === 'мужчина') {
                activityCoefficient = 1.55

            } else if (gender === 'женщина') {
                activityCoefficient = 1.45

            } else {
                throw new Error('Некорректный пол для кэфа активности.')
            }

            // Коэффициент активности (примерно)

            // Расчёт TDEE
            let TDEE = BMR * activityCoefficient

            // Корректировка под цель
            // Похудение: -10%, Удержание: 0%, Набор: +10%
            let calorieAdjustmentFactor = 1
            if (goal === 'похудение') {
                calorieAdjustmentFactor = 0.9
            } else if (goal === 'набор') {
                calorieAdjustmentFactor = 1.1
            }
            TDEE *= calorieAdjustmentFactor

            // Доп. калории от тренировок
            let extraCalories = 0
            if (workoutsPerWeek > 0) {
                if (gender === 'мужчина') {
                    extraCalories = (workoutsPerWeek * 6 * 60) / 7
                } else if (gender === 'женщина') {
                    extraCalories = (workoutsPerWeek * 5 * 60) / 7
                }
                TDEE += extraCalories
            }

            // Коэффициенты для белков и жиров в зависимости от пола и телосложения
            const proteinFatCoefficients: Record<string, Record<string, { protein: number; fat: number }>> = {
                'мужчина': {
                    'худощавое': { protein: 1.9, fat: 1.0 },
                    'среднее': { protein: 2.0, fat: 1.0 },
                    'плотное': { protein: 2.1, fat: 1.0 },
                },
                'женщина': {
                    'худощавое': { protein: 1.8, fat: 1.1 },
                    'среднее': { protein: 1.9, fat: 1.1 },
                    'плотное': { protein: 2.0, fat: 1.1 },
                },
            }

            const coefficients = proteinFatCoefficients[gender]?.[bodyType]
            if (!coefficients) {
                throw new Error('Не удалось получить коэффициенты для выбранного пола и телосложения.')
            }

            // Считаем белки и жиры
            const proteins = coefficients.protein * weight
            const fats = coefficients.fat * weight

            // Калории из белков и жиров
            const proteinCalories = proteins * 4
            const fatCalories = fats * 9

            // Углеводы = остаток калорий
            const carbCalories = TDEE - (proteinCalories + fatCalories)
            const carbs = carbCalories / 4

            // Округляем и сохраняем результат во внутренний ref
            kbzhuResultRef.value = {
                calories: Math.round(TDEE),
                extraCalories: Math.round(extraCalories),
                proteins: Math.round(proteins),
                fats: Math.round(fats),
                carbs: Math.round(carbs),
            }

            // Показываем v-bottom-sheet с результатом
            showBottomSheet.value = true

            // Ждём рендера bottom-sheet, чтобы построить диаграмму
            await nextTick()
            updateMacroChart()

        } catch (error: any) {
            console.error('Ошибка при расчёте КБЖУ:', error.message || error)
            errorMessages.value.push(error.message || 'Неизвестная ошибка при расчёте.')
        } finally {
            isGenerating.value = false
        }
    }

    /**
     * Отдаём наружу `kbzhuResult` как computed,
     * чтобы в шаблоне (template) не было ошибки "possibly null".
     */
    const kbzhuResult = computed<KbzhuResult>(() => {
        return kbzhuResultRef.value ?? {
            calories: 0,
            extraCalories: 0,
            proteins: 0,
            fats: 0,
            carbs: 0
        }
    })

    return {
        kbzhuResult,         // теперь точно не null с точки зрения TypeScript
        isGenerating,
        errorMessages,
        calculateKbzhu
    }
}
