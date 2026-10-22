"use server";

import { cookies } from "next/headers";
import { DEBUG_COOKIE_NAME, hashDebugToken } from "@/lib/debug-auth";

export async function loginAction(password: string) {
    const correctPassword = process.env.DEBUG_PASSWORD;

    if (!correctPassword) {
        // Если пароль не настроен - серверная ошибка, неверный пароль
        return { success: false, message: "Server configuration error" };
    }

    if (password === correctPassword) {
        const cookieStore = await cookies();
        // В cookie кладём хеш пароля, а не сам пароль: пароль не уезжает
        // в каждом запросе. Проверка — в lib/debug-auth.ts
        cookieStore.set(DEBUG_COOKIE_NAME, hashDebugToken(password), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/",
        });
        return { success: true };
    }

    return { success: false, message: "Incorrect password" };
}
