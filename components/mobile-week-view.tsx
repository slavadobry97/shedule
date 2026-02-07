"use client";

import { cn } from "@/lib/utils";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import React, { useRef, useEffect } from "react";
import { DAYS_OF_WEEK } from "@/lib/constants";

interface MobileWeekViewProps {
    currentDate: Date;
    onSelectDate: (date: Date) => void;
    className?: string;
}

export function MobileWeekView({ currentDate, onSelectDate, className }: MobileWeekViewProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Получаем начало текущей недели (Понедельник)
    // date-fns startOfWeek по умолчанию воскресенье (0), поэтому weekStartsOn: 1
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

    // Прокручиваем к выбранному дню при монтировании или изменении
    useEffect(() => {
        if (scrollRef.current) {
            // Находим активный элемент
            const activeElement = scrollRef.current.querySelector('[data-active="true"]');
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [currentDate]);

    return (
        <div
            ref={scrollRef}
            className={cn("flex space-x-2 overflow-x-auto pb-2 scrollbar-hide snap-x justify-center", className)}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {DAYS_OF_WEEK.map((day, index) => {
                const dayLabel = day.label;
                const date = addDays(weekStart, index);
                const isSelected = isSameDay(date, currentDate);
                const dayNumber = format(date, "dd");

                return (
                    <button
                        key={dayLabel}
                        data-active={isSelected}
                        onClick={() => onSelectDate(date)}
                        className={cn(
                            "flex flex-col items-center justify-center min-w-[3.5rem] h-16 rounded-xl transition-all duration-200 snap-center border",
                            isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-md font-bold"
                                : "bg-background text-foreground border-border hover:bg-muted"
                        )}
                    >
                        <span className={cn("text-xs mb-0.5", isSelected ? "text-primary-foreground/90" : "text-muted-foreground")}>
                            {dayLabel}
                        </span>
                        <span className="text-lg leading-none font-bold">
                            {dayNumber}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
