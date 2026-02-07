"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Users, ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ResponsiveComboBox } from "./responsive-combobox";

interface WelcomeScreenProps {
    groups: string[];
    teachers: string[];
    onGroupSelect: (group: string) => void;
    onTeacherSelect: (teacher: string) => void;
}

export function WelcomeScreen({
    groups,
    teachers,
    onGroupSelect,
    onTeacherSelect,
}: WelcomeScreenProps) {
    const [role, setRole] = useState<"student" | "teacher" | null>(null);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="mx-auto flex w-full max-w-[400px] flex-col gap-6"
            >
                <motion.div variants={item} className="flex flex-col items-center text-center gap-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 ring-8 ring-primary/5">
                        <GraduationCap className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Расписание РГСУ</h1>
                    <p className="text-muted-foreground text-lg">
                        Филиал в г. Минске
                    </p>
                </motion.div>

                <motion.div variants={item}>
                    {!role ? (
                        <Card className="border-2 shadow-lg">
                            <CardHeader className="text-center pb-2">
                                <CardTitle>Кто вы?</CardTitle>
                                <CardDescription>Выберите вашу роль для поиска расписания</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 pt-4">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-auto flex-col items-center gap-2 py-6 hover:border-primary/50 hover:bg-primary/5"
                                    onClick={() => setRole("student")}
                                >
                                    <Users className="h-8 w-8 mb-1 text-primary" />
                                    <span className="font-semibold text-lg">Я Студент</span>
                                    <span className="text-xs text-muted-foreground font-normal">Ищу расписание своей группы</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-auto flex-col items-center gap-2 py-6 hover:border-primary/50 hover:bg-primary/5"
                                    onClick={() => setRole("teacher")}
                                >
                                    <User className="h-8 w-8 mb-1 text-primary" />
                                    <span className="font-semibold text-lg">Я Преподаватель</span>
                                    <span className="text-xs text-muted-foreground font-normal">Ищу свое расписание</span>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-2 shadow-lg">
                            <CardHeader className="text-center pb-2">
                                <div className="flex items-center justify-start mb-2">
                                    <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground" onClick={() => setRole(null)}>
                                        ← Назад
                                    </Button>
                                </div>
                                <CardTitle>
                                    {role === 'student' ? 'Выберите группу' : 'Выберите преподавателя'}
                                </CardTitle>
                                <CardDescription>
                                    {role === 'student'
                                        ? 'Начните вводить название группы'
                                        : 'Начните вводить фамилию'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {role === 'student' ? (
                                    <ResponsiveComboBox
                                        id="welcome-group-select"
                                        items={groups.map(g => ({ value: g, label: g }))}
                                        value=""
                                        onValueChange={onGroupSelect}
                                        placeholder="Выберите группу..."
                                        searchPlaceholder="Поиск группы..."
                                        emptyText="Группа не найдена"
                                        className="w-full"
                                    />
                                ) : (
                                    <ResponsiveComboBox
                                        id="welcome-teacher-select"
                                        items={teachers.map(t => ({ value: t, label: t }))}
                                        value=""
                                        onValueChange={onTeacherSelect}
                                        placeholder="Выберите преподавателя..."
                                        searchPlaceholder="Поиск преподавателя..."
                                        emptyText="Преподаватель не найден"
                                        className="w-full"
                                    />
                                )}
                                <div className="mt-6 flex justify-center">
                                    <p className="text-xs text-muted-foreground text-center">
                                        Выбранные настройки сохранятся на этом устройстве
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
}
