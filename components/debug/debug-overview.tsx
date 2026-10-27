"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { IslandMetric } from "@/components/debug/debug-island";
import { ClassroomHeatmap } from "@/components/debug/classroom-heatmap";
import { ScheduleAnalysis } from "@/types/debug";
import {
    AlertTriangleIcon,
    CalendarDaysIcon,
    ClockIcon,
    FileTextIcon,
    Location01Icon,
    UserIcon,
    UsersIcon,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";

/**
 * Обзор: цифры и аналитика.
 *
 * Здесь нет проверок — всё, что может быть сломано, живёт на вкладке
 * «Проверки». Здесь смотрят, как распределена нагрузка и где есть окна.
 */
export function DebugOverview({ analysis }: { analysis: ScheduleAnalysis }) {
    return (
        <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                <IslandMetric
                    icon={<FileTextIcon className="h-4 w-4" />}
                    label="Занятий"
                    value={analysis.total}
                />
                <IslandMetric
                    icon={<UsersIcon className="h-4 w-4" />}
                    label="Группы"
                    value={analysis.groups}
                />
                <IslandMetric
                    icon={<UserIcon className="h-4 w-4" />}
                    label="Преподаватели"
                    value={analysis.teachers}
                />
                <IslandMetric
                    icon={<CalendarDaysIcon className="h-4 w-4" />}
                    label="Учебные дни"
                    value={analysis.dates}
                />
                <IslandMetric
                    icon={<ClockIcon className="h-4 w-4" />}
                    label="Временные слоты"
                    value={analysis.timeSlots}
                />
                <IslandMetric
                    icon={<FileTextIcon className="h-4 w-4" />}
                    label="Дисциплины"
                    value={analysis.subjects}
                />
            </div>

            <Accordion type="multiple" className="divide-y divide-border/60 overflow-hidden rounded-3xl border border-border/70 bg-card">
                {/* Нагрузка преподавателей */}
                {analysis.teacherWorkload.length > 0 && (
                    <AccordionItem value="teacher-workload" className="border-0">
                        <AccordionTrigger className="rounded-xl-none px-4 py-3.5 hover:bg-muted/40 hover:no-underline sm:px-5">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-3xl border border-border bg-muted/40 text-muted-foreground">
                                    <UserIcon className="h-4 w-4" />
                                </span>
                                <div className="text-left">
                                    <p className="text-sm font-semibold tracking-[-0.01em]">
                                        Нагрузка преподавателей
                                    </p>
                                    <p className="mt-0.5 text-sm font-normal text-muted-foreground">
                                        Топ-10 самых загруженных преподавателей
                                    </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pl-12 sm:px-5 sm:pl-[3.25rem]">
                            <div className="space-y-3">
                                {analysis.teacherWorkload.slice(0, 10).map(([teacher, count], index) => {
                                    const maxCount = analysis.teacherWorkload[0][1];
                                    const percentage = (count / maxCount) * 100;

                                    // Цветовая кодировка
                                    let barColor = "bg-success/50";
                                    if (percentage > 80) barColor = "bg-destructive/50";
                                    else if (percentage > 60) barColor = "bg-warning/50";

                                    return (
                                        <div key={teacher} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <Badge
                                                        variant="outline"
                                                        className="font-mono shrink-0"
                                                    >
                                                        #{index + 1}
                                                    </Badge>
                                                    <span className="truncate font-medium">{teacher}</span>
                                                </div>
                                                <span className="font-bold tabular-nums shrink-0 ml-2">
                                                    {count} пар
                                                </span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${barColor} transition-[height,background-color]`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {analysis.teacherWorkload.length > 10 && (
                                <p className="text-xs text-muted-foreground mt-4">
                                    Показано топ-10 из {analysis.teacherWorkload.length} преподавателей
                                </p>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                )}

                {/* Окна в расписании групп */}
                {analysis.gaps.length > 0 && (
                    <AccordionItem value="schedule-gaps" className="border-0">
                        <AccordionTrigger className="rounded-xl-none px-4 py-3.5 hover:bg-muted/40 hover:no-underline sm:px-5">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-3xl border border-border bg-muted/40 text-muted-foreground">
                                    <ClockIcon className="h-4 w-4" />
                                </span>
                                <div className="text-left">
                                    <p className="text-sm font-semibold tracking-[-0.01em]">
                                        Окна в расписании групп
                                    </p>
                                    <p className="mt-0.5 text-sm font-normal text-muted-foreground">
                                        Найдено {analysis.totalGaps} свободных слотов между занятиями
                                    </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pl-12 sm:px-5 sm:pl-[3.25rem]">
                            <div className="mb-4 p-3 bg-warning/5 dark:bg-warning/20 rounded-3xl border border-warning/30 dark:bg-warning/50">
                                <div className="flex items-center gap-2">
                                    <AlertTriangleIcon className="h-4 w-4 text-warning" />
                                    <p className="text-sm font-medium text-warning dark:text-warning">
                                        Найдено {analysis.totalGaps} окон в расписании
                                    </p>
                                </div>
                                <p className="text-xs text-warning dark:text-warning mt-1">
                                    Окна снижают посещаемость и увеличивают время пребывания студентов в
                                    университете
                                </p>
                            </div>

                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {analysis.gaps.map((gap, index) => (
                                    <div
                                        key={`${gap.group}-${gap.date}-${gap.gapTime}-${index}`}
                                        className="flex items-center justify-between p-2 rounded-3xl bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <UsersIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <span className="font-medium truncate">{gap.group}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {gap.date}
                                            </Badge>
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {gap.gapTime}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {analysis.totalGaps > 20 && (
                                <p className="text-xs text-muted-foreground mt-4">
                                    Показано первых 20 из {analysis.totalGaps} окон
                                </p>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                )}

                {/* Использование аудиторий */}
                {analysis.classroomUsage.length > 0 && (
                    <AccordionItem value="classroom-usage" className="border-0">
                        <AccordionTrigger className="rounded-xl-none px-4 py-3.5 hover:bg-muted/40 hover:no-underline sm:px-5">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-3xl border border-border bg-muted/40 text-muted-foreground">
                                    <Location01Icon className="h-4 w-4" />
                                </span>
                                <div className="text-left">
                                    <p className="text-sm font-semibold tracking-[-0.01em]">
                                        Использование аудиторий
                                    </p>
                                    <p className="mt-0.5 text-sm font-normal text-muted-foreground">
                                        Топ-10 аудиторий и тепловая карта занятости
                                    </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 px-4 pb-4 pl-12 sm:px-5 sm:pl-[3.25rem]">
                            <div>
                                <h4 className="text-sm font-semibold mb-3">
                                    Топ-10 самых используемых аудиторий
                                </h4>
                                <div className="space-y-3">
                                    {analysis.classroomUsage.map(([classroom, count], index) => {
                                        const maxCount = analysis.classroomUsage[0][1];
                                        const percentage = (count / maxCount) * 100;

                                        // Цветовая кодировка
                                        let barColor = "bg-info/50";
                                        if (percentage > 80) barColor = "bg-info";
                                        else if (percentage > 60) barColor = "bg-info/60";

                                        return (
                                            <div key={classroom} className="space-y-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <Badge
                                                            variant="outline"
                                                            className="font-mono shrink-0"
                                                        >
                                                            #{index + 1}
                                                        </Badge>
                                                        <Location01Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                        <span className="truncate font-medium">
                                                            ауд. {classroom}
                                                        </span>
                                                    </div>
                                                    <span className="font-bold tabular-nums shrink-0 ml-2">
                                                        {count} пар
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${barColor} transition-[height,background-color]`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {analysis.classroomUtilization.length > 0 && (
                                <div className="pt-4">
                                    <ClassroomHeatmap data={analysis.classroomUtilization} />
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                )}
            </Accordion>
        </div>
    );
}
