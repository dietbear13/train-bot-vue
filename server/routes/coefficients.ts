// routes/coefficients.ts

import { Router, Request, Response } from 'express';
import { MacrosCoefficient } from '../src/models/MacrosCoefficient';
import { GoalCoefficient } from '../src/models/GoalCoefficient';
import { HeightWeightCoefficient } from '../src/models/HeightWeightCoefficient';

const router = Router();

// Эндпоинт для получения коэффициентов БЖУ
router.get('/macros-coefficients', async (req: Request, res: Response) => {
    try {
        const { gender, bodyType } = req.query;

        if (!gender || !bodyType) {
            return res.status(400).json({ error: 'Missing gender or bodyType parameter' });
        }

        const coefficient = await MacrosCoefficient.findOne({
            gender: (gender as string).toLowerCase(),
            bodyType: (bodyType as string).toLowerCase(),
        });

        if (!coefficient) {
            return res.status(404).json({ error: 'MacrosCoefficient not found' });
        }

        res.json(coefficient);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Эндпоинт для получения коэффициентов целей питания
router.get('/goal-coefficients', async (req: Request, res: Response) => {
    try {
        const { gender, bodyType, goal } = req.query;

        if (!gender || !bodyType || !goal) {
            return res.status(400).json({ error: 'Missing gender, bodyType, or goal parameter' });
        }

        const coefficient = await GoalCoefficient.findOne({
            gender: (gender as string).toLowerCase(),
            bodyType: (bodyType as string).toLowerCase(),
            goal: (goal as string).toLowerCase(),
        });

        if (!coefficient) {
            return res.status(404).json({ error: 'GoalCoefficient not found' });
        }

        res.json(coefficient);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Эндпоинт для получения коэффициентов по росту и весу
router.get('/height-weight-coefficients', async (req: Request, res: Response) => {
    try {
        const { gender, bodyType, weight, height } = req.query;

        if (!gender || !bodyType || !weight || !height) {
            return res.status(400).json({ error: 'Missing gender, bodyType, weight, or height parameter' });
        }

        // Преобразуем вес и рост в числа
        const weightValue = parseFloat(weight as string);
        const heightValue = parseInt(height as string, 10);

        // Находим все записи, соответствующие полу и телосложению
        const coefficients = await HeightWeightCoefficient.find({
            gender: (gender as string).toLowerCase(),
            bodyType: (bodyType as string).toLowerCase(),
        });

        if (!coefficients || coefficients.length === 0) {
            return res.status(404).json({ error: 'HeightWeightCoefficient not found' });
        }

        // Фильтруем по диапазону веса и роста
        const matchedCoefficient = coefficients.find((coeff) => {
            const [minWeight, maxWeight] = coeff.weightRange.split('-').map((w) => parseFloat(w));
            const [minHeight, maxHeight] = coeff.heightRange.split('-').map((h) => parseInt(h, 10));

            return (
                weightValue >= minWeight &&
                weightValue <= maxWeight &&
                heightValue >= minHeight &&
                heightValue <= maxHeight
            );
        });

        if (!matchedCoefficient) {
            return res.status(404).json({ error: 'Matching HeightWeightCoefficient not found' });
        }

        res.json(matchedCoefficient);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
