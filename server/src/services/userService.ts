import User, { IUser } from '../models/User';
import { bot } from '../config/bot';

/**
 * Получение всех пользователей
 */
export const getAllUsers = async (): Promise<IUser[]> => {
    return await User.find({}, '-__v -password'); // Исключаем ненужные поля
};

/**
 * Получение пользователя по Telegram ID
 */
export const findUserByTelegramId = async (telegramId: number): Promise<IUser | null> => {
    return await User.findOne({ telegramId });
};

/**
 * Создание нового пользователя
 */
export const createUser = async (telegramId: number, role: string = 'freeUser'): Promise<IUser> => {
    const newUser = new User({
        telegramId,
        role,
        dateAdded: Math.floor(Date.now() / 1000),
    });
    return await newUser.save();
};

/**
 * Проверка и создание пользователя при необходимости
 */
export const checkAndCreateUser = async (telegramId: number): Promise<IUser> => {
    let user = await findUserByTelegramId(telegramId);

    if (!user) {
        const isAdmin = telegramId === 327844310; // Определение админа
        user = await createUser(telegramId, isAdmin ? 'admin' : 'freeUser');
        console.log(`Добавлен новый пользователь: ${telegramId}`);
    } else {
        console.log(`Пользователь найден: ${telegramId}`);
    }

    return user;
};

/**
 * Проверка подписки пользователя на канал
 */
export const checkUserSubscription = async (user: IUser): Promise<string> => {
    const channelUsername = '@training_health';

    try {
        const chatMember = await bot.getChatMember(channelUsername, user.telegramId);
        const isSubscribed = chatMember.status !== 'left' && chatMember.status !== 'kicked';

        if (isSubscribed && user.role !== 'paidUser') {
            user.role = 'paidUser';
            await user.save();
            console.log(`Обновлена роль на paidUser у пользователя: ${user.telegramId}`);
        } else if (!isSubscribed && user.role === 'paidUser') {
            user.role = 'freeUser';
            await user.save();
            console.log(`Пользователь ${user.telegramId} отписался, роль изменена на freeUser.`);
        }

        return user.role;
    } catch (err) {
        console.error('Ошибка при обращении к Telegram API:', err);
        return user.role; // Если ошибка, возвращаем текущую роль
    }
};

/**
 * Обновление роли пользователя
 */
export const updateUserRole = async (
    telegramId: number,
    role: string,
    datePaid?: number,
    datePaidUntil?: number
): Promise<IUser | null> => {
    return await User.findOneAndUpdate(
        { telegramId },
        { role, datePaid, datePaidUntil },
        { new: true }
    );
};
