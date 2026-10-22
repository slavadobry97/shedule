"use client";

import { Island, IslandRow } from "@/components/debug/debug-island";
import { SheetRowLink } from "@/components/debug/sheet-row-link";
import { ScheduleAnalysis } from "@/types/debug";
import { TIME_SLOTS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    AlertOctagonIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClockIcon,
    FileTextIcon,
    Location01Icon,
    TableIcon,
    UserIcon,
    UsersIcon,
    ViewOffIcon,
} from "@/components/icons";

/**
 * Список проверок: всё, что может быть сломано, в одном месте.
 *
 * Порядок строк задаёт анализ (types/debug.ts): сначала то, что ломает
 * календарь для студента, потом то, что стоит поправить в таблице.
 * Конфликты бронирования живут здесь же — раньше конфликт аудитории прятался
 * в «Обзоре», а конфликт преподавателя был в «Проверках», и найти их все
 * в одном месте было нельзя.
 */
export function DebugChecks({
    analysis,
    showAllInvisible,
    onToggleAllInvisible,
    showAllDuplicates,
    onToggleAllDuplicates,
}: {
    analysis: ScheduleAnalysis;
    showAllInvisible: boolean;
    onToggleAllInvisible: () => void;
    showAllDuplicates: boolean;
    onToggleAllDuplicates: () => void;
}) {
    const {
        invisibleRecords,
        classroomConflicts,
        teacherDoubleBookings,
        invalidTimeSlots,
        invalidDates,
        invalidDays,
        emptyFields,
        duplicates,
    } = analysis;

    const hasEmptyFields = Object.values(emptyFields).some((value) => value > 0);

    return (
        <>
            {/* Конфликт бронирования аудитории */}
            <IslandRow
                icon={<Location01Icon className="h-4 w-4" />}
                tone={classroomConflicts.length > 0 ? "danger" : "success"}
                title="Аудитория занята дважды"
                description="В одну аудиторию в одно время поставлены разные преподаватели. Потоковая лекция одним преподавателем — не конфликт"
                status={{
                    label: classroomConflicts.length > 0 ? `${classroomConflicts.length}` : "ок",
                    tone: classroomConflicts.length > 0 ? "danger" : "success",
                }}
                details={
                    classroomConflicts.length > 0 ? (
                        <div className="space-y-2">
                            {classroomConflicts.map((conflict, index) => (
                                <div
                                    key={`${conflict.classroom}-${conflict.date}-${conflict.time}-${index}`}
                                    className="rounded-md border border-destructive/30 bg-background p-2.5"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <Location01Icon className="h-3.5 w-3.5 text-destructive" />
                                            ауд. {conflict.classroom}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {conflict.date}
                                            </Badge>
                                            <Badge variant="destructive" className="font-mono text-xs">
                                                {conflict.time}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="mt-1.5 space-y-1">
                                        {conflict.teachers.map((teacher, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-1 text-xs text-muted-foreground"
                                            >
                                                <UserIcon className="h-3 w-3" />
                                                <span>{teacher}</span>
                                                <span className="text-xs">({conflict.subjects[i]})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null
                }
            />

            {/* Преподаватель в двух аудиториях */}
            <IslandRow
                icon={<UserIcon className="h-4 w-4" />}
                tone={teacherDoubleBookings.length > 0 ? "danger" : "success"}
                title="Преподаватель в двух аудиториях"
                description="Один преподаватель в одно и то же время ведёт занятия в разных аудиториях. Подгруппы одной лекции в одной аудитории — не конфликт"
                status={{
                    label: teacherDoubleBookings.length > 0 ? `${teacherDoubleBookings.length}` : "ок",
                    tone: teacherDoubleBookings.length > 0 ? "danger" : "success",
                }}
                details={
                    teacherDoubleBookings.length > 0 ? (
                        <div className="space-y-2">
                            {teacherDoubleBookings.map((clash) => (
                                <div
                                    key={`${clash.teacher}-${clash.date}-${clash.time}`}
                                    className="rounded-md border border-destructive/30 bg-background p-2.5"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="font-medium">{clash.teacher}</span>
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {clash.date}
                                            </Badge>
                                            <Badge variant="destructive" className="font-mono text-xs">
                                                {clash.time}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="mt-1.5 space-y-1.5">
                                        {groupRowsByClassroom(clash.rows).map(
                                            ({ classroom, rows, isOneLecture }) => (
                                                <div key={classroom} className="space-y-0.5">
                                                    <div className="flex flex-wrap items-center gap-x-1.5 text-xs">
                                                        <Location01Icon className="h-3 w-3 text-muted-foreground" />
                                                        <span className="font-medium text-foreground">
                                                            ауд. {classroom}
                                                        </span>
                                                        {isOneLecture && (
                                                            <span className="text-muted-foreground">
                                                                — подгруппы одной лекции, не конфликт
                                                            </span>
                                                        )}
                                                    </div>
                                                    {rows.map((row) => (
                                                        <div
                                                            key={row.index}
                                                            className="flex flex-wrap items-center gap-x-1.5 pl-4 text-xs text-muted-foreground"
                                                        >
                                                            <span className="font-medium text-foreground">
                                                                {row.group}
                                                            </span>
                                                            <span className="truncate">({row.subject})</span>
                                                            <span className="font-mono text-[10px]">
                                                                строка{" "}
                                                                <SheetRowLink index={row.index} />
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null
                }
            />

            {/* Записи, которые не видно в календаре */}
            <IslandRow
                icon={<ViewOffIcon className="h-4 w-4" />}
                tone={invisibleRecords.length > 0 ? "danger" : "success"}
                title="Записи не отображаются в календаре"
                description="Они есть в Google Sheets, но студенты и преподаватели их не видят"
                status={{
                    label: invisibleRecords.length > 0 ? `${invisibleRecords.length}` : "ок",
                    tone: invisibleRecords.length > 0 ? "danger" : "success",
                }}
                defaultOpen={invisibleRecords.length > 0}
                details={
                    invisibleRecords.length > 0 ? (
                        <div className="space-y-2">
                            {(showAllInvisible ? invisibleRecords : invisibleRecords.slice(0, 5)).map(
                                ({ item, index, reasons }) => (
                                    <div
                                        key={index}
                                        className="rounded-md border border-destructive/30 bg-background p-2.5"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className="font-mono">
                                                <SheetRowLink index={index} prefix="#" />
                                            </Badge>
                                            <span className="font-medium">{item.group}</span>
                                            <span className="text-muted-foreground">{item.date}</span>
                                            <Badge variant="destructive" className="font-mono">
                                                {item.time}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-sm">{item.subject}</p>
                                        <div className="mt-1.5 space-y-1">
                                            {reasons.map((reason, i) => (
                                                <p
                                                    key={i}
                                                    className="flex items-center gap-1 text-xs text-destructive"
                                                >
                                                    <ViewOffIcon className="h-3 w-3" />
                                                    {reason}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )
                            )}
                            {invisibleRecords.length > 5 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-muted-foreground"
                                    onClick={onToggleAllInvisible}
                                >
                                    {showAllInvisible
                                        ? "Скрыть"
                                        : `Показать все ${invisibleRecords.length} записей`}
                                </Button>
                            )}
                        </div>
                    ) : null
                }
            />

            {/* Формат времени */}
            <IslandRow
                icon={<ClockIcon className="h-4 w-4" />}
                tone={invalidTimeSlots.length > 0 ? "warning" : "success"}
                title="Формат времени"
                description="Проверка корректности записи времени (ЧЧ:ММ - ЧЧ:ММ)"
                status={{
                    label: invalidTimeSlots.length > 0 ? `${invalidTimeSlots.length}` : "ок",
                    tone: invalidTimeSlots.length > 0 ? "warning" : "success",
                }}
                details={
                    invalidTimeSlots.length > 0 ? (
                        <div className="space-y-2">
                            {invalidTimeSlots.slice(0, 20).map(({ item, index }) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between gap-2 text-sm"
                                >
                                    <span className="truncate">
                                        <SheetRowLink index={index} prefix="#" /> {item.group} —{" "}
                                        {item.date}
                                    </span>
                                    <Badge variant="destructive" className="font-mono">
                                        {item.time}
                                    </Badge>
                                </div>
                            ))}
                            {invalidTimeSlots.length > 20 && (
                                <p className="text-xs text-muted-foreground">
                                    …и ещё {invalidTimeSlots.length - 20}
                                </p>
                            )}
                            <div className="border-t pt-2">
                                <p className="text-xs text-muted-foreground">Допустимые слоты:</p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {TIME_SLOTS.map((slot) => (
                                        <Badge key={slot} variant="outline" className="font-mono text-xs">
                                            {slot}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : null
                }
            />

            {/* Формат даты */}
            <IslandRow
                icon={<CalendarDaysIcon className="h-4 w-4" />}
                tone={invalidDates.length > 0 ? "warning" : "success"}
                title="Формат даты"
                description="Проверка корректности записи даты (ДД.ММ.ГГГГ)"
                status={{
                    label: invalidDates.length > 0 ? `${invalidDates.length}` : "ок",
                    tone: invalidDates.length > 0 ? "warning" : "success",
                }}
                details={
                    invalidDates.length > 0 ? (
                        <div className="space-y-1">
                            {invalidDates.slice(0, 20).map(({ item, index }) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between gap-2 text-sm"
                                >
                                    <span className="truncate">
                                        #{index} {item.group}
                                    </span>
                                    <Badge variant="destructive" className="font-mono">
                                        {item.date || "пусто"}
                                    </Badge>
                                </div>
                            ))}
                            {invalidDates.length > 20 && (
                                <p className="text-xs text-muted-foreground">
                                    …и ещё {invalidDates.length - 20}
                                </p>
                            )}
                        </div>
                    ) : null
                }
            />

            {/* День недели */}
            <IslandRow
                icon={<CalendarDaysIcon className="h-4 w-4" />}
                tone={invalidDays.length > 0 ? "warning" : "success"}
                title="День недели"
                description="День недели распознаётся и попадает в нужную колонку календаря"
                status={{
                    label: invalidDays.length > 0 ? `${invalidDays.length}` : "ок",
                    tone: invalidDays.length > 0 ? "warning" : "success",
                }}
                details={
                    invalidDays.length > 0 ? (
                        <div className="space-y-1">
                            {invalidDays.slice(0, 20).map(({ item, index }) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between gap-2 text-sm"
                                >
                                    <span className="truncate">
                                        #{index} {item.group} — {item.date}
                                    </span>
                                    <Badge variant="destructive" className="font-mono">
                                        {item.dayOfWeek || "пусто"}
                                    </Badge>
                                </div>
                            ))}
                            {invalidDays.length > 20 && (
                                <p className="text-xs text-muted-foreground">
                                    …и ещё {invalidDays.length - 20}
                                </p>
                            )}
                        </div>
                    ) : null
                }
            />

            {/* Заполненность данных */}
            <IslandRow
                icon={<FileTextIcon className="h-4 w-4" />}
                tone={hasEmptyFields ? "warning" : "success"}
                title="Заполненность данных"
                description="Поиск пропущенных обязательных полей"
                status={{
                    label: hasEmptyFields ? "пропуски" : "ок",
                    tone: hasEmptyFields ? "warning" : "success",
                }}
                details={
                    hasEmptyFields ? (
                        <div className="space-y-1.5">
                            {Object.entries(emptyFields).map(([field, count]) => (
                                <div
                                    key={field}
                                    className="flex items-center justify-between gap-2 text-sm"
                                >
                                    <span className="capitalize">{field}</span>
                                    <Badge variant="destructive">{count} пустых</Badge>
                                </div>
                            ))}
                        </div>
                    ) : null
                }
            />

            {/* Дубликаты записей */}
            <IslandRow
                icon={<TableIcon className="h-4 w-4" />}
                tone={duplicates.length > 0 ? "warning" : "success"}
                title="Дубликаты записей"
                description="Полностью идентичные повторяющиеся строки"
                status={{
                    label: duplicates.length > 0 ? `${duplicates.length}` : "ок",
                    tone: duplicates.length > 0 ? "warning" : "success",
                }}
                details={
                    duplicates.length > 0 ? (
                        <div className="space-y-1.5">
                            {(showAllDuplicates ? duplicates : duplicates.slice(0, 15)).map(([key, count]) => (
                                <div
                                    key={key}
                                    className="flex items-start justify-between gap-2 text-sm"
                                >
                                    <span className="min-w-0 break-all font-mono text-xs">{key}</span>
                                    <Badge variant="outline" className="shrink-0">
                                        {count}x
                                    </Badge>
                                </div>
                            ))}
                            {duplicates.length > 15 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-muted-foreground"
                                    onClick={onToggleAllDuplicates}
                                >
                                    {showAllDuplicates
                                        ? "Скрыть"
                                        : `Показать ещё ${duplicates.length - 15}`}
                                </Button>
                            )}
                        </div>
                    ) : null
                }
            />
        </>
    );
}

/**
 * Строки конфликта группируем по аудитории: несколько подгрупп одной лекции
 * в одной аудитории — это норма, конфликт только между разными аудиториями.
 */
export function groupRowsByClassroom(
    rows: { group: string; classroom: string; subject: string; index: number }[]
) {
    const groups = new Map<string, typeof rows>();
    rows.forEach((row) => {
        const list = groups.get(row.classroom) || [];
        list.push(row);
        groups.set(row.classroom, list);
    });

    return [...groups.entries()].map(([classroom, list]) => ({
        classroom,
        rows: list,
        // Подгруппы одной лекции: предмет и тип занятия совпадают
        isOneLecture: list.length > 1 && list.every((row) => row.subject === list[0].subject),
    }));
}

/** Сводка: сколько проверок провалено и сколько предупреждений */
export function ChecksSummary({ analysis }: { analysis: ScheduleAnalysis }) {
    const { criticalCount, warningCount, checks } = analysis;

    if (criticalCount === 0 && warningCount === 0) {
        return (
            <Island>
                <IslandRow
                    icon={<CheckCircleIcon className="h-4 w-4" />}
                    tone="success"
                    title="Всё в порядке"
                    description={`Все ${analysis.total} записей корректны: попадают в календарь, места не пересекаются`}
                    status={{ label: "ок", tone: "success" }}
                />
            </Island>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-2 text-sm">
            {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
                    <AlertOctagonIcon className="h-4 w-4" />
                    {criticalCount}{" "}
                    {plural(
                        criticalCount,
                        "критичная проверка не пройдена",
                        "критичные проверки не пройдены",
                        "критичных проверок не пройдено"
                    )}
                </span>
            )}
            {warningCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1 font-medium text-warning">
                    <UsersIcon className="h-4 w-4" />
                    {warningCount}{" "}
                    {plural(warningCount, "предупреждение", "предупреждения", "предупреждений")}
                </span>
            )}
            <span className="text-muted-foreground">
                Всего проверок: {checks.length}. Критичные — сверху.
            </span>
        </div>
    );
}

/** Русское склонение: 1 проверка, 2 проверки, 5 проверок */
function plural(count: number, one: string, few: string, many: string): string {
    const mod100 = count % 100;
    const mod10 = count % 10;

    if (mod100 >= 11 && mod100 <= 14) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
}

