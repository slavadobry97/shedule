"use client";


import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, getDeclension } from "@/lib/utils";
import { ScheduleItem } from "@/types/schedule";
import { isLessonActive, isLessonPast } from "@/lib/time-utils";
import { motion, AnimatePresence } from "framer-motion";
import { DATE_FORMATS, getPairNumber } from "@/lib/constants";
import {
    CalendarDays,
    Clock,
    FileText,
    MapPin,
    Search,
    User,
    Users,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { addDays, format, isSameDay, parse, startOfWeek, getDay } from "date-fns";
import { ru } from "date-fns/locale";
import { MobileWeekView } from "./mobile-week-view";
import { useState, useRef } from "react";

interface MobileScheduleViewProps {
    date: Date;
    setDate: (date: Date) => void; // Using setter directly or a callback wrapper
    filteredData: ScheduleItem[];
    selectedGroup: string;
    selectedTeacher: string;
    onLessonClick: (lesson: ScheduleItem) => void;
    triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
}

export function MobileScheduleView({
    date,
    setDate,
    filteredData,
    selectedGroup,
    selectedTeacher,
    onLessonClick,
    triggerHaptic
}: MobileScheduleViewProps) {

    // Helper wrapper for setDate to handle function updates if needed, though simpler here
    const handleSetDate = (newDate: Date | ((prev: Date) => Date)) => {
        // cast to any if needed or just assume the parent handles it.
        // But props usually expect a value setter or a specific type.
        // Let's assume parent passes `setDate` from `useState`, which supports both.
        // TypeScript might complain if we aren't careful.
        // Safest:
        if (typeof newDate === 'function') {
            setDate(newDate(date)); // This is hacky if setDate isn't the state setter itself.
        } else {
            setDate(newDate);
        }
    };

    // Animation direction logic
    const prevDateRef = useRef(date);
    const direction = date > prevDateRef.current ? 1 : -1;

    // Update ref after render cycle (for next comparison)
    if (prevDateRef.current !== date) {
        prevDateRef.current = date;
    }

    // Swipe logic
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            // Next Day logic (Left Swipe)
            const currentDay = getDay(date);
            if (currentDay === 6) { // Saturday -> Monday
                setDate(addDays(date, 2));
            } else if (currentDay === 0) { // Sunday -> Monday
                setDate(addDays(date, 1));
            } else {
                setDate(addDays(date, 1));
            }
            triggerHaptic('light');
        }

        if (isRightSwipe) {
            // Prev Day logic (Right Swipe)
            const currentDay = getDay(date);
            if (currentDay === 1) { // Monday -> Saturday
                setDate(addDays(date, -2));
            } else if (currentDay === 0) { // Sunday -> Saturday
                setDate(addDays(date, -1));
            } else {
                setDate(addDays(date, -1));
            }
            triggerHaptic('light');
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
            zIndex: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
            position: "absolute" as const,
            width: "100%"
        })
    };

    return (
        <div className="block sm:hidden space-y-4 overflow-hidden min-h-[calc(100vh-150px)]">
            {selectedGroup === "all" && selectedTeacher === "all" ? (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-220px)] text-center p-8 space-y-4 text-muted-foreground animate-in fade-in duration-500">
                    <div className="bg-muted p-4 rounded-full">
                        <Search className="h-8 w-8 opacity-50" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">Расписание не выбрано</h3>
                        <p className="text-sm">Выберите группу или преподавателя выше, чтобы увидеть расписание</p>
                    </div>
                </div>
            ) : (
                <div
                    className="min-h-[calc(100vh-200px)] relative touch-pan-y overscroll-none" // Add touch-pan-y to fix "whole screen" swipe
                >
                    {/* Навигация по неделям (Mobile Style) */}
                    <div className="flex items-center justify-between px-2 py-2 mb-2">
                        <Button
                            variant="ghost"
                            className="text-primary hover:bg-transparent p-0 h-auto font-medium flex items-center gap-1"
                            onClick={() => {
                                triggerHaptic('medium');
                                const currentMonday = startOfWeek(date, { weekStartsOn: 1 });
                                setDate(addDays(currentMonday, -7));
                            }}
                        >
                            <ChevronLeft className="h-5 w-5" />
                            <span>Пред. неделя</span>
                        </Button>

                        <Button
                            variant="ghost"
                            className="text-primary hover:bg-transparent p-0 h-auto font-medium flex items-center gap-1"
                            onClick={() => {
                                triggerHaptic('medium');
                                const currentMonday = startOfWeek(date, { weekStartsOn: 1 });
                                setDate(addDays(currentMonday, 7));
                            }}
                        >
                            <span>След. неделя</span>
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Компонент выбора дня */}
                    <MobileWeekView
                        currentDate={date}
                        onSelectDate={(newDate) => {
                            triggerHaptic('light');
                            setDate(newDate);
                        }}
                    />

                    {/* Заголовок дня и счетчик */}
                    <div className="px-1 pb-2 pt-2">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-xl font-semibold text-brand capitalize tracking-tight">
                                {format(date, "EEEE, d MMMM", { locale: ru })}
                            </h2>
                            <span className="text-xs font-bold bg-primary/5 text-primary dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 px-3 py-1 rounded-full shrink-0 uppercase">
                                {(() => {
                                    const dayLessons = filteredData.filter(l => isSameDay(parse(l.date, "dd.MM.yyyy", new Date()), date));
                                    const uniqueTimes = new Set(dayLessons.map(l => l.time)).size;
                                    if (uniqueTimes === 0) return "Нет занятий";
                                    return `${uniqueTimes} ${getDeclension(uniqueTimes, ['пара', 'пары', 'пар'])}`;
                                })()}
                            </span>
                        </div>
                    </div>

                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                            key={date.toISOString()}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                            className="space-y-3 min-h-[50vh] w-full"
                        >
                            {(() => {
                                // 1. Фильтруем занятия для выбранного дня
                                const currentDayLessons = filteredData.filter(item => {
                                    const itemDate = parse(item.date, "dd.MM.yyyy", new Date());
                                    return isSameDay(itemDate, date);
                                });

                                // 2. Группируем занятия
                                const groupedLessons: Record<string, ScheduleItem[]> = {};

                                currentDayLessons.forEach(lesson => {
                                    const key = `${lesson.time}-${lesson.subject}-${lesson.lessonType}-${lesson.classroom}-${lesson.teacher}`;
                                    if (!groupedLessons[key]) {
                                        groupedLessons[key] = [];
                                    }
                                    groupedLessons[key].push(lesson);
                                });

                                const sortedGroupKeys = Object.keys(groupedLessons).sort((a, b) => {
                                    const timeA = groupedLessons[a][0].time.split(' - ')[0];
                                    const timeB = groupedLessons[b][0].time.split(' - ')[0];
                                    return timeA.localeCompare(timeB);
                                });

                                if (sortedGroupKeys.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground/50">
                                            <CalendarDays strokeWidth={1} className="h-24 w-24 mb-6 opacity-20" />
                                            <p className="text-xl font-normal">Нет занятий в этот день</p>
                                        </div>
                                    );
                                }

                                return sortedGroupKeys.map((key, index) => {
                                    const groupLessons = groupedLessons[key].sort((a, b) => a.group.localeCompare(b.group));
                                    const primaryLesson = groupLessons[0];
                                    const isGrouped = groupLessons.length > 1;

                                    const isActive = isLessonActive(primaryLesson.time, format(date, DATE_FORMATS.FULL));
                                    const isPast = isLessonPast(primaryLesson.time, format(date, DATE_FORMATS.FULL));

                                    return (
                                        <Drawer key={`${primaryLesson.date}-${primaryLesson.time}-${index}`} shouldScaleBackground={false}>
                                            <DrawerTrigger asChild>
                                                <Card
                                                    className={cn(
                                                        "rounded-xl shadow-sm relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer border",
                                                        isActive
                                                            ? "border-green-500 shadow-md bg-green-50/50 dark:bg-green-900/10"
                                                            : isPast
                                                                ? "opacity-60 grayscale-[0.5] bg-muted/30 border-border/50"
                                                                : "bg-card border-border hover:border-primary/20"
                                                    )}
                                                    onClick={() => onLessonClick(primaryLesson)}
                                                >
                                                    {isGrouped && (
                                                        <div className={cn(
                                                            "absolute right-3 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm z-10",
                                                            isActive ? "top-9 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200/50" : "top-3 bg-primary/5 text-primary dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200"
                                                        )}>
                                                            {groupLessons.length} {getDeclension(groupLessons.length, ['группа', 'группы', 'групп'])}
                                                        </div>
                                                    )}

                                                    {isActive && (
                                                        <div className="absolute top-0 right-0 px-3 py-1 bg-green-500 text-white text-xxs uppercase tracking-wider font-bold rounded-bl-xl z-20 shadow-sm">
                                                            Сейчас
                                                        </div>
                                                    )}

                                                    <CardContent className="p-0 flex">
                                                        <div className="flex flex-col items-start justify-center w-20 bg-muted/30 border-r border-border/50 pl-3 shrink-0">
                                                            <span className="text-xxs font-bold text-brand uppercase tracking-wider mb-0.5 whitespace-nowrap">
                                                                {getPairNumber(primaryLesson.time)} пара
                                                            </span>
                                                            <span className="text-xl font-extrabold text-brand leading-none antialiased">
                                                                {primaryLesson.time.split(' - ')[0]}
                                                            </span>
                                                            <span className="text-xxs text-muted-foreground mt-0.5 whitespace-nowrap">
                                                                до {primaryLesson.time.split(' - ')[1]}
                                                            </span>
                                                        </div>

                                                        <div className="flex-1 p-3 flex flex-col min-w-0">
                                                            <div className={cn("mb-2", isGrouped ? "pr-24" : isActive ? "pr-16" : "")}>
                                                                <h3 className="font-semibold text-brand leading-tight mb-1">
                                                                    {primaryLesson.subject}
                                                                </h3>
                                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                    <FileText className="h-3 w-3 shrink-0" />
                                                                    <span className="truncate">{primaryLesson.lessonType}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                                                                <div className="flex items-center gap-1.5 font-medium shrink-0">
                                                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                                    <span className="truncate">ауд. {primaryLesson.classroom}</span>
                                                                </div>

                                                                <div className="flex items-center gap-1.5 max-w-[45%] justify-end ml-2">
                                                                    {selectedTeacher !== "all" ? (
                                                                        <>
                                                                            <Users className="h-3.5 w-3.5 shrink-0" />
                                                                            <span className="text-right font-medium truncate">
                                                                                {groupLessons.length > 1
                                                                                    ? `${groupLessons[0].group} +${groupLessons.length - 1}`
                                                                                    : groupLessons[0].group}
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <User className="h-3.5 w-3.5 shrink-0" />
                                                                            <span className="text-right font-medium truncate">{primaryLesson.teacher}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </DrawerTrigger>
                                            <DrawerContent>
                                                <div className="overflow-y-auto max-h-[calc(95vh-5rem)] px-4 pb-4">
                                                    <DrawerHeader className="pt-8">
                                                        <DrawerTitle className="text-center font-bold text-lg">
                                                            {primaryLesson.subject}
                                                        </DrawerTitle>
                                                        <DrawerDescription className="text-center">
                                                            {primaryLesson.lessonType} • {format(date, "dd MMMM", { locale: ru })}
                                                        </DrawerDescription>
                                                    </DrawerHeader>

                                                    <div className="space-y-4 mt-4">
                                                        {groupLessons.map((lesson, idx) => (
                                                            <Card key={idx} className="bg-muted/50 border shadow-none">
                                                                <CardContent className="p-4 space-y-4">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                                            <User className="h-5 w-5" />
                                                                        </div>
                                                                        <div className="space-y-0.5">
                                                                            <div className="text-xs text-muted-foreground">Преподаватель</div>
                                                                            <div className="font-medium text-sm leading-tight">{lesson.teacher}</div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-4">
                                                                        <div className="h-10 w-10 rounded-xl bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400 flex items-center justify-center shrink-0">
                                                                            <Users className="h-5 w-5" />
                                                                        </div>
                                                                        <div className="space-y-0.5">
                                                                            <div className="text-xs text-muted-foreground">Группа</div>
                                                                            <div className="font-medium text-sm leading-tight">{lesson.group}</div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 flex items-center justify-center shrink-0">
                                                                                <Clock className="h-5 w-5" />
                                                                            </div>
                                                                            <div className="space-y-0.5">
                                                                                <div className="text-xs text-muted-foreground">Время</div>
                                                                                <div className="font-medium text-sm leading-tight">{lesson.time}</div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-4 flex-row-reverse text-right">
                                                                            <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 flex items-center justify-center shrink-0">
                                                                                <MapPin className="h-5 w-5" />
                                                                            </div>
                                                                            <div className="space-y-0.5">
                                                                                <div className="text-xs text-muted-foreground">Аудитория</div>
                                                                                <div className="font-medium text-sm leading-tight">{lesson.classroom}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                </div>
                                            </DrawerContent>
                                        </Drawer>
                                    );
                                });
                            })()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
