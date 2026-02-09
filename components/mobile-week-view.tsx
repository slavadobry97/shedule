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
                "relative flex flex-col items-center justify-center h-16 rounded-xl transition-all duration-200 border shrink-0 z-10 p-0",
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
    // Minimize date calculations
    const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
    const today = useMemo(() => startOfToday(), []);

    return (
        <div
            className={cn("relative py-2 px-1", className)}
            role="tablist"
            aria-label="Calendar week view"
        >
            <div className="grid grid-cols-6 gap-1 w-full">
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
