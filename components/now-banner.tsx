"use client";

import { useMemo } from "react";
import { ScheduleItem } from "@/types/schedule";
import { isLessonActive, getLessonProgress } from "@/lib/time-utils";
import { mergeGroupLessons } from "@/lib/schedule-utils";
import { getDeclension } from "@/lib/utils";
import { useNow } from "@/hooks/use-now";
import { cn } from "cn";

interface NowBannerProps {
    /** Занятия выбранного дня (сырые — склейка групп внутри) */
    lessons: ScheduleItem[];
    /** «Все группы» — в баннере показываем список групп пары */
    showGroups?: boolean;
}

/**
 * Баннер идущей сейчас пары (мобильный «День», №131): синяя плашка
 * с полосой продолжительности — «сколько ещё осталось» считывается
 * по заполненности полосы, без чтения цифр. Показывается только пока
 * пара реально идёт (isLessonActive): вечером и между парами баннера
 * нет вовсе — постоянная пустышка съедала бы первый экран.
 * Прогресс обновляется раз в 30 с; prefers-reduced-motion гасит
 * пульсацию точки и переход ширины глобально (globals.css).
 */
export function NowBanner({ lessons, showGroups = false }: NowBannerProps) {
    const now = useNow();

    const merged = useMemo(() => mergeGroupLessons(lessons), [lessons]);

    const active = useMemo(
        () => merged.find((lesson) => isLessonActive(lesson.time, lesson.date)) ?? null,
        // now — сигнал пересчёта при смене пары по таймеру
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [merged, now]
    );

    if (!active) return null;

    const progress = getLessonProgress(active.time, active.date) ?? 0;
    const remainingMinutes = Math.max(1, Math.round((1 - progress) * slotMinutes(active.time)));

    return (
        <div className="mb-3 rounded-3xl bg-primary text-primary-foreground px-5 py-4">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono tabular-nums opacity-80">
                    {active.time}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium">
                    <span className="animate-pulse inline-block h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                    Идёт сейчас
                </span>
            </div>
            <div className="text-base font-evolventa font-semibold leading-tight mt-1">
                {active.subject}
            </div>
            <div className="text-xs opacity-80 truncate mt-0.5">
                ауд. {active.classroom} · {active.teacher}
            </div>
            {showGroups && active.groups.length > 0 && (
                <div className="text-xs opacity-70 truncate mt-0.5">
                    {active.groups.join(", ")}
                </div>
            )}
            {/* Полоса продолжительности: заполненность = прошло/всего */}
            <div className="mt-3 h-1 rounded-full bg-primary-foreground/25 overflow-hidden">
                <div
                    className="h-full rounded-full bg-primary-foreground transition-[width] duration-1000 ease-linear"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                />
            </div>
            <div className="mt-1.5 text-right text-xs font-mono opacity-70">
                осталось {remainingMinutes} {getDeclension(remainingMinutes, ["минута", "минуты", "минут"])}
            </div>
        </div>
    );
}

/** Длительность слота "HH.MM - HH.MM" в минутах (для перевода доли в минуты) */
function slotMinutes(timeSlot: string): number {
    const [startStr, endStr] = timeSlot.split(" - ");
    const [startHour, startMinute] = (startStr ?? "0.0").split(".").map(Number);
    const [endHour, endMinute] = (endStr ?? "0.0").split(".").map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    return Math.max(1, end - start);
}

interface LessonProgressStripProps {
    /** Слот "HH.MM - HH.MM" */
    timeSlot: string;
    /** Дата слота "dd.MM.yyyy" */
    dateStr: string;
}

/**
 * Полоса продолжительности идущей пары по нижнему краю карточки
 * (мобильная «Неделя», №131): заполненность = прошло/всего, растёт
 * сама раз в 30 с. Рендерится только пока пара идёт; карточка должна
 * быть relative overflow-hidden — углы срезаются её радиусом.
 */
export function LessonProgressStrip({ timeSlot, dateStr }: LessonProgressStripProps) {
    useNow();
    const progress = getLessonProgress(timeSlot, dateStr);
    if (progress === null) return null;

    return (
        // Трек во всю ширину карточки + заполнение: прогресс читается
        // сразу, а не только когда пара «накатала» треть
        <div className="absolute inset-x-0 bottom-0 h-1 bg-success/15">
            <div
                className="h-full bg-success transition-[width] duration-1000 ease-linear"
                style={{ width: `${Math.round(progress * 100)}%` }}
            />
        </div>
    );
}
