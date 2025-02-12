import { computed } from 'vue';
import type { Ref } from 'vue';
import type { Exercise } from './types';

// Функция для нормализации строк (удаляет спецсимволы, приводит к нижнему регистру)
function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .replace(/[.,\/#!$%\\^&*;:{}=\-_`~()]/g, '')
        .replace(/ё/g, 'е')
        .replace(/ъ/g, 'ь')
        .trim();
}

// Подсчёт расстояния для определения похожести слов (алгоритм Левенштейна)
function getEditDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

// Проверка похожести слов с допуском 20%
function isSimilar(word1: string, word2: string): boolean {
    const distance = getEditDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);
    return distance <= Math.ceil(maxLength * 0.2);
}

/**
 * Хук фильтрации упражнений с фаззи-поиском.
 *
 * @param exercises — список всех упражнений
 * @param searchQuery — поисковая строка
 * @param filters — объект фильтров { typeExercise: string[], category: string[], equipment: string[] }
 */
export function useExerciseFilter(
    exercises: Ref<Exercise[]>,
    searchQuery: Ref<string>,
    filters: Ref<{ typeExercise: string[]; category: string[]; equipment: string[] }>
) {
    // Весовые коэффициенты для важности поиска
    const fieldWeights: { [key: string]: number } = {
        name: 4,
        equipment: 3,
        mainMuscle: 2,
        category: 2,
        additionalMuscles: 1,
    };

    // Фильтрация по выбранным категориям
    const filteredByFilters = computed(() => {
        return exercises.value.filter((exercise) => {
            if (
                filters.value.typeExercise.length > 0 &&
                !filters.value.typeExercise.includes(exercise.typeExercise || '')
            ) {
                return false;
            }
            if (
                filters.value.category.length > 0 &&
                !filters.value.category.includes(exercise.category || '')
            ) {
                return false;
            }
            if (
                filters.value.equipment.length > 0 &&
                !filters.value.equipment.includes(exercise.equipment || '')
            ) {
                return false;
            }
            return true;
        });
    });

    // Фильтрация по поисковому запросу
    const filteredExercises = computed(() => {
        const baseExercises = filteredByFilters.value;
        const query = normalizeString(searchQuery.value);
        if (!query) return baseExercises;

        return baseExercises
            .map((exercise) => {
                let score = 0;

                // Прямое совпадение по основным полям
                if (normalizeString(exercise.name).includes(query)) {
                    score += fieldWeights.name;
                }
                if (normalizeString(exercise.mainMuscle).includes(query)) {
                    score += fieldWeights.mainMuscle;
                }
                if (normalizeString(exercise.equipment).includes(query)) {
                    score += fieldWeights.equipment;
                }

                // Фаззи-поиск: проверяем слова в запросе на схожесть
                const queryWords = query.split(/\s|-/).filter(Boolean);
                const fieldsToCheck = ['name', 'mainMuscle', 'additionalMuscles', 'equipment'] as const;

                queryWords.forEach((qWord) => {
                    fieldsToCheck.forEach((field) => {
                        const fieldValue = normalizeString((exercise as any)[field] || '');
                        if (fieldValue.includes(qWord) || isSimilar(fieldValue, qWord)) {
                            score += fieldWeights[field] * 0.5;
                        }
                    });
                });

                return { exercise, score };
            })
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map((item) => item.exercise);
    });

    // Ограничение вывода до 20 результатов
    const displayedExercises = computed(() => {
        return filteredExercises.value.slice(0, 40);
    });

    return {
        filteredExercises,
        displayedExercises,
    };
}
