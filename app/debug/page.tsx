
import { cookies } from "next/headers";
import DebugClient from "@/components/debug/debug-client";
import { DebugLoginForm } from "@/components/debug/login-form";

export default async function DebugPage() {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("debug_token");
    const isAuthenticated = authToken?.value === process.env.DEBUG_TOKEN;

    // Если токен в env не задан, считаем что защита выключена (или можно наоборот - блокировать)
    // Для безопасности лучше: если нет пароля, то доступ закрыт или открыт.
    // Давайте сделаем так: если DEBUG_PASSWORD не задан в .env, то доступ открыт (для dev).
    // Eсли задан, то проверяем.

    const debugPassword = process.env.DEBUG_PASSWORD;

    if (debugPassword && authToken?.value !== debugPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <DebugLoginForm />
            </div>
        );
    }

    return <DebugClient />;
}
