"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResponsiveComboBox } from "./responsive-combobox";
import { CalendarSubscribeHelp } from "@/components/calendar-subscribe-help";
import {
  ArrowLeftIcon,
  CalendarSyncIcon,
  CheckIcon,
  CopyIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";
import { API_ENDPOINTS, STORAGE_KEYS } from "@/lib/constants";
import { showToast } from "@/components/ui/sonner";
import { MOTION_ICON_SPRING } from "@/lib/motion";
import { copyText } from "@/lib/clipboard";
import { haptic } from "@/lib/haptics";

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
        const ok = await copyText(text);
        if (!ok) {
            showToast({
                title: "Не удалось скопировать",
                message: "Выделите ссылку и нажмите Ctrl+C",
                variant: "error",
            });
            return;
        }

        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                aria-label={label}
                title={label}
                className={cn(
                    "relative shrink-0 transition-colors",
                    copied && "border-success/50 bg-success/10 text-success hover:bg-success/15 hover:text-success"
                )}
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
            <span className="sr-only" role="status" aria-live="polite">
                {copied ? "Ссылка скопирована" : ""}
            </span>
        </>
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

/**
 * Фильтры и действия одной строкой: на десктопе подписи заменены иконками
 * внутри полей, кнопки стоят рядом с полями, а не под ними. Так шапка
 * расписания занимает одну строку вместо трёх.
 */
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
    const isTeacherMode = selectedTeacher !== "all" && selectedGroup === "all";
    const hasSelection = selectedGroup !== "all" || selectedTeacher !== "all";
    const activeValue = isTeacherMode ? selectedTeacher : selectedGroup;

    // «Моя группа»/«Это я»: сохранённый профиль хранится в localStorage и
    // подсвечивается на кнопке (заливка + галочка), как человек просил 27.10.
    const reduceMotion = useReducedMotion();
    const [savedGroup, setSavedGroup] = useState<string | null>(null);
    const [savedTeacher, setSavedTeacher] = useState<string | null>(null);
    useEffect(() => {
        setSavedGroup(localStorage.getItem(STORAGE_KEYS.SELECTED_GROUP));
        setSavedTeacher(localStorage.getItem(STORAGE_KEYS.SELECTED_TEACHER));
    }, []);

    // №122 (финал, владелец): один фильтр — активный режим (группа ИЛИ
    // преподаватель); строка ниже разнесена по краям: «назад» слева — сброс
    // выбора и возврат на Welcome к выбору роли, «Подписаться» иконкой справа.
    const handleBackToRole = () => {
        haptic("light");
        onGroupChange("all");
        onTeacherChange("all");
    };

    const getCalendarUrl = (encodedValue: string, isTeacher: boolean = false) => {
        if (typeof window === 'undefined') return '';
        return `${window.location.origin}${API_ENDPOINTS.CALENDAR}${encodedValue}${isTeacher ? '?type=teacher' : ''}`;
    };

    // Одна кнопка подписки на оба режима: раньше она дублировалась в двух
    // колонках и занимала две строки по высоте.
    const subscribeUrl = activeValue ? getCalendarUrl(encodeURIComponent(activeValue), isTeacherMode) : '';

    return (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
            {hasSelection && (
                <div className="flex w-full items-center justify-between sm:contents">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 sm:order-first sm:h-9 sm:w-9"
                        aria-label="Вернуться к выбору роли"
                        title="Вернуться к выбору роли"
                        onClick={handleBackToRole}
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                    </Button>
                    <Popover modal={false}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 sm:order-last sm:h-9 sm:w-9"
                            aria-label="Подписаться на календарь"
                            title="Подписаться на календарь"
                        >
                            <CalendarSyncIcon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80" align="start">
                        <div className="space-y-3">
                            <p className="text-sm font-medium">
                                Ссылка для подписки{isTeacherMode ? " (преподаватель)" : ""}:
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs bg-muted p-2 rounded-xl truncate">
                                    {subscribeUrl}
                                </code>
                                <CopyButton
                                    text={subscribeUrl}
                                    label="Скопировать ссылку на календарь"
                                />
                            </div>
                            <CalendarSubscribeHelp />
                        </div>
                    </PopoverContent>
                    </Popover>
                </div>
            )}
            {!isTeacherMode && (
            <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
                <label htmlFor="group-select" className="sr-only">Группа</label>
                <ResponsiveComboBox
                    id="group-select"
                    className="h-11 min-w-0 flex-1 sm:h-9 sm:w-52 sm:flex-none xl:w-56"
                    leadingIcon={<UsersIcon className="h-4 w-4" />}
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
                {selectedGroup !== "all" && selectedTeacher === "all" && (() => {
                    const isMyGroup = savedGroup === selectedGroup;
                    return (
                        <Button
                            size="sm"
                            variant={isMyGroup ? "default" : "outline"}
                            aria-pressed={isMyGroup}
                            onClick={() => { onSaveGroup(); setSavedGroup(selectedGroup); setSavedTeacher("all"); }}
                            className="h-11 w-32 shrink-0 gap-1 transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.97] sm:h-9 sm:w-32"
                        >
                            <AnimatePresence mode="popLayout" initial={false}>
                                {isMyGroup && (
                                    <motion.span
                                        key="saved-check"
                                        className="flex items-center justify-center"
                                        initial={{ opacity: 0, scale: 0.5, filter: "blur(2px)" }}
                                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, scale: 0.5, filter: "blur(2px)" }}
                                        transition={reduceMotion ? { duration: 0 } : MOTION_ICON_SPRING}
                                    >
                                        <CheckIcon className="h-3.5 w-3.5" aria-hidden />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            Моя группа
                        </Button>
                    );
                })()}
            </div>

            )}
            {isTeacherMode && (
            <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
                <label htmlFor="teacher-select" className="sr-only">Преподаватель</label>
                <ResponsiveComboBox
                    id="teacher-select"
                    className="h-11 min-w-0 flex-1 sm:h-9 sm:w-56 sm:flex-none xl:w-60"
                    leadingIcon={<UserIcon className="h-4 w-4" />}
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
                {selectedTeacher !== "all" && selectedGroup === "all" && (() => {
                    const isMyTeacher = savedTeacher === selectedTeacher;
                    return (
                        <Button
                            size="sm"
                            variant={isMyTeacher ? "default" : "outline"}
                            aria-pressed={isMyTeacher}
                            onClick={() => { onSaveTeacher(); setSavedTeacher(selectedTeacher); setSavedGroup("all"); }}
                            className="h-11 w-32 shrink-0 gap-1 transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.97] sm:h-9 sm:w-32"
                        >
                            <AnimatePresence mode="popLayout" initial={false}>
                                {isMyTeacher && (
                                    <motion.span
                                        key="saved-check"
                                        className="flex items-center justify-center"
                                        initial={{ opacity: 0, scale: 0.5, filter: "blur(2px)" }}
                                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, scale: 0.5, filter: "blur(2px)" }}
                                        transition={reduceMotion ? { duration: 0 } : MOTION_ICON_SPRING}
                                    >
                                        <CheckIcon className="h-3.5 w-3.5" aria-hidden />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            Это я
                        </Button>
                    );
                })()}
            </div>
            )}

        </div>
    );
}
