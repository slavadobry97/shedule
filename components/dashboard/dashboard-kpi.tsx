"use client";

import {
    BellRingIcon,
    BotIcon,
    ClockIcon,
    FileTextIcon,
    HistoryIcon,
    LockIcon,
    RefreshIcon,
    ShieldCheckIcon,
} from "@/components/icons";
import { MOCK_DASHBOARD, type Tone } from "@/components/dashboard/dashboard-mock-data";
import { cn } from "cn";

/**
 * Вариант 3 — «KPI + лента»: полоса больших цифр сверху, ниже — журнал
 * последних событий всех подсистем. Ориентир на «что случилось», а не
 * «как настроено».
 */

const EVENT_ICON = {
    cron: RefreshIcon,
    changes: FileTextIcon,
    push: BellRingIcon,
    ai: BotIcon,
    auth: LockIcon,
} as const;

const TONE_TEXT: Record<Tone, string> = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    info: "text-info",
    neutral: "text-muted-foreground",
};

const TONE_BG: Record<Tone, string> = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
    neutral: "bg-muted/50 text-muted-foreground",
};

function KpiTile({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: Tone }) {
    return (
        <div className="rounded-3xl border border-border/70 bg-card px-4 py-3">
            <p className="text-xxs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
            <p className={cn("mt-1 font-mono text-2xl font-bold tabular-nums", tone ? TONE_TEXT[tone] : "text-foreground")}>
                {value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
        </div>
    );
}

export function DashboardKpi() {
    const m = MOCK_DASHBOARD;
    const changesTotal = m.cron.changes.added + m.cron.changes.removed + m.cron.changes.modified;

    return (
        <div className="space-y-4">
            {/* KPI-полоса */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <KpiTile
                    label="Снапшот"
                    value={m.cron.rows.toLocaleString("ru-RU")}
                    sub={`крон ${m.cron.lastRunAgo}`}
                />
                <KpiTile
                    label="Изменений"
                    value={String(changesTotal)}
                    sub={`+${m.cron.changes.added} / −${m.cron.changes.removed} / ~${m.cron.changes.modified}`}
                    tone={changesTotal > 0 ? "info" : undefined}
                />
                <KpiTile
                    label="Квота Sheets"
                    value={`${Math.round((m.sheets.quotaUsed / m.sheets.quotaLimit) * 100)}%`}
                    sub={`${m.sheets.quotaUsed} из ${m.sheets.quotaLimit} req/min`}
                    tone={m.sheets.quotaUsed / m.sheets.quotaLimit > 0.7 ? "warning" : undefined}
                />
                <KpiTile
                    label="Подписки пуша"
                    value={String(m.push.subscriptions)}
                    sub={`мёртвых: ${m.push.dead} · ошибок: ${m.push.deliveryErrors}`}
                    tone={m.push.dead + m.push.deliveryErrors > 0 ? "warning" : undefined}
                />
                <KpiTile
                    label="AI за сутки"
                    value={`${m.ai.usedToday}`}
                    sub={`из ${m.ai.limit} · ${m.ai.model}`}
                />
            </div>

            {/* Лента событий */}
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                    <HistoryIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Последние события</span>
                    <span className="ml-auto flex items-center gap-1.5 font-mono text-tiny text-muted-foreground">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {m.updatedAt}
                    </span>
                </div>
                <div className="divide-y divide-border/50">
                    {m.events.map((event, idx) => {
                        const Icon = EVENT_ICON[event.icon];
                        return (
                            <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
                                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", TONE_BG[event.tone])}>
                                    <Icon className="h-3.5 w-3.5" />
                                </span>
                                <p className="min-w-0 flex-1 text-sm leading-7 text-foreground/90">{event.text}</p>
                                <span className="shrink-0 font-mono text-tiny tabular-nums text-muted-foreground">
                                    {event.time}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Сервис v{m.version} · данные — иллюстративные, источник подключается после выбора варианта
            </p>
        </div>
    );
}
