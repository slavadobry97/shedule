"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MOTION_DURATION, motionTransition } from "@/lib/motion";
import { cn } from "cn";

const DAYS = ["ПН", "ВТ", "СР", "ЧТ", "ПТ"];
const TIMES = ["08.30", "10.10", "12.10", "13.50", "15.30"];

type Tone = "default" | "active" | "changed";

const LESSONS: Array<[row: number, col: number, title: string, room: string, tone: Tone]> = [
    [0, 0, "Физика", "214", "default"],
    [0, 2, "Математика", "301", "default"],
    [1, 3, "Немецкий", "118", "default"],
    [2, 1, "Информатика", "407", "active"],
    [3, 4, "История", "205", "default"],
    [4, 0, "Физика", "214", "changed"],
];

/**
 * Фрагмент недели — визитная карточка продукта.
 * Чистая вёрстка на токенах дизайн-системы, данные иллюстративные.
 */
export function WeekPreview() {
    const reduceMotion = useReducedMotion();

    const reveal = (delay: number) =>
        reduceMotion
            ? {}
            : {
                initial: { opacity: 0, y: 6 },
                animate: { opacity: 1, y: 0 },
                transition: motionTransition(reduceMotion, { duration: MOTION_DURATION.base, delay }),
            };

    return (
        <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-[0_1px_2px_hsl(222_47%_11%/0.05)]">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-tiny uppercase tracking-[0.18em] text-muted-foreground">
                    Неделя
                </span>
                <span className="font-mono text-tiny tabular-nums text-muted-foreground">
                    21–25.10
                </span>
            </div>

            <div className="grid grid-cols-[auto_repeat(4,minmax(0,1fr))] gap-px overflow-hidden rounded-3xl border border-border/60 bg-border sm:grid-cols-[auto_repeat(5,minmax(0,1fr))]">
                <div className="bg-muted/40" aria-hidden="true" />

                {DAYS.map((day, index) => (
                    <motion.div
                        key={day}
                        {...reveal(0.05 + index * 0.05)}
                        className={cn(
                            "bg-background px-1 py-2 text-center font-mono text-xxs uppercase tracking-[0.12em] text-muted-foreground",
                            index === DAYS.length - 1 && "hidden sm:block"
                        )}
                    >
                        {day}
                    </motion.div>
                ))}

                {TIMES.map((time, row) => (
                    <Fragment key={time}>
                        <div className="bg-muted/40 px-2 py-2.5 text-right font-mono text-xxs tabular-nums text-muted-foreground">
                            {time}
                        </div>

                        {DAYS.map((day, col) => {
                            const lesson = LESSONS.find(([r, c]) => r === row && c === col);
                            const isLastDay = col === DAYS.length - 1;

                            if (!lesson) {
                                return (
                                    <div
                                        key={day}
                                        className={cn(
                                            "min-h-[54px] bg-background",
                                            isLastDay && "hidden sm:block"
                                        )}
                                    />
                                );
                            }

                            const [, , title, room, tone] = lesson;

                            return (
                                <motion.div
                                    key={day}
                                    {...reveal(0.25 + (row * 5 + col) * 0.03)}
                                    className={cn(
                                        "relative min-h-[54px] p-1.5",
                                        tone === "active"
                                            ? "bg-primary/10 ring-1 ring-inset ring-primary/40"
                                            : "bg-background",
                                        isLastDay && "hidden sm:block"
                                    )}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-tiny font-medium leading-tight break-words">
                                            {title}
                                        </span>
                                        {tone === "changed" && (
                                            <span className="shrink-0 rounded-2xl bg-warning/15 px-1 font-mono text-xxs uppercase leading-none tracking-wide text-warning">
                                                изм
                                            </span>
                                        )}
                                    </div>
                                    <div className="font-mono text-xxs leading-tight text-muted-foreground">
                                        Ауд. {room}
                                    </div>

                                    {tone === "active" && (
                                        <span
                                            className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-primary"
                                            aria-label="текущая пара"
                                        />
                                    )}
                                </motion.div>
                            );
                        })}
                    </Fragment>
                ))}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
                Время, дисциплина, аудитория. Изменения помечаются сразу.
            </p>
        </div>
    );
}
