"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn, getDeclension } from "@/lib/utils";
import { ScheduleItem } from "@/types/schedule";
import { isLessonActive, isToday } from "@/lib/time-utils";
import { TIME_SLOTS } from "@/lib/constants";
import { CalendarDays, Clock, FileText, MapPin, User, Users } from "lucide-react";
import { isWithinInterval, parse } from "date-fns";
import { useMemo } from "react";

interface DesktopScheduleViewProps {
    daysWithDates: { id: string; label: string; date: string; fullDate: string }[];
    filteredData: ScheduleItem[];
    weekStart: Date;
    weekEnd: Date;
    onLessonClick: (lesson: ScheduleItem) => void;
}

export function DesktopScheduleView({
    daysWithDates,
    filteredData,
    weekStart,
    weekEnd,
    onLessonClick
}: DesktopScheduleViewProps) {
    return (
        <div className="hidden sm:block space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[repeat(7,minmax(200px,1fr))] gap-4">
                <div className="flex flex-col items-center justify-center border bg-slate-100 dark:bg-gray-900 p-4 rounded-xl">
                    <h2 className="text-sm sm:text-lg font-semibold">Время</h2>
                </div>
                {daysWithDates.map((day) => (
                    <div
                        key={day.id}
                        className={cn(
                            "flex flex-col items-center justify-center border p-4 rounded-xl transition-colors",
                            isToday(day.fullDate)
                                ? "bg-primary text-primary-foreground border-primary shadow-md transform scale-[1.02]"
                                : "bg-slate-100 dark:bg-gray-900"
                        )}
                    >
                        <h2 className="text-sm sm:text-lg font-semibold">{day.label}</h2>
                        <h2 className="text-xs sm:text-sm">{day.date}</h2>
                    </div>
                ))}
            </div>

            {
                TIME_SLOTS.map((timeSlot) => (
                    <div
                        key={timeSlot}
                        className="grid grid-cols-1 md:grid-cols-[repeat(7,minmax(200px,1fr))] gap-4"
                    >
                        <div className="flex items-center justify-center border text-slate-500 dark:text-slate-50 bg-slate-100 dark:bg-gray-900 p-4 rounded-xl font-black text-sm sm:text-2xl">
                            {timeSlot}
                        </div>

                        {daysWithDates.map((day, index) => {
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
                                                "p-3 border rounded-xl flex flex-col justify-between h-full cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all hover:bg-muted/50 relative overflow-hidden",
                                                isActive && "border-green-500 ring-1 ring-green-500/10 shadow-sm bg-green-50/50 dark:bg-green-900/10 z-10 scale-[1.02]"
                                            )}
                                            onClick={() => onLessonClick(lessons[0])}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    onLessonClick(lessons[0]);
                                                }
                                            }}
                                        >
                                            <div className="space-y-1 leading-relaxed">
                                                <div className="font-semibold text-sm pr-4 relative">
                                                    <span className="flex-1">{lessons[0].subject}</span>
                                                    {lessons.length > 1 && (
                                                        <span className="absolute -top-1 -right-1 text-xxs font-medium text-primary bg-background/90 px-1.5 py-0.5 rounded-lg border shadow-sm pointer-events-none">
                                                            +{lessons.length - 1}{" "}
                                                            {getDeclension(lessons.length - 1, [
                                                                "занятие",
                                                                "занятия",
                                                                "занятий",
                                                            ])}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs">{lessons[0].lessonType}</div>
                                            </div>
                                            <div className="mt-4 space-y-1">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <span className="text-xs text-right font-bold text-muted-foreground">
                                                        {lessons[0].group}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-end space-x-2">
                                                    <span className="text-xs text-right">
                                                        {lessons[0].teacher}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-end space-x-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span className="text-xs text-right">
                                                        ауд. {lessons[0].classroom}
                                                    </span>
                                                </div>
                                                {isActive && (
                                                    <div className="absolute bottom-2 left-2">
                                                        <Badge key="desktop-badge-bottom" variant="default" className="animate-pulse bg-green-600 hover:bg-green-700 text-white border-none px-1.5 py-0 text-[10px] h-5">Сейчас</Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="p-6 rounded-xl shadow-lg animate-fade-in">
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
                                                    className="w-full max-w-lg rounded-md px-5 py-3 divide-y divide-dashed"
                                                >
                                                    {lessonIndex > 0 && (
                                                        <div className="text-center font-semibold my-4">
                                                            {lesson.subject}
                                                        </div>
                                                    )}
                                                    {[
                                                        {
                                                            icon: <FileText className="w-5 h-5" />,
                                                            label: "Тип занятия",
                                                            value: lesson.lessonType,
                                                        },
                                                        {
                                                            icon: <User className="w-5 h-5" />,
                                                            label: "Преподаватель",
                                                            value: lesson.teacher,
                                                        },
                                                        {
                                                            icon: <Users className="w-5 h-5" />,
                                                            label: "Группа",
                                                            value: lesson.group,
                                                        },
                                                        {
                                                            icon: <MapPin className="w-5 h-5" />,
                                                            label: "Аудитория",
                                                            value: lesson.classroom,
                                                        },
                                                        {
                                                            icon: <CalendarDays className="w-5 h-5" />,
                                                            label: "Дата",
                                                            value: lesson.date,
                                                        },
                                                        {
                                                            icon: <Clock className="w-5 h-5" />,
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
                                                                className="px-3 py-1 rounded-full"
                                                            >
                                                                {label}
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
                                    className="flex items-center justify-center p-4 border text-inherit bg-slate-50 dark:bg-gray-950 rounded-xl border-dashed"
                                >
                                    Нет занятий
                                </div>
                            );
                        })}
                    </div>
                ))
            }
        </div >
    );
}
