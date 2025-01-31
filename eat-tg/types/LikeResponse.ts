// types/LikeResponse.ts

export interface LikeResponse {
    success: boolean;
    message: string;
    data?: any; // Замените `any` на более конкретный тип, если сервер возвращает дополнительные данные
}
