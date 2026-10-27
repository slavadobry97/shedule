"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MOTION_DURATION, motionTransition } from "@/lib/motion";
import { GraduationCapIcon, LoadingIcon, UserIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveComboBox } from "./responsive-combobox";
import { cn } from "cn";
import { BrandLogo } from "@/components/logo/brand-logo";
import { haptic } from "@/lib/haptics";

interface WelcomeScreenProps {
    groups: string[];
    teachers: string[];
    onGroupSelect: (group: string) => void;
    onTeacherSelect: (teacher: string) => void;
}

type Role = "student" | "teacher";

/**
 * Экран первого запуска.
 *
 * Десктоп (lg+): сплит — бренд-градиент слева, форма справа на полотне.
 * Мобильный: градиент на весь экран, форма — карточка из матового стекла
 * (bg-card/75 + blur 20px + saturate 1.8, фолбэк — плотный bg-card).
 *
 * Радиусы концентрические: карточка 28 = внутренние 12 + паддинг 16,
 * подложка табов 16 = 12 + паддинг 4. Внутри карточки один радиус 12.
 */
export function WelcomeScreen({
    groups,
    teachers,
    onGroupSelect,
    onTeacherSelect,
}: WelcomeScreenProps) {
    const reduceMotion = useReducedMotion();
    const [role, setRole] = useState<Role | null>("student");
    const [selectedValue, setSelectedValue] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const groupItems = useMemo(
        () => groups.map((g) => ({ value: g, label: g })),
        [groups]
    );

    const teacherItems = useMemo(
        () => teachers.map((t) => ({ value: t, label: t })),
        [teachers]
    );

    // Сбрасываем выбранное значение при смене роли
    useEffect(() => {
        setSelectedValue("");
    }, [role]);

    // Блокируем прокрутку body, пока открыт полноэкранный приветственный слой
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const handleContinue = useCallback(async () => {
        if (isLoading) return;

        // Кнопка всегда активна: валидация по нажатию, фокус на первое
        // незаполненное поле — вместо disable, который молчит о причине.
        if (!role) {
            haptic("medium");
            document.querySelector<HTMLButtonElement>('[role="tab"]')?.focus();
            return;
        }
        if (!selectedValue) {
            haptic("medium");
            document.getElementById("welcome-value")?.focus();
            return;
        }

        setIsLoading(true);
        haptic("success");

        // Короткая пауза, чтобы нажатие почувствовалось (и тактильно, и визуально)
        await new Promise((resolve) => setTimeout(resolve, 300));

        const handler = role === "student" ? onGroupSelect : onTeacherSelect;
        handler(selectedValue);
    }, [role, selectedValue, isLoading, onGroupSelect, onTeacherSelect]);

    const handleRoleSelect = useCallback((selectedRole: Role) => {
        haptic("light");
        setRole(selectedRole);
    }, []);

    const form = (
        <>
            {/* Роль: один внутренний радиус 12 на все контролы карточки.
                Подложка — foreground/10, а не muted: на стекле карточки muted
                сливается с поверхностью в обеих темах, адаптивный тинт
                от переднего плана виден всегда. */}
            {/* Роль: shadcn Tabs (controlled) — Radix даёт roving tabindex
                и стрелочную навигацию; визуал прежний (пилюля bg-card). */}
            <Tabs value={role ?? "student"} onValueChange={(v) => handleRoleSelect(v as Role)}>
                <TabsList className="flex h-auto w-full gap-1.5 rounded-3xl bg-foreground/10 p-1">
                    <TabsTrigger
                        value="student"
                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-3xl border border-transparent text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none"
                    >
                        <UserIcon className="h-5 w-5 shrink-0" />
                        Студент
                    </TabsTrigger>
                    <TabsTrigger
                        value="teacher"
                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-3xl border border-transparent text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none"
                    >
                        <GraduationCapIcon className="h-5 w-5 shrink-0" />
                        Преподаватель
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div>
                <label htmlFor="welcome-value" className="sr-only">
                    {role === "teacher" ? "Преподаватель" : "Группа"}
                </label>
                <ResponsiveComboBox
                    id="welcome-value"
                    items={role === "teacher" ? teacherItems : groupItems}
                    placeholder={
                        role === "teacher"
                            ? "Найти преподавателя..."
                            : "Выберите группу..."
                    }
                    onValueChange={setSelectedValue}
                    value={selectedValue}
                    emptyText={
                        role === "teacher"
                            ? "Преподаватель не найден"
                            : "Группа не найдена"
                    }
                    className="h-12 rounded-3xl text-base lg:h-14"
                />
            </div>

            <Button
                size="lg"
                disabled={isLoading}
                onClick={handleContinue}
                className="h-14 w-full rounded-3xl text-base font-semibold lg:text-lg"
            >
                {isLoading ? (
                    <>
                        <LoadingIcon className="mr-2 h-5 w-5 animate-spin" />
                        Загрузка...
                    </>
                ) : (
                    "Продолжить"
                )}
            </Button>
        </>
    );

    return (
        <div className="fixed inset-0 overflow-hidden bg-canvas">
            {/* Мобильный: градиент на весь экран. Десктоп: градиент только
                в левой колонке (класс на самой колонке ниже). */}
            <div aria-hidden className="absolute inset-0 bg-brand-gradient lg:hidden" />

            <div className="relative flex h-full flex-col justify-center lg:grid lg:grid-cols-[1.1fr_1fr]">
                {/* Брендовая зона: лого, заголовок и лид — по центру на всех
                    ширинах; на мобильном вся группа контента центрирована
                    по вертикали (safe-area учтён паддингами). */}
                <div className="flex flex-col items-center justify-center px-6 pt-[max(2.5rem,calc(env(safe-area-inset-top)+1rem))] text-white lg:flex-none lg:bg-brand-gradient lg:p-16">
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={motionTransition(reduceMotion, { duration: MOTION_DURATION.base })}
                    >
                    <BrandLogo className="mx-auto h-36 w-auto text-white" />
                    <h1 className="mt-6 text-center text-[28px] font-bold leading-[1.1] tracking-[-0.02em] lg:mt-8 lg:text-5xl">
                        Ваше расписание.
                        <br />
                        Одним экраном.
                    </h1>
                    <p className="mx-auto mt-3 max-w-[34ch] text-center text-sm text-white/75 lg:mt-5 lg:max-w-[32ch] lg:text-lg">
                        Календарь пар и уведомления об изменениях — для
                        студентов и преподавателей филиала
                    </p>
                    </motion.div>
                </div>

                {/* Зона формы: под текстом, на мобильном участвует в общей
                    вертикальной центрировке */}
                <div className="flex items-start justify-center px-4 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1rem))] pt-8 lg:items-center lg:p-16">
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={motionTransition(reduceMotion, { duration: MOTION_DURATION.base, delay: 0.1 })}
                        className={cn(
                            "w-full max-w-lg space-y-4",
                            // Стекло — только мобильный слой над градиентом;
                            // на десктопе форма плотная, на полотне.
                            // Тонкая белая кромка держит «остров» на градиенте.
                            "max-lg:rounded-[28px] max-lg:bg-card max-lg:p-4",
                            "max-lg:backdrop-blur-[20px] max-lg:backdrop-saturate-180",
                            "max-lg:supports-backdrop-filter:bg-card/75",
                            "max-lg:ring-1 max-lg:ring-white/15"
                        )}
                    >
                        {form}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
