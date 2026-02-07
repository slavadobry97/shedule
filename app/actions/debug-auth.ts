"use server";

import { cookies } from "next/headers";

export async function loginAction(password: string) {
    const correctPassword = process.env.DEBUG_PASSWORD;

    if (!correctPassword) {
        // Если пароль не задан на сервере, разрешаем (или можно запрещать)
        return { success: false, message: "Server configuration error" };
    }

    if (password === correctPassword) {
        const cookieStore = await cookies();
        // Устанавливаем куку на 24 часа
        cookieStore.set("debug_token", password, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/",
        });
        return { success: true };
    }

    return { success: false, message: "Incorrect password" };
}
