"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Users, Check, Loader2, GraduationCap, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveComboBox } from "./responsive-combobox";
import { cn } from "@/lib/utils";
import { RgsuLogo } from "@/components/ui/logo";

interface WelcomeScreenProps {
    groups: string[];
    teachers: string[];
    onGroupSelect: (group: string) => void;
    onTeacherSelect: (teacher: string) => void;
}

type Role = "student" | "teacher";

interface RoleCardProps {
    active: boolean;
    onClick: () => void;
    icon: LucideIcon;
    title: string;
    description: string;
}

export function WelcomeScreen({
    groups,
    teachers,
    onGroupSelect,
    onTeacherSelect,
}: WelcomeScreenProps) {
    const [role, setRole] = useState<Role | null>(null);
    const [selectedValue, setSelectedValue] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    // Мемоизация преобразованных данных для ComboBox
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

    // Блокируем прокрутку body при монтировании компонента
    useEffect(() => {
        // Сохраняем текущее значение overflow
        const originalOverflow = document.body.style.overflow;

        // Устанавливаем overflow-hidden
        document.body.style.overflow = "hidden";

        // Восстанавливаем при размонтировании
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const handleContinue = useCallback(async () => {
        if (!role || !selectedValue || isLoading) return;

        setIsLoading(true);

        // Небольшая задержка для визуального эффекта
        await new Promise((resolve) => setTimeout(resolve, 300));

        const handler = role === "student" ? onGroupSelect : onTeacherSelect;
        handler(selectedValue);
    }, [role, selectedValue, isLoading, onGroupSelect, onTeacherSelect]);

    const handleRoleSelect = useCallback((selectedRole: Role) => {
        setRole(selectedRole);
    }, []);

    const isButtonDisabled = !role || !selectedValue || isLoading;

    return (
        <div className="fixed inset-0 bg-background overflow-hidden">
            {/* Фоновые элементы */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[80px]" />
                <div className="absolute top-[20%] -right-[15%] w-[60%] h-[60%] rounded-full bg-primary/3 blur-[60px]" />
            </div>

            {/* Логотип и карточки снизу */}
            <div className="absolute bottom-0 left-0 right-0 pb-32 px-6 z-20 max-h-[85vh] overflow-y-auto">
                <div className="w-full max-w-md mx-auto flex flex-col items-center gap-12 pt-4">
                    {/* Логотип */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center text-center"
                    >
                        <div className="w-72 h-auto mb-3">
                            <RgsuLogo className="w-full h-auto" />
                        </div>
                        <p className="text-xl text-muted-foreground font-normal">
                            Расписание занятий
                        </p>
                    </motion.div>

                    {/* Карточки и селект */}
                    <div className="w-full space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <RoleCard
                                active={role === "student"}
                                onClick={() => handleRoleSelect("student")}
                                icon={User}
                                title="Студент"
                                description="Моё расписание"
                            />
                            <RoleCard
                                active={role === "teacher"}
                                onClick={() => handleRoleSelect("teacher")}
                                icon={GraduationCap}
                                title="Преподаватель"
                                description="Мои пары"
                            />
                        </div>

                        {/* Выбор значения (Группа или Преподаватель) */}
                        <div className={cn("space-y-2", !role && "opacity-50 pointer-events-none")}>
                            <label className="text-sm font-medium text-muted-foreground ml-1">
                                {role === "student"
                                    ? "Ваша группа"
                                    : role === "teacher"
                                        ? "ФИО Преподавателя"
                                        : "Выберите роль"}
                            </label>
                            <ResponsiveComboBox
                                items={role === "student" ? groupItems : teacherItems}
                                placeholder={
                                    role === "student"
                                        ? "Выберите группу..."
                                        : "Найти преподавателя..."
                                }
                                onValueChange={setSelectedValue}
                                value={selectedValue}
                                emptyText={
                                    role === "student"
                                        ? "Группа не найдена"
                                        : "Преподаватель не найден"
                                }
                                className="w-full h-14 text-lg rounded-2xl"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Кнопка продолжить - фиксированный футер */}
            <div className="fixed bottom-0 left-0 right-0 p-6 pb-8 z-50 pointer-events-none flex justify-center">
                <div className="w-full max-w-md pointer-events-auto">
                    <Button
                        size="lg"
                        disabled={isButtonDisabled}
                        className={cn(
                            "w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all duration-300",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            isButtonDisabled && "opacity-50"
                        )}
                        onClick={handleContinue}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Загрузка...
                            </>
                        ) : (
                            "Продолжить"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Мемоизированный компонент карточки роли
const RoleCard = memo<RoleCardProps>(function RoleCard({
    active,
    onClick,
    icon: Icon,
    title,
    description,
}) {
    return (
        <Button
            variant="outline"
            onClick={onClick}
            className={cn(
                "relative flex flex-col gap-0 items-center justify-center p-4 h-40 rounded-3xl border transition-all duration-300 group hover:bg-accent/50 overflow-hidden",
                active
                    ? "border-primary shadow-lg scale-[1.02]"
                    : "border-border hover:border-primary/30"
            )}
        >
            {active && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1 z-10"
                >
                    <Check className="w-3 h-3" strokeWidth={3} />
                </motion.div>
            )}

            {/* Огромная иконка с обрезанием */}
            <div className="absolute -bottom-12 -right-24 opacity-15">
                <Icon className="!w-48 !h-48" strokeWidth={0.5} />
            </div>

            <span
                className={cn(
                    "font-semibold text-lg leading-none mb-0 transition-colors z-10",
                    active ? "text-primary" : "text-foreground"
                )}
            >
                {title}
            </span>
            <span
                className={cn(
                    "text-sm font-semibold transition-colors z-10",
                    active ? "text-primary/60" : "text-foreground/60"
                )}
            >
                {description}
            </span>
        </Button>
    );
});
