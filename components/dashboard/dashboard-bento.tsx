import {
    BellRingIcon,
    BotIcon,
    ClockIcon,
    RefreshIcon,
} from "@/components/icons";
import { cn } from "cn";

/**
 * Операционная панель — вариант «Острова» (выбор владельца 14.11).
 * Сервер собирает DashboardData из реальных источников (push-utils Redis,
 * debug-ai-limit) и передаёт готовый снимок; компонент только рисует.
 * null в поле — источник недоступен или пуст: строка честно гасится.
 *
 * Язык панели — для методиста, который ведёт расписание и не разбирается
 * в ИТ: никаких «кронов», «снапшотов» и «лимитов», только то, что это
 * значит для расписания.
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

function StatusPill({ tone, label }: { tone: Tone; label?: string }) {
    // text-xxs — токен globals.css; в cn он выживает: кегли xxs/tiny
    // зарегистрированы в lib/cn.ts (createCn из cn/config, тест — npm run test:cn).
    // inline-flex + h-5 + leading-none: глиф центрируется флексом, а не наследует
    // высокие метрики строки Geist Mono. Внутренний span translate-y-[0.5px] —
    // оптика: капс кириллицы без сдвига сидит на 0.5px выше геометрического
    // центра (воздух 5.5/6.5px); +1px перекосяет вниз.
    return (
        <span className={cn("inline-flex h-5 items-center justify-center rounded-full border px-2.5 font-mono text-xxs leading-none uppercase tracking-[0.14em]", PILL[tone])}>
            <span className="translate-y-[0.5px]">{label ?? "Нет данных"}</span>
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

/** «2 минуты», «5 минут» — с русскими падежами */
function plural(n: number, forms: [string, string, string]): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
    return forms[2];
}

/** «7 минут назад», «4 часа 17 минут назад» */
function ago(ts: number, now: number): string {
    const min = Math.max(0, Math.round((now - ts) / 60000));
    if (min < 1) return "только что";
    if (min < 60) return `${min} ${plural(min, ["минуту", "минуты", "минут"])} назад`;
    const h = Math.floor(min / 60);
    const rest = min % 60;
    const hPart = `${h} ${plural(h, ["час", "часа", "часов"])}`;
    return rest === 0
        ? `${hPart} назад`
        : `${hPart} ${rest} ${plural(rest, ["минуту", "минуты", "минут"])} назад`;
}

function fmtTime(ts: number): string {
    return new Date(ts).toLocaleTimeString("ru-RU");
}

/** Свежесть расписания словами: что это значит для методиста */
function freshness(lastCheck: number | null, now: number): { tone: Tone; label: string } {
    if (lastCheck === null) return { tone: "neutral", label: "Ещё не обновлялось" };
    const min = (now - lastCheck) / 60000;
    if (min < 15) return { tone: "success", label: "Обновлено" };
    if (min < 120) return { tone: "warning", label: "Обновлялось давно" };
    return { tone: "danger", label: "Не обновлялось долго" };
}

export function DashboardBento({ data }: { data: DashboardData }) {
    const { cron, push, ai, generatedAt } = data;
    const fresh = freshness(cron.lastCheck, generatedAt);

    const aiLeft = Math.max(0, ai.limit - ai.count);
    const aiRatio = ai.limit > 0 ? ai.count / ai.limit : 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 font-mono text-tiny text-muted-foreground">
                <ClockIcon className="h-3.5 w-3.5" />
                данные на {fmtTime(generatedAt)}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {/* Расписание */}
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            <RefreshIcon className="h-4 w-4 text-primary" />
                            Расписание
                        </span>
                        <StatusPill tone={fresh.tone} label={fresh.label} />
                    </div>
                    <div className="divide-y divide-border/50">
                        <Row
                            label="Последнее обновление"
                            value={cron.lastCheck === null ? "ещё не было" : `${fmtTime(cron.lastCheck)} · ${ago(cron.lastCheck, generatedAt)}`}
                            tone={fresh.tone === "neutral" ? undefined : fresh.tone}
                        />
                        <Row
                            label="Занятий в базе"
                            value={cron.rows === null ? "пока нет" : cron.rows.toLocaleString("ru-RU")}
                            tone={cron.rows === null ? "neutral" : undefined}
                        />
                    </div>
                </div>

                {/* Уведомления */}
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            <BellRingIcon className="h-4 w-4 text-primary" />
                            Уведомления
                        </span>
                        <StatusPill
                            tone={push.total === null ? "neutral" : push.total > 0 ? "success" : "neutral"}
                            label={push.total === null ? "Нет данных" : push.total > 0 ? "Работают" : "Не подключены"}
                        />
                    </div>
                    <div className="divide-y divide-border/50">
                        <Row
                            label="Получают уведомления"
                            value={push.total === null ? "нет данных" : `${push.total} ${plural(push.total, ["человек", "человека", "человек"])}`}
                        />
                        <Row
                            label="Следят за своей группой"
                            value={push.total === null ? "—" : String(push.withGroup)}
                        />
                        <Row
                            label="Следят за преподавателем"
                            value={push.total === null ? "—" : String(push.withTeacher)}
                        />
                    </div>
                </div>

                {/* ИИ-помощник */}
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            <BotIcon className="h-4 w-4 text-primary" />
                            ИИ-помощник
                        </span>
                        <StatusPill tone={aiRatio >= 0.8 ? "warning" : "success"} label={aiRatio >= 0.8 ? "Ответы на исходе" : "Всё хорошо"} />
                    </div>
                    <div className="divide-y divide-border/50">
                        <Row
                            label="Вопросов сегодня"
                            value={`${ai.count} из ${ai.limit}`}
                            tone={aiRatio >= 0.8 ? "warning" : undefined}
                        />
                        <Row
                            label="Осталось ответов"
                            value={String(aiLeft)}
                            tone={aiRatio >= 0.8 ? "warning" : undefined}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
