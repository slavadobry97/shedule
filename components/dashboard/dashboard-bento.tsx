"use client";

import {
    BellRingIcon,
    BotIcon,
    ClockIcon,
    RefreshIcon,
    TableIcon,
} from "@/components/icons";
import { MOCK_DASHBOARD, type Tone } from "@/components/dashboard/dashboard-mock-data";
import { cn } from "cn";

/**
 * Вариант 1 — «Острова»: сетка 2×2 самодостаточных блоков, по острову на
 * подсистему. Максимально близко к нынешним островам /debug.
 */

const PILL: Record<Tone, string> = {
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
    info: "border-info/30 bg-info/10 text-info",
    neutral: "border-border bg-muted/50 text-muted-foreground",
};

const TONE_TEXT: Record<Tone, string> = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    info: "text-info",
    neutral: "text-muted-foreground",
};

const STATUS_LABEL: Record<Tone, string> = {
    success: "OK",
    warning: "Внимание",
    danger: "Ошибка",
    info: "Инфо",
    neutral: "—",
};

function StatusPill({ tone }: { tone: Tone }) {
    return (
        <span className={cn("rounded-full border px-2.5 py-0.5 font-mono text-xxs uppercase tracking-[0.14em]", PILL[tone])}>
            {STATUS_LABEL[tone]}
        </span>
    );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: Tone }) {
    return (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={cn("font-mono text-sm tabular-nums", tone ? TONE_TEXT[tone] : "text-foreground")}>
                {value}
            </span>
        </div>
    );
}

export function DashboardBento() {
    const m = MOCK_DASHBOARD;
    const changesTotal = m.cron.changes.added + m.cron.changes.removed + m.cron.changes.modified;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-tiny text-muted-foreground">
                    <ClockIcon className="h-3.5 w-3.5" />
                    обновлено {m.updatedAt} · v{m.version} · uptime {m.uptime}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Крон и снапшот */}
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            <RefreshIcon className="h-4 w-4 text-primary" />
                            Крон и снапшот
                        </span>
                        <StatusPill tone={m.cron.status} />
                    </div>
                    <div className="divide-y divide-border/50">
                        <Row label="Последний прогон" value={`${m.cron.lastRun} · ${m.cron.lastRunAgo}`} />
                        <Row label="Следующий" value={m.cron.nextRunIn} />
                        <Row label="Записей в снапшоте" value={m.cron.rows.toLocaleString("ru-RU")} />
                        <Row
                            label="Изменений в прогоне"
                            value={`+${m.cron.changes.added} / −${m.cron.changes.removed} / ~${m.cron.changes.modified}`}
                            tone={changesTotal > 0 ? "info" : undefined}
                        />
                    </div>
                </div>

                {/* Данные Sheets */}
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            <TableIcon className="h-4 w-4 text-primary" />
                            Данные Sheets
                        </span>
                        <StatusPill tone={m.sheets.status} />
                    </div>
                    <div className="divide-y divide-border/50">
                        <Row
                            label="Квота API"
                            value={`${m.sheets.quotaUsed} / ${m.sheets.quotaLimit} req/min`}
                            tone={m.sheets.quotaUsed / m.sheets.quotaLimit > 0.7 ? "warning" : undefined}
                        />
                        <Row label="Битых дат" value={String(m.sheets.badDates)} tone={m.sheets.badDates > 0 ? "warning" : undefined} />
                        <Row label="Пар вне слотов" value={String(m.sheets.outOfSlot)} tone={m.sheets.outOfSlot > 0 ? "warning" : undefined} />
                        <Row label="Последняя синхронизация" value={m.sheets.lastSync} />
                    </div>
                </div>

                {/* Push */}
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            <BellRingIcon className="h-4 w-4 text-primary" />
                            Push-уведомления
                        </span>
                        <StatusPill tone={m.push.status} />
                    </div>
                    <div className="divide-y divide-border/50">
                        <Row label="Активных подписок" value={String(m.push.subscriptions)} />
                        <Row label="Мёртвых подписок" value={String(m.push.dead)} tone={m.push.dead > 0 ? "warning" : undefined} />
                        <Row label="Ошибок доставки" value={String(m.push.deliveryErrors)} tone={m.push.deliveryErrors > 0 ? "danger" : undefined} />
                        <Row label="Последняя доставка" value={m.push.lastDelivery} />
                    </div>
                </div>

                {/* AI */}
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            <BotIcon className="h-4 w-4 text-primary" />
                            AI-чат
                        </span>
                        <StatusPill tone={m.ai.status} />
                    </div>
                    <div className="divide-y divide-border/50">
                        <Row label="Запросов за сутки" value={`${m.ai.usedToday} / ${m.ai.limit}`} />
                        <Row label="Провайдер" value={m.ai.provider} />
                        <Row label="Модель" value={m.ai.model} />
                    </div>
                </div>
            </div>
        </div>
    );
}
