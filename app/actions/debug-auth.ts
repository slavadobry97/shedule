"use server";

import { cookies, headers } from "next/headers";
import { DEBUG_COOKIE_NAME, hashDebugToken } from "@/utils/debug-auth";

// Лимит неудачных попыток входа: 5 за 15 минут на IP. Без лимита пароль
// перебирается скриптом без ограничений. Счётчики в памяти процесса: при
// перезапуске сервера обнуляются — для защиты от перебора этого достаточно.
// IP берём из x-forwarded-for / x-real-ip: за reverse-proxy это адрес клиента,
// при прямом доступе заголовков нет и все клиенты попадают в общий бакет.
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function cleanupExpiredAttempts(now: number): void {
    for (const [key, entry] of loginAttempts) {
        if (now >= entry.resetAt) {
            loginAttempts.delete(key);
        }
    }
}

async function getClientIp(): Promise<string> {
    const headerStore = await headers();
    const forwarded = headerStore.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return headerStore.get("x-real-ip") ?? "unknown";
}

export async function loginAction(password: string) {
    const clientIp = await getClientIp();
    const now = Date.now();

    cleanupExpiredAttempts(now);
    const attempt = loginAttempts.get(clientIp);
    if (attempt && attempt.count >= MAX_LOGIN_ATTEMPTS) {
        const retryAfterMin = Math.max(1, Math.ceil((attempt.resetAt - now) / 60000));
        return {
            success: false,
            message: `Слишком много неудачных попыток входа. Повторите через ${retryAfterMin} мин.`,
        };
    }

    const correctPassword = process.env.DEBUG_PASSWORD;

    if (!correctPassword) {
        // Если пароль не настроен - серверная ошибка, неверный пароль
        return { success: false, message: "Server configuration error" };
    }

    if (password === correctPassword) {
        // Успешный вход сбрасывает счётчик неудачных попыток
        loginAttempts.delete(clientIp);

        const cookieStore = await cookies();
        // В cookie кладём хеш пароля, а не сам пароль: пароль не уезжает
        // в каждом запросе. Проверка — в utils/debug-auth.ts
        cookieStore.set(DEBUG_COOKIE_NAME, hashDebugToken(password), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/",
        });
        return { success: true };
    }

    const resetAt = attempt && now < attempt.resetAt ? attempt.resetAt : now + LOGIN_WINDOW_MS;
    loginAttempts.set(clientIp, {
        count: (attempt?.count ?? 0) + 1,
        resetAt,
    });

    return { success: false, message: "Неверный пароль" };
}
