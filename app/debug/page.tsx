import DebugClient from "@/components/debug/debug-client";
import { DebugLoginForm } from "@/components/debug/login-form";
import { isDebugAuthConfigured, isDebugAuthorized } from "@/lib/debug-auth";

export const metadata = {
    title: "Отладка | Расписание РГСУ",
    robots: { index: false, follow: false },
};

// Страница всегда рендерится на сервере: cookies() спрятан внутри
// isDebugAuthorized(), и без этой строки Next считает страницу статичной —
// тогда HTML с текстом «Отладка не настроена» запекается на сборке.
export const dynamic = "force-dynamic";

export default async function DebugPage() {
    const authorized = await isDebugAuthorized();

    if (!authorized) {
        // Пароль не настроен: в проде отладка закрыта полностью (fail closed),
        // в dev остаётся открытой, чтобы удобно было работать локально.
        if (!isDebugAuthConfigured()) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
                    <div className="max-w-md rounded-lg border border-border bg-background p-6 text-center">
                        <h1 className="text-lg font-semibold">Отладка не настроена</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Задайте переменную окружения <code className="font-mono text-xs">DEBUG_PASSWORD</code> —
                            без неё служебный раздел в продакшене закрыт.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
                <DebugLoginForm />
            </div>
        );
    }

    return <DebugClient />;
}
