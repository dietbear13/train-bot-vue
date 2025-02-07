// composables/useExerciseFilter.ts

import { computed } from 'vue';
import type { Ref } from 'vue';
import type { Exercise } from './types'; // Импортируем интерфейс

// Функция для нормализации строк (убираем спецсимволы, переводим в нижний регистр)
function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .replace(/[.,\/#!$%\\^&\\*;:{}=\-_`~()]/g, '')
        .replace(/ё/g, 'е')
        .replace(/ъ/g, 'ь');
}

// Подсчёт расстояния для определения похожести слов
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

export function useExerciseFilter(exercises: Ref<Exercise[]>, searchQuery: Ref<string>) {
    // Определяем веса для полей
    const fieldWeights: { [key: string]: number } = {
        name: 4,
        equipment: 3,
        mainMuscle: 2,
        additionalMuscles: 1
    };

    console.log("useExerciseFilter", searchQuery.value, )

    // Вычисляем отфильтрованный и отсортированный список с приоритетами
    const filteredExercises = computed(() => {
        const query = normalizeString(searchQuery.value);
        console.log("query", searchQuery.value,query, !query )
        if (!query) return exercises.value

        return exercises.value
            .map(exercise => {
                let score = 0;

                // Проверяем совпадения в разных полях и добавляем баллы
                if (normalizeString(exercise.name).includes(query)) {
                    score += fieldWeights.name;
                }
                if (normalizeString(exercise.mainMuscle).includes(query)) {
                    score += fieldWeights.mainMuscle;
                }
                if (exercise.additionalMuscles && normalizeString(exercise.additionalMuscles).includes(query)) {
                    score += fieldWeights.additionalMuscles;
                }
                if (normalizeString(exercise.equipment).includes(query)) {
                    score += fieldWeights.equipment;
                }

                // Фаззи совпадение для каждого поля
                const queryWords = query.split(/\s|-/).filter(Boolean);
                const fieldsToCheck = ['name', 'mainMuscle', 'additionalMuscles', 'equipment'] as const;

                queryWords.forEach(qWord => {
                    fieldsToCheck.forEach(field => {
                        const fieldValue = normalizeString((exercise as any)[field] || '');
                        if (fieldValue.includes(qWord) || isSimilar(fieldValue, qWord)) {
                            score += fieldWeights[field] * 0.5; // Дополнительные баллы за похожие слова
                        }
                    });
                });

                return { exercise, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.exercise);
    });

    // Показываем только первые 20 результатов (исправлено с 50)
    const displayedExercises = computed(() => {
        return filteredExercises.value.slice(0, 20);
    });

    return {
        filteredExercises,
        displayedExercises
    };
}
