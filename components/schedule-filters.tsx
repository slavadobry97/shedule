"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResponsiveComboBox } from "./responsive-combobox";
import { CalendarSubscribeHelp } from "@/components/calendar-subscribe-help";
import {
  CalendarSyncIcon,
  CheckIcon,
  CopyIcon,
  PlusIcon,
} from "@/components/icons";
import { API_ENDPOINTS } from "@/lib/constants";
import { showToast } from "@/components/ui/sonner";
import { MOTION_ICON_SPRING } from "@/lib/motion";

/**
 * Кнопка копирования ссылки: иконка меняется по контексту (copy → check).
 * Меняем иконку через opacity, scale и blur — не переключаем видимость,
 * иначе она «перескакивает». Первая отрисовка без анимации (initial={false}).
 */
function CopyButton({ text, label }: { text: string; label: string }) {
    const reduceMotion = useReducedMotion();
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            showToast({ title: "Не удалось скопировать", message: "Скопируйте ссылку вручную", variant: "error" });
            return;
        }

        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            size="icon"
            variant="outline"
            onClick={handleCopy}
            aria-label={label}
            title={label}
            className="relative"
        >
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={copied ? "done" : "copy"}
                    className="flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                    transition={reduceMotion ? { duration: 0 } : MOTION_ICON_SPRING}
                >
                    {copied ? <CheckIcon className="h-4 w-4 text-success" /> : <CopyIcon className="h-4 w-4" />}
                </motion.span>
            </AnimatePresence>
        </Button>
    );
}

interface ScheduleFiltersProps {
    groups: string[];
    teachers: string[];
    selectedGroup: string;
    selectedTeacher: string;
    onGroupChange: (val: string) => void;
    onTeacherChange: (val: string) => void;
    onSaveGroup: () => void;
    onSaveTeacher: () => void;
}

export function ScheduleFilters({
    groups,
    teachers,
    selectedGroup,
    selectedTeacher,
    onGroupChange,
    onTeacherChange,
    onSaveGroup,
    onSaveTeacher
}: ScheduleFiltersProps) {

    const getCalendarUrl = (encodedValue: string, isTeacher: boolean = false) => {
        if (typeof window === 'undefined') return '';
        return `${window.location.origin}${API_ENDPOINTS.CALENDAR}${encodedValue}${isTeacher ? '?type=teacher' : ''}`;
    };

    return (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 items-start">
            <div className="w-full sm:w-56 flex flex-col gap-2">
                <label htmlFor="group-select" className="text-sm font-medium hidden sm:block">Группа</label>
                <ResponsiveComboBox
                    id="group-select"
                    items={[
                        { value: "all", label: "Все группы" },
                        ...groups.sort((a, b) => a.localeCompare(b)).map(g => ({ value: g, label: g }))
                    ]}
                    value={selectedGroup}
                    onValueChange={(val: string) => onGroupChange(val === "" ? "all" : val)}
                    placeholder="Выберите группу"
                    searchPlaceholder="Поиск группы..."
                    emptyText="Группа не найдена"
                />
                {selectedGroup !== "all" && selectedTeacher === "all" && (
                    <Button onClick={onSaveGroup} className="w-full">Моя группа</Button>
                )}
                {selectedGroup !== "all" && selectedTeacher === "all" && (
                    <Popover modal={false}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <CalendarSyncIcon className="h-4 w-4" />
                                Подписаться на календарь
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80" align="start">
                            <div className="space-y-3">
                                <p className="text-sm font-medium">Ссылка для подписки:</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                                        {getCalendarUrl(encodeURIComponent(selectedGroup))}
                                    </code>
                                    <CopyButton
                                        text={getCalendarUrl(encodeURIComponent(selectedGroup))}
                                        label="Скопировать ссылку на календарь"
                                    />
                                </div>
                                <CalendarSubscribeHelp />
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            <div className="w-full sm:w-80 flex flex-col gap-2">
                <label htmlFor="teacher-select" className="text-sm font-medium hidden sm:block">Преподаватель</label>
                <ResponsiveComboBox
                    id="teacher-select"
                    items={[
                        { value: "all", label: "Все преподаватели" },
                        ...teachers.sort((a, b) => a.localeCompare(b)).map(t => ({ value: t, label: t }))
                    ]}
                    value={selectedTeacher}
                    onValueChange={(val: string) => onTeacherChange(val === "" ? "all" : val)}
                    placeholder="Выберите преподавателя"
                    searchPlaceholder="Поиск преподавателя..."
                    emptyText="Преподаватель не найден"
                />
                {selectedTeacher !== "all" && selectedGroup === "all" && (
                    <>
                        <Button onClick={onSaveTeacher} className="w-full">Это я</Button>
                        <Popover modal={false}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <CalendarSyncIcon className="h-4 w-4" />
                                    Подписаться на календарь
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80" align="start">
                                <div className="space-y-3">
                                    <p className="text-sm font-medium">Ссылка для подписки (преподаватель):</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                                            {getCalendarUrl(encodeURIComponent(selectedTeacher), true)}
                                        </code>
                                        <CopyButton
                                            text={getCalendarUrl(encodeURIComponent(selectedTeacher), true)}
                                            label="Скопировать ссылку на календарь"
                                        />
                                    </div>
                                    <CalendarSubscribeHelp />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </>
                )}
            </div>
        </div>
    );
}
