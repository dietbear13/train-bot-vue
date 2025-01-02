// composables/useKbzhu.ts
import { ref, type Ref } from 'vue'

// Ниже - для наглядности, если у вас нет своих типов
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
  age: number | ''
  height: number | ''
  weight: number | ''
  goal: string
  workoutsPerWeek: number
}

export function useKbzhu() {
    // Состояния, связанные с логикой расчёта
    const kbzhuResult = ref<KbzhuResult | null>(null)
    const isGenerating = ref(false)
    const errorMessages = ref<string[]>([])
    const timer = ref(0)
    let intervalId: number | null = null

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
        if (isGenerating.value || timer.value > 0) {
            return
        }

        // Сбрасываем первоначальные значения
        isGenerating.value = true
        errorMessages.value = []
        kbzhuResult.value = null

        // Разбираем необходимые переменные из formData
        const gender = formData.gender.toLowerCase()
        const bodyType = formData.bodyType.toLowerCase()
        const goal = formData.goal.toLowerCase()
        const height = typeof formData.height === 'number' ? formData.height : parseFloat(formData.height as string)
        const weight = typeof formData.weight === 'number' ? formData.weight : parseFloat(formData.weight as string)
        const workoutsPerWeek = formData.workoutsPerWeek
        const age = typeof formData.age === 'number' ? formData.age : parseInt(formData.age as string)

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
        if (isNaN(height) || height < 150 || height > 250) {
            errorMessages.value.push('Введите корректный рост (150-250 см).')
        }
        if (isNaN(weight) || weight < 40 || weight > 250) {
            errorMessages.value.push('Введите корректный вес (40-250 кг).')
        }
        if (isNaN(workoutsPerWeek) || workoutsPerWeek < 0 || workoutsPerWeek > 10) {
            errorMessages.value.push('Введите корректное число тренировок в неделю (0-10).')
        }
        if (isNaN(age) || age < 10 || age > 120) {
            errorMessages.value.push('Введите корректный возраст (10-120 лет).')
        }

        // Если ошибки уже есть - прерываем расчёт
        if (errorMessages.value.length > 0) {
            isGenerating.value = false
            return
        }

        // Считаем BMR по формуле Миффлина-Сан Жеора
        let BMR: number
        if (gender === 'мужчина') {
            BMR = (10 * weight) + (6.25 * height) - (5 * age) + 5
        } else if (gender === 'женщина') {
            BMR = (10 * weight) + (6.25 * height) - (5 * age) - 161
        } else {
            errorMessages.value.push('Некорректный пол.')
            isGenerating.value = false
            return
        }

        // Коэффициент активности (для примера: 1.4)
        const activityCoefficient = 1.4

        // Расчёт TDEE
        let TDEE = BMR * activityCoefficient

        // Корректировка под цель
        // Похудение: -15%, Удержание: 0%, Набор: +15%
        let calorieAdjustmentFactor = 1
        if (goal === 'похудение') {
            calorieAdjustmentFactor = 0.85
        } else if (goal === 'набор') {
            calorieAdjustmentFactor = 1.15
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
        const proteinFatCoefficients: Record<string, Record<string, { protein: number, fat: number }>> = {
            'мужчина': {
                'худощавое': { protein: 1.7, fat: 1.05 },
                'среднее': { protein: 1.9, fat: 1.0 },
                'плотное': { protein: 2.1, fat: 0.9 },
            },
            'женщина': {
                'худощавое': { protein: 1.6, fat: 1.15 },
                'среднее': { protein: 1.7, fat: 1.1 },
                'плотное': { protein: 1.8, fat: 1.05 },
            },
        }

        const coefficients = proteinFatCoefficients[gender]?.[bodyType]
        if (!coefficients) {
            errorMessages.value.push('Не удалось получить коэффициенты для выбранного пола и телосложения.')
            isGenerating.value = false
            return
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

        // Округляем и сохраняем результат
        kbzhuResult.value = {
            calories: Math.round(TDEE),
            extraCalories: Math.round(extraCalories),
            proteins: Math.round(proteins),
            fats: Math.round(fats),
            carbs: Math.round(carbs),
        }

        // Показываем v-bottom-sheet с результатом
        showBottomSheet.value = true

        // Ждём, когда отрендерится bottom-sheet, чтобы построить диаграмму
        await nextTick()
        updateMacroChart()

        // Запуск таймера повторной генерации
        timer.value = 10
        intervalId = window.setInterval(() => {
            timer.value--
            if (timer.value <= 0 && intervalId !== null) {
                window.clearInterval(intervalId)
                intervalId = null
            }
        }, 1000)

        isGenerating.value = false
    }

    return {
        kbzhuResult,
        isGenerating,
        errorMessages,
        timer,
        calculateKbzhu
    }
}

