"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import { getLessonTypeColor } from "@/lib/lesson-type-colors";
import { getDeclension } from "@/lib/utils";
import { ScheduleItem } from "@/types/schedule";
import { isLessonActive, isToday } from "@/lib/time-utils";
import { TIME_SLOTS } from "@/lib/constants";
import { CalendarDaysIcon, ClockIcon, FileTextIcon, Location01Icon, UserIcon, UsersIcon } from "@/components/icons";
import { isWithinInterval, parse } from "date-fns";

/** Одна сетка на шапку и все строки: колонки не «прыгают» между сменами недели. */
const GRID = "grid grid-cols-[3.75rem_repeat(6,minmax(5.5rem,1fr))] gap-2";

interface DesktopScheduleViewProps {
    daysWithDates: { id: string; label: string; date: string; fullDate: string }[];
    filteredData: ScheduleItem[];
    weekStart: Date;
    weekEnd: Date;
    /** Группа уже выбрана — не дублируем её в каждой карточке. */
    showGroup?: boolean;
    /** Преподаватель уже выбран — не дублируем его в каждой карточке. */
    showTeacher?: boolean;
    onLessonClick: (lesson: ScheduleItem) => void;
}

export function DesktopScheduleView({
    daysWithDates,
    filteredData,
    weekStart,
    weekEnd,
    showGroup = true,
    showTeacher = true,
    onLessonClick
}: DesktopScheduleViewProps) {
    return (
        <div className="hidden sm:block space-y-2 overflow-x-auto">
            <div className={GRID}>
                <div className="flex items-center justify-center rounded-3xl border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                    Время
                </div>
                {daysWithDates.map((day) => (
                    <div
                        key={day.id}
                        className={cn(
                            "flex flex-col items-center justify-center rounded-3xl border px-2 py-1 leading-tight transition-colors",
                            isToday(day.fullDate)
                                ? "bg-primary text-primary-foreground border-primary shadow-md"
                                : "bg-muted"
                        )}
                    >
                        <span className="text-xs font-semibold sm:text-sm">{day.label}</span>
                        <span
                            className={cn(
                                "text-xs tabular-nums",
                                isToday(day.fullDate) ? "text-primary-foreground/80" : "text-muted-foreground"
                            )}
                        >
                            {day.date}
                        </span>
                    </div>
                ))}
            </div>

            {TIME_SLOTS.map((timeSlot) => {
                const [startTime, endTime] = timeSlot.split(" - ");

                return (
                    <div key={timeSlot} className={GRID}>
                        <div className="flex flex-col items-center justify-center rounded-3xl border bg-muted px-1 py-1.5 text-center font-mono text-xs leading-tight text-muted-foreground dark:text-foreground">
                            <span className="font-bold">{startTime}</span>
                            <span>{endTime}</span>
                        </div>

                        {daysWithDates.map((day) => {
                            const lessons = filteredData.filter(
                                (item) =>
                                    item.time === timeSlot &&
                                    item.dayOfWeek
                                        .toLowerCase()
                                        .includes(day.label.toLowerCase()) &&
                                    isWithinInterval(parse(item.date, "dd.MM.yyyy", new Date()), {
                                        start: weekStart,
                                        end: weekEnd,
                                    })
                            );

                            const isActive = isLessonActive(timeSlot, day.fullDate);

                            return lessons.length > 0 ? (
                                <Dialog key={`${day.id}-${timeSlot}`}>
                                    <DialogTrigger asChild>
                                        <div
                                            className={cn(
                                                "bg-card p-2.5 border rounded-3xl flex h-full flex-col gap-1 cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring transition-[color,background-color,border-color,box-shadow,transform] hover:bg-muted/50 hover:shadow-sm relative overflow-hidden",
                                                isActive && "border-success bg-success/5 ring-1 ring-success/20 z-10"
                                            )}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`${lessons[0].subject}, ${lessons[0].time}`}
                                            title={`${lessons[0].subject}\n${lessons[0].teacher}\nауд. ${lessons[0].classroom}`}
                                            onClick={() => onLessonClick(lessons[0])}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    onLessonClick(lessons[0]);
                                                }
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-1">
                                                <span className="line-clamp-2 text-xs font-semibold leading-tight">
                                                    {lessons[0].subject}
                                                </span>
                                                {lessons.length > 1 && (
                                                    <span className="shrink-0 rounded-xl border bg-background px-1 text-xs font-medium text-primary">
                                                        +{lessons.length - 1}
                                                    </span>
                                                )}
                                            </div>

                                            <span className="flex items-center gap-1 line-clamp-1 text-xs text-muted-foreground">
                                                <span className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", getLessonTypeColor(lessons[0].lessonType).dot)} />
                                                {lessons[0].lessonType}
                                            </span>

                                            <div className="mt-auto space-y-0.5 text-xs leading-tight text-muted-foreground">
                                                {showTeacher && (
                                                    <div className="truncate">{lessons[0].teacher}</div>
                                                )}
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="flex min-w-0 items-center gap-1">
                                                        <Location01Icon className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">ауд. {lessons[0].classroom}</span>
                                                    </span>
                                                    {showGroup && (
                                                        <span className="truncate font-medium">{lessons[0].group}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {isActive && (
                                                <Badge
                                                    key="desktop-badge-bottom"
                                                    variant="outline"
                                                    /* Концентрические радиусы: br повторяет угол ячейки (rounded-3xl),
                                                       tl — внутренний скруг. */
                                                    className="animate-pulse absolute bottom-0 right-0 flex h-4 items-center rounded-br-3xl rounded-tl-lg border-none px-1.5 text-xs leading-none bg-success text-success-foreground"
                                                >
                                                    Сейчас
                                                </Badge>
                                            )}
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="p-6 rounded-3xl shadow-lg">
                                        <div className="overflow-y-auto max-h-[calc(95vh-5rem)] flex flex-col gap-4 items-center">
                                            <DialogHeader>
                                                <DialogTitle className="text-center text-base font-semibold mt-6">
                                                    {lessons[0].subject}
                                                </DialogTitle>
                                                <DialogDescription className="sr-only">
                                                    Детальная информация о занятии
                                                </DialogDescription>
                                            </DialogHeader>
                                            {lessons.map((lesson, lessonIndex) => (
                                                <div
                                                    key={`${lesson.date}-${lesson.time}-${lesson.subject}-${lessonIndex}`}
                                                    className="w-full max-w-lg rounded-3xl px-5 py-3 divide-y divide-dashed"
                                                >
                                                    {lessonIndex > 0 && (
                                                        <div className="text-center font-semibold my-4">
                                                            {lesson.subject}
                                                        </div>
                                                    )}
                                                    {[
                                                        {
                                                            icon: <FileTextIcon className="w-5 h-5" />,
                                                            label: "Тип занятия",
                                                            value: lesson.lessonType,
                                                        },
                                                        {
                                                            icon: <UserIcon className="w-5 h-5" />,
                                                            label: "Преподаватель",
                                                            value: lesson.teacher,
                                                        },
                                                        {
                                                            icon: <UsersIcon className="w-5 h-5" />,
                                                            label: "Группа",
                                                            value: lesson.group,
                                                        },
                                                        {
                                                            icon: <Location01Icon className="w-5 h-5" />,
                                                            label: "Аудитория",
                                                            value: lesson.classroom,
                                                        },
                                                        {
                                                            icon: <CalendarDaysIcon className="w-5 h-5" />,
                                                            label: "Дата",
                                                            value: lesson.date,
                                                        },
                                                        {
                                                            icon: <ClockIcon className="w-5 h-5" />,
                                                            label: "Время",
                                                            value: lesson.time,
                                                        },
                                                    ].map(({ icon, label, value }, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {icon}
                                                                <span className="text-left">{value}</span>
                                                            </div>
                                                            <Badge
                                                                variant="outline"
                                                                className="px-3 py-0.5 rounded-full"
                                                            >
                                                                {/* Оптический центр: строка центрируется по боксy, а «р», «у», «д»
                                                                    уходят вниз — без сдвига подпись с выносными визуально
                                                                    провисает на 1–2 px. Сдвиг 0.75 px выверен по пикселям. */}
                                                                <span className="relative top-[-0.75px]">{label}</span>
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            ) : (
                                <div
                                    key={`${day.id}-${timeSlot}`}
                                    className="flex items-center justify-center rounded-3xl border border-dashed border-border px-1 py-1.5 text-xs text-muted-foreground/30"
                                >
                                    —
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div >
    );
}
