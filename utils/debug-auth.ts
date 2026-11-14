import { createHash } from "crypto";
import { cookies } from "next/headers";

/**
 * Доступ к служебной странице /debug и её API.
 *
 * Пароль задаётся переменной окружения DEBUG_PASSWORD. Если она не задана:
 * - в проде — fail closed: доступ закрыт, страница показывает «не настроено»;
 * - в dev — открыто, чтобы локально можно было работать без пароля.
 *
 * Cookie хранит не сам пароль, а его хеш: пароль не уезжает в каждом запросе.
 */

export const DEBUG_COOKIE_NAME = "debug_token";

/** Задан ли пароль в окружении */
export function isDebugAuthConfigured(): boolean {
    return Boolean(process.env.DEBUG_PASSWORD);
}

/** Пароль не задан: в проде закрыто, в dev открыто */
function isOpenWithoutPassword(): boolean {
    return process.env.NODE_ENV !== "production";
}

/** Хеш пароля — то, что хранится в cookie */
export function hashDebugToken(value: string): string {
    return createHash("sha256").update(value).digest("hex");
}

/**
 * Проверка доступа к отладке и её API.
 * Куки httpOnly, срок 24 часа — ставится в app/actions/debug-auth.ts.
 */
export async function isDebugAuthorized(): Promise<boolean> {
    const password = process.env.DEBUG_PASSWORD;

    if (!password) {
        return isOpenWithoutPassword();
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(DEBUG_COOKIE_NAME)?.value;

    return Boolean(token) && token === hashDebugToken(password);
}
