"use client";

import { useMemo } from "react";
import { cn } from "cn";
import { ScheduleItem } from "@/types/schedule";
import { format, isBefore, isToday, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { isLessonActive, isLessonPast } from "@/lib/time-utils";
import { getLessonTypeColor } from "@/lib/lesson-type-colors";
import { getDeclension } from "@/lib/utils";
import { mergeGroupLessons } from "@/lib/schedule-utils";

interface DayAgendaProps {
    date: Date;
    /** Занятия этого дня в порядке источника — склейка и сортировка внутри */
    lessons: ScheduleItem[];
    selectedGroup: string;
    onLessonClick: (lesson: ScheduleItem) => void;
    /** Плотная вёрстка для панели дня вида «Месяц» */
    compact?: boolean;
    /** Подсветка идущей пары («Сейчас») и приглушение прошедшего */
    showActive?: boolean;
}

/**
 * Список занятий одного дня — общий для вкладки «День» и панели дня
 * вида «Месяц» (№117): шапка дня со счётчиком + склеенные и отсортированные
 * по времени пары. Различия видов — плотность (compact) и подсветка
 * активной пары (showActive).
 *
 * Приглушение прошедшего (№118): прошлый день гасится целиком, сегодняшний —
 * по парам через isLessonPast; активная пара не гасится никогда. Рецепт
 * тот же, что у прошедших карточек в мобильной «Неделе»:
 * opacity-60 grayscale-[0.5] bg-muted/30.
 */
export function DayAgenda({
    date,
    lessons,
    selectedGroup,
    onLessonClick,
    compact = false,
    showActive = true,
}: DayAgendaProps) {
    const dayLessons = useMemo(() => mergeGroupLessons(lessons), [lessons]);

    const today = isToday(date);
    const isPastDay = showActive && isBefore(startOfDay(date), startOfDay(new Date()));

    return (
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-card divide-y divide-border/60">
            {/* Заголовок дня */}
            <div className={cn("flex items-center justify-between gap-2", compact ? "px-4 pt-4 pb-3" : "px-5 pt-5 pb-4")}>
                <div className="flex items-center gap-2">
                    <h3 className={cn("font-semibold", compact ? "text-sm" : "text-base")}>
                        {format(date, "EEEE, d MMMM", { locale: ru })}
                    </h3>
                    {today && (
                        <span className="text-xxs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Сегодня
                        </span>
                    )}
                </div>
                <span className="text-xxs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {dayLessons.length} {getDeclension(dayLessons.length, ["пара", "пары", "пар"])}
                </span>
            </div>

            {dayLessons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm px-4">
                    <span className="text-2xl mb-1">—</span>
                    Занятий нет
                </div>
            ) : (
                dayLessons.map((lesson, i) => {
                    const isActive = showActive && isLessonActive(lesson.time, lesson.date);
                    const isPast = showActive && !isActive && (isPastDay || (today && isLessonPast(lesson.time, lesson.date)));
                    return (
                        <button
                            key={i}
                            onClick={() => onLessonClick(lesson)}
                            className={cn(
                                "w-full text-left hover:bg-muted/40 transition-colors relative overflow-hidden",
                                compact ? "px-4 py-3" : "px-5 py-4",
                                isActive && "bg-success/5",
                                isPast && "opacity-60 grayscale-[0.5] bg-muted/30"
                            )}
                        >
                            {isActive && (
                                // Концентрические радиусы: br повторяет угол карточки (rounded-3xl), tl — внутренний скруг.
                                <div className="animate-pulse absolute bottom-0 right-0 flex h-5 items-center rounded-br-3xl rounded-tl-lg border-none px-2 text-xs leading-none bg-success text-success-foreground font-medium">
                                    Сейчас
                                </div>
                            )}
                            {/* Время и аудитория в одной строке, название — на всю
                                ширину: зажатый между ними заголовок давил переносы
                                и создавал иллюзию центрирования (отзыв 26.10). */}
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-mono text-muted-foreground tabular-nums">
                                    {lesson.time}
                                </span>
                                <span className="text-xs font-medium text-primary shrink-0">
                                    ауд. {lesson.classroom}
                                </span>
                            </div>
                            <div className="text-sm font-semibold leading-tight line-clamp-2 mt-0.5">
                                {lesson.subject}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground truncate">
                                    {lesson.teacher}
                                </span>
                            </div>
                            {/* items-start + mt-1: точка центрирована по ПЕРВОЙ строке текста
                                (8px точка, отступ 4px = центр строки 16px), при переносе
                                текста на 2 строки не уезжает в середину блока. */}
                            <div className="flex items-start gap-1.5">
                                <span className={cn("inline-block h-2 w-2 mt-1 rounded-full shrink-0", getLessonTypeColor(lesson.lessonType).dot)} />
                                <span className={cn("text-xs font-medium", getLessonTypeColor(lesson.lessonType).text)}>
                                    {lesson.lessonType}
                                </span>
                            </div>
                            {selectedGroup === "all" && lesson.groups.length > 0 && (
                                <div className="text-xs text-muted-foreground truncate mt-0.5">
                                    {lesson.groups.join(", ")}
                                </div>
                            )}
                        </button>
                    );
                })
            )}
        </div>
    );
}
