import { Request, Response, NextFunction } from 'express';

/**
 * Middleware для обработки ошибок
 */
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('❌  Ошибка:', err);

    // Определяем статус-код (по умолчанию 500)
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Произошла ошибка на сервере',
    });
};
