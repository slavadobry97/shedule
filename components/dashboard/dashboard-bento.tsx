import {
    BellRingIcon,
    BotIcon,
    ClockIcon,
    RefreshIcon,
    TableIcon,
} from "@/components/icons";
import { cn } from "cn";

/**
 * Операционная панель — вариант «Острова» (выбор владельца 14.11).
 * Сервер собирает DashboardData из реальных источников (push-utils Redis,
 * debug-ai-limit) и передаёт готовый снимок; компонент только рисует.
 * null в поле — источник недоступен или пуст: строка честно гасится.
 */

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export interface DashboardData {
    generatedAt: number;
    cron: { lastCheck: number | null; rows: number | null };
    push: { total: number | null; withGroup: number; withTeacher: number };
    ai: { count: number; limit: number };
}

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
    // text-xxs — токен globals.css; в cn он выживает: кегли xxs/tiny
    // зарегистрированы в lib/cn.ts (createCn из cn/config, тест — npm run test:cn).
    // inline-flex + h-5 + leading-none: глиф центрируется флексом, а не наследует
    // высокие метрики строки Geist Mono. Внутренний span translate-y-[0.5px] —
    // оптика: капс кириллицы без сдвига сидит на 0.5px выше геометрического
    // центра (воздух 5.5/6.5px); +1px перекосяет вниз.
    return (
        <span className={cn("inline-flex h-5 items-center justify-center rounded-full border px-2.5 font-mono text-xxs leading-none uppercase tracking-[0.14em]", PILL[tone])}>
            <span className="translate-y-[0.5px]">{STATUS_LABEL[tone]}</span>
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

/** «2 мин назад», «3 ч 14 мин назад» */
function ago(ts: number, now: number): string {
    const min = Math.max(0, Math.round((now - ts) / 60000));
    if (min < 1) return "только что";
    if (min < 60) return `${min} мин назад`;
    const h = Math.floor(min / 60);
    const rest = min % 60;
    return rest === 0 ? `${h} ч назад` : `${h} ч ${rest} мин назад`;
}

/** Свежесть крона: свежий — OK, подвисший — внимание, мёртвый — ошибка */
function freshness(lastCheck: number | null, now: number): Tone {
    if (lastCheck === null) return "neutral";
    const min = (now - lastCheck) / 60000;
    if (min < 15) return "success";
    if (min < 120) return "warning";
    return "danger";
}

function fmtTime(ts: number): string {
    return new Date(ts).toLocaleTimeString("ru-RU");
}

export function DashboardBento({ data }: { data: DashboardData }) {
    const { cron, push, ai, generatedAt } = data;
    const cronTone = freshness(cron.lastCheck, generatedAt);

    const aiRatio = ai.limit > 0 ? ai.count / ai.limit : 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 font-mono text-tiny text-muted-foreground">
                <ClockIcon className="h-3.5 w-3.5" />
                обновлено {fmtTime(generatedAt)}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Крон и снапшот */}
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            <RefreshIcon className="h-4 w-4 text-primary" />
                            Крон и снапшот
                        </span>
                        <StatusPill tone={cronTone} />
                    </div>
                    <div className="divide-y divide-border/50">
                        <Row
                            label="Последний прогон"
                            value={cron.lastCheck === null ? "ещё не запускался" : `${fmtTime(cron.lastCheck)} · ${ago(cron.lastCheck, generatedAt)}`}
                            tone={cronTone === "neutral" ? undefined : cronTone}
                        />
                        <Row
                            label="Записей в снапшоте"
                            value={cron.rows === null ? "нет данных" : cron.rows.toLocaleString("ru-RU")}
                            tone={cron.rows === null ? "neutral" : undefined}
                        />
                    </div>
                </div>

                {/* Данные Sheets (через снапшот) */}
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            <TableIcon className="h-4 w-4 text-primary" />
                            Данные расписания
                        </span>
                        <StatusPill tone={cron.rows === null ? "neutral" : "success"} />
                    </div>
                    <div className="divide-y divide-border/50">
                        <Row
                            label="Снапшот"
                            value={cron.rows === null ? "не сохранён" : "обновлён кроном"}
                            tone={cron.rows === null ? "neutral" : "success"}
                        />
                        <Row
                            label="Записей"
                            value={cron.rows === null ? "—" : cron.rows.toLocaleString("ru-RU")}
                        />
                    </div>
                </div>

                {/* Push */}
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            <BellRingIcon className="h-4 w-4 text-primary" />
                            Push-уведомления
                        </span>
                        <StatusPill tone={push.total === null ? "neutral" : push.total > 0 ? "success" : "neutral"} />
                    </div>
                    <div className="divide-y divide-border/50">
                        <Row
                            label="Активных подписок"
                            value={push.total === null ? "нет данных" : String(push.total)}
                        />
                        <Row label="С фильтром по группам" value={push.total === null ? "—" : String(push.withGroup)} />
                        <Row label="С фильтром по преподавателям" value={push.total === null ? "—" : String(push.withTeacher)} />
                    </div>
                </div>

                {/* AI */}
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            <BotIcon className="h-4 w-4 text-primary" />
                            AI-чат
                        </span>
                        <StatusPill tone={aiRatio >= 0.8 ? "warning" : aiRatio > 0 ? "info" : "neutral"} />
                    </div>
                    <div className="divide-y divide-border/50">
                        <Row
                            label="Запросов за сутки"
                            value={`${ai.count} / ${ai.limit}`}
                            tone={aiRatio >= 0.8 ? "warning" : undefined}
                        />
                        <Row
                            label="Загрузка лимита"
                            value={`${Math.round(aiRatio * 100)}%`}
                            tone={aiRatio >= 0.8 ? "warning" : undefined}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
