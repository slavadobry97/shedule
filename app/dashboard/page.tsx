import type { Metadata } from "next";
import { DashboardBento, type DashboardData } from "@/components/dashboard/dashboard-bento";
import { DebugLoginForm } from "@/components/debug/login-form";
import DebugClient from "@/components/debug/debug-client";
import { isDebugAuthConfigured, isDebugAuthorized } from "@/utils/debug-auth";
import { getAllSubscriptions, getLastCheck, getScheduleSnapshot } from "@/utils/push-utils";
import { getDebugAiUsage } from "@/utils/debug-ai-limit";

export const metadata: Metadata = {
    title: "Состояние расписания | РГСУ",
    robots: { index: false, follow: false },
};

// cookies() и Redis-чтение внутри — страница всегда серверная,
// иначе Next запечёт «закрытый» HTML на сборке.
export const dynamic = "force-dynamic";

/**
 * Каждый источник в своём try/catch: Redis может быть не настроен —
 * остров гасится, а не роняет страницу.
 */
async function collectData(): Promise<DashboardData> {
    let lastCheck: number | null = null;
    let rows: number | null = null;
    let total: number | null = null;
    let withGroup = 0;
    let withTeacher = 0;
    let ai = { count: 0, limit: 250 };

    try {
        lastCheck = await getLastCheck();
    } catch {}

    try {
        const snapshot = await getScheduleSnapshot();
        rows = snapshot ? snapshot.length : null;
    } catch {}

    try {
        const subs = await getAllSubscriptions();
        total = subs.length;
        withGroup = subs.filter((s) => s.filters.groups.length > 0).length;
        withTeacher = subs.filter((s) => s.filters.teachers.length > 0).length;
    } catch {}

    try {
        const usage = await getDebugAiUsage();
        ai = { count: usage.count, limit: usage.limit };
    } catch {}

    return {
        generatedAt: Date.now(),
        cron: { lastCheck, rows },
        push: { total, withGroup, withTeacher },
        ai,
    };
}

export default async function DashboardPage() {
    const authorized = await isDebugAuthorized();

    if (!authorized) {
        if (!isDebugAuthConfigured()) {
            return (
                <div className="container mx-auto px-4 py-6">
                    <div className="mx-auto max-w-md rounded-3xl border border-border bg-background p-6 text-center">
                        <h1 className="text-lg font-semibold">Панель не настроена</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Задайте переменную окружения <code className="font-mono text-xs">DEBUG_PASSWORD</code>&nbsp;—
                            без неё служебный раздел в продакшене закрыт
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="container mx-auto px-4 py-6">
                <div className="mx-auto max-w-md">
                    <div className="mb-4 text-center">
                        <h1 className="font-evolventa text-2xl font-bold tracking-[-0.01em]">Состояние расписания</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Вход по паролю администратора
                        </p>
                    </div>
                    <DebugLoginForm />
                </div>
            </div>
        );
    }

    const data = await collectData();

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Названия и описания разделов — в реестре section-meta:
                Сводка получает свою шапку внутри DebugClient. */}
            <DebugClient summaryNode={<DashboardBento data={data} />} dashboardData={data} />
        </div>
    );
}
