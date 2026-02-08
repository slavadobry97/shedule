"use client";

import { cn } from "@/lib/utils";
import { addDays, format, isSameDay, startOfWeek, isBefore, startOfToday } from "date-fns";
import React, { useRef, useEffect, useMemo } from "react";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { motion } from "framer-motion";

interface MobileWeekViewProps {
    currentDate: Date;
    onSelectDate: (date: Date) => void;
    className?: string;
}

import { Button } from "@/components/ui/button";

interface DayButtonProps {
    date: Date;
    dayLabel: string;
    isSelected: boolean;
    isPast: boolean;
    onSelect: (date: Date) => void;
}

const DayButton = React.memo(({ date, dayLabel, isSelected, isPast, onSelect }: DayButtonProps) => {
    const dayNumber = format(date, "dd");

    return (
        <Button
            variant="ghost"
            onClick={() => onSelect(date)}
            data-active={isSelected}
            role="tab"
            aria-selected={isSelected}
            aria-label={`${dayLabel}, ${dayNumber}`}
            className={cn(
                "relative flex flex-col items-center justify-center min-w-[3.5rem] h-16 rounded-xl transition-all duration-200 border shrink-0 z-10 p-0",
                isSelected ? "border-transparent font-bold scale-105 hover:bg-transparent" : "border-border hover:bg-muted bg-background",
                isPast && !isSelected && "opacity-60"
            )}
        >
            {isSelected && (
                <motion.div
                    layoutId="active-day-bg"
                    className="absolute -inset-px bg-primary rounded-xl -z-10 shadow-md"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}

            <span className={cn("text-xs mb-0.5 relative z-20", isSelected ? "text-primary-foreground/90" : "text-muted-foreground")}>
                {dayLabel}
            </span>
            <span className={cn("text-lg leading-none font-bold relative z-20", isSelected ? "text-primary-foreground" : "text-foreground")}>
                {dayNumber}
            </span>
        </Button>
    );
});

DayButton.displayName = "DayButton";

export function MobileWeekView({ currentDate, onSelectDate, className }: MobileWeekViewProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Minimize date calculations
    const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
    const today = useMemo(() => startOfToday(), []);

    // Scroll active element into view
    useEffect(() => {
        if (scrollRef.current) {
            const activeElement = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement;
            if (activeElement) {
                const container = scrollRef.current;

                // Calculate position relative to container
                const scrollLeft = activeElement.offsetLeft - (container.offsetWidth / 2) + (activeElement.offsetWidth / 2);

                container.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentDate]);

    return (
        <div
            ref={scrollRef}
            className={cn("relative h-20 overflow-hidden touch-pan-y overscroll-none", className)}
            role="tablist"
            aria-label="Calendar week view"
        >
            <div
                className="flex space-x-2 overflow-x-auto py-2 px-4 scrollbar-hide w-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {DAYS_OF_WEEK.map((day, index) => {
                    const date = addDays(weekStart, index);
                    const isSelected = isSameDay(date, currentDate);
                    const isPast = isBefore(date, today);

                    return (
                        <DayButton
                            key={day.label}
                            date={date}
                            dayLabel={day.label}
                            isSelected={isSelected}
                            isPast={isPast}
                            onSelect={onSelectDate}
                        />
                    );
                })}
            </div>
        </div>
    );
}
