"use client";

import {
    BellRingIcon,
    BotIcon,
    RefreshIcon,
    TableIcon,
} from "@/components/icons";
import { MOCK_DASHBOARD, type Tone } from "@/components/dashboard/dashboard-mock-data";
import { cn } from "cn";

/**
 * Вариант 2 — «Статусная строка»: страница состояния в стиле uptime —
 * сводка сверху, ниже по строке на подсистему: пилюля статуса, ключевое
 * значение, время обновления. Плотнее варианта 1.
 */

const PILL: Record<Tone, string> = {
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
    info: "border-info/30 bg-info/10 text-info",
    neutral: "border-border bg-muted/50 text-muted-foreground",
};

interface StatusRow {
    icon: React.ReactNode;
    name: string;
    tone: Tone;
    value: string;
    detail: string;
    updated: string;
}

/** Сводка-баннер: «всё ли живо» одной строкой. Стиль CTA лендинга (bg-brand).
 *  Используется и в варианте «Итог». */
export function DashboardSummary() {
    const m = MOCK_DASHBOARD;
    const warnings =
        (m.sheets.badDates > 0 ? 1 : 0) + (m.sheets.outOfSlot > 0 ? 1 : 0) + m.push.dead + m.push.deliveryErrors;
    const allGreen = warnings === 0;

    return (
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-brand px-6 py-5 text-white sm:px-8 md:flex-row md:items-center">
            <div className="min-w-0">
                <h2 className="font-evolventa text-lg font-bold tracking-[-0.01em] sm:text-xl">
                    {allGreen ? "Все системы работают" : "Сервис работает, есть замечания"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed opacity-80">
                    v{m.version} · uptime {m.uptime} · обновлено {m.updatedAt}
                    {warnings > 0 ? ` · замечаний: ${warnings}` : ""}
                </p>
            </div>

            <span className="shrink-0 rounded-full border border-white/30 px-4 py-1.5 font-mono text-xxs uppercase tracking-[0.16em] text-white">
                {allGreen ? "OK" : `Замечаний: ${warnings}`}
            </span>
        </div>
    );
}

export function DashboardStatus() {
    const m = MOCK_DASHBOARD;
    const changesTotal = m.cron.changes.added + m.cron.changes.removed + m.cron.changes.modified;

    const rows: StatusRow[] = [
        {
            icon: <RefreshIcon className="h-4 w-4" />,
            name: "Крон / снапшот",
            tone: m.cron.status,
            value: changesTotal > 0 ? `${changesTotal} изменений` : "изменений нет",
            detail: `12 371 запись · следующий прогон ${m.cron.nextRunIn}`,
            updated: m.cron.lastRunAgo,
        },
        {
            icon: <TableIcon className="h-4 w-4" />,
            name: "Данные Sheets",
            tone: m.sheets.status,
            value: `квота ${m.sheets.quotaUsed}/${m.sheets.quotaLimit}`,
            detail: `битых дат: ${m.sheets.badDates} · пар вне слотов: ${m.sheets.outOfSlot}`,
            updated: `синк ${m.sheets.lastSync}`,
        },
        {
            icon: <BellRingIcon className="h-4 w-4" />,
            name: "Push-уведомления",
            tone: m.push.status,
            value: `${m.push.subscriptions} подписок`,
            detail: `мёртвых: ${m.push.dead} · ошибок доставки: ${m.push.deliveryErrors}`,
            updated: `доставка ${m.push.lastDelivery}`,
        },
        {
            icon: <BotIcon className="h-4 w-4" />,
            name: "AI-чат",
            tone: m.ai.status,
            value: `${m.ai.usedToday}/${m.ai.limit} запросов`,
            detail: `${m.ai.provider} · ${m.ai.model}`,
            updated: "за сутки",
        },
    ];

    return (
        <div className="space-y-4">
            <DashboardSummary />

            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card divide-y divide-border/60">
                {rows.map((row) => (
                    <div key={row.name} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-medium">
                            <span className={cn(PILL[row.tone], "flex h-7 w-7 items-center justify-center rounded-full border")}>
                                {row.icon}
                            </span>
                            {row.name}
                        </span>
                        <span className="ml-auto flex items-center gap-3">
                            <span className="font-mono text-sm tabular-nums">{row.value}</span>
                            <span
                                className={cn(
                                    "rounded-full border px-2 py-0.5 font-mono text-xxs uppercase tracking-[0.14em]",
                                    PILL[row.tone]
                                )}
                            >
                                {row.tone === "success" ? "OK" : row.tone === "warning" ? "внимание" : row.tone}
                            </span>
                        </span>
                        <p className="w-full text-xs text-muted-foreground">
                            {row.detail} · <span className="font-mono">{row.updated}</span>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
