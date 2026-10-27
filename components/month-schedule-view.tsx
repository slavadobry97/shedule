"use client";

import { useState, useMemo } from "react";
import { cn } from "cn";
import { ScheduleItem } from "@/types/schedule";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isToday,
    isBefore,
    addDays,
    addMonths,
    getDay,
    parse,
} from "date-fns";
import { DayAgenda } from "./day-agenda";
import { useHorizontalSwipe } from "@/lib/use-swipe-navigation";

interface MonthScheduleViewProps {
    date: Date;
    setDate: (date: Date) => void;
    filteredData: ScheduleItem[];
    selectedGroup: string;
    selectedTeacher: string;
    onLessonClick: (lesson: ScheduleItem) => void;
    triggerHaptic: (type?: "light" | "medium" | "heavy") => void;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function MonthScheduleView({
    date,
    setDate,
    filteredData,
    selectedGroup,
    selectedTeacher,
    onLessonClick,
    triggerHaptic,
}: MonthScheduleViewProps) {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    // Days of the month grid, padded to start on Monday.
    const gridDays = useMemo(() => {
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const leading = (getDay(monthStart) + 6) % 7; // 0 = Monday
        const cells: (Date | null)[] = Array(leading).fill(null);
        cells.push(...days);
        // pad to full weeks
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    }, [monthStart, monthEnd]);

    const lessonsByDay = useMemo(() => {
        const map = new Map<string, ScheduleItem[]>();
        for (const item of filteredData) {
            const d = parse(item.date, "dd.MM.yyyy", new Date());
            if (d < monthStart || d > monthEnd) continue;
            const key = format(d, "yyyy-MM-dd");
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(item);
        }
        // Внутри дня — по времени начала пары (источник не отсортирован)
        for (const list of map.values()) {
            list.sort((a, b) => a.time.split(" - ")[0].localeCompare(b.time.split(" - ")[0]));
        }
        return map;
    }, [filteredData, monthStart, monthEnd]);

    const [selectedDay, setSelectedDay] = useState<Date>(() => {
        const today = new Date();
        if (today >= monthStart && today <= monthEnd) return today;
        // first day with lessons, else month start
        const firstWith = gridDays.find((d) => d && lessonsByDay.has(format(d, "yyyy-MM-dd")));
        return firstWith || monthStart;
    });

    // keep selectedDay in month when month changes
    const selectedKey = format(selectedDay, "yyyy-MM-dd");
    const selectedLessons = lessonsByDay.get(selectedKey) || [];

    // Свайпы (№120): по панели — соседний день, по сетке — соседний месяц
    const panelSwipe = useHorizontalSwipe(
        () => { triggerHaptic("light"); setSelectedDay(addDays(selectedDay, 1)); },
        () => { triggerHaptic("light"); setSelectedDay(addDays(selectedDay, -1)); }
    );
    const gridSwipe = useHorizontalSwipe(
        () => { triggerHaptic("light"); setDate(addMonths(date, 1)); },
        () => { triggerHaptic("light"); setDate(addMonths(date, -1)); }
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                {/* Month grid */}
                <div className="space-y-1.5">
                    <div className="grid grid-cols-7 gap-1.5">
                        {WEEKDAYS.map((wd) => (
                            <div key={wd} className="text-center text-xxs font-semibold text-muted-foreground py-1">
                                {wd}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5" {...gridSwipe}>
                        {gridDays.map((day, idx) => {
                            if (!day) {
                                return <div key={`empty-${idx}`} className="min-h-15 sm:min-h-18" />;
                            }
                            const key = format(day, "yyyy-MM-dd");
                            const count = lessonsByDay.get(key)?.length || 0;
                            const isSelected = isSameDay(day, selectedDay);
                            const today = isToday(day);
                            // Прошедшие дни приглушены, кроме сегодня и выбранного (№118)
                            const isPast = !today && isBefore(day, new Date());
                            return (
                                <button
                                    key={key}
                                    onClick={() => {
                                        triggerHaptic("light");
                                        setSelectedDay(day);
                                    }}
                                    className={cn(
                                        "flex flex-col items-start gap-1 rounded-3xl border p-1.5 min-h-15 sm:min-h-18 text-left transition-colors",
                                        // Дни с занятиями — чистая карточка над полотном
                                        // (ui-guidelines), пустые дни остаются на canvas
                                        count > 0 && "bg-card",
                                        today && "border-primary",
                                        isSelected && "bg-primary/5 ring-1 ring-primary/30",
                                        (count === 0 || isPast) && "opacity-60"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "text-xs font-semibold tabular-nums",
                                            today && "text-primary",
                                            isSelected && "text-primary"
                                        )}
                                    >
                                        {format(day, "d")}
                                    </span>
                                    {count > 0 && (
                                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Day agenda panel — общий DayAgenda (№117): склейка подгрупп,
                    сортировка, «Сейчас» и приглушение прошедшего — как во
                    вкладке «День»; плотная вёрстка (compact) */}
                <div {...panelSwipe}>
                    <DayAgenda
                        date={selectedDay}
                        lessons={selectedLessons}
                        selectedGroup={selectedGroup}
                        onLessonClick={onLessonClick}
                        compact
                    />
                </div>
            </div>
    );
}
