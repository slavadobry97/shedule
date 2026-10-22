"use client";

import { useMemo, useRef } from "react";
import { parse, isValid } from "date-fns";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TIME_SLOTS } from "@/lib/constants";
import { ScheduleItem } from "@/types/schedule";
import { InvisibleRecord } from "@/types/debug";
import { SheetRowLink } from "@/components/debug/sheet-row-link";
import {
    ArrowDownIcon,
    ArrowUpDownIcon,
    ArrowUpIcon,
    CheckCircleIcon,
    TableIcon,
    ViewIcon,
    ViewOffIcon,
} from "@/components/icons";

// Высота строки таблицы для виртуализации
const ROW_HEIGHT = 36;

export type VisibilityFilter = "all" | "visible" | "invisible";
export type SortField = "group" | "date" | "teacher" | "time" | null;

interface VirtualizedTableProps {
    schedule: ScheduleItem[];
    invisibleRecords: InvisibleRecord[];
    visibilityFilter: VisibilityFilter;
    sortField: SortField;
    sortDirection: "asc" | "desc";
    setSortField: (field: SortField) => void;
    setSortDirection: (direction: "asc" | "desc") => void;
}

export function VirtualizedTable({
    schedule,
    invisibleRecords,
    visibilityFilter,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
}: VirtualizedTableProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    // Готовим данные с индексами и признаком невидимости
    const tableData = useMemo(() => {
        const invisibleIndexes = new Set(invisibleRecords.map((record) => record.index));

        let data = schedule.map((item, idx) => ({
            item,
            originalIndex: idx + 1,
            isInvisible: invisibleIndexes.has(idx + 1),
        }));

        if (visibilityFilter === "visible") {
            data = data.filter((row) => !row.isInvisible);
        } else if (visibilityFilter === "invisible") {
            data = data.filter((row) => row.isInvisible);
        }

        if (sortField) {
            data.sort((a, b) => {
                if (sortField === "date") {
                    const aDate = parse(a.item.date || "", "dd.MM.yyyy", new Date());
                    const bDate = parse(b.item.date || "", "dd.MM.yyyy", new Date());
                    const aTime = isValid(aDate) ? aDate.getTime() : 0;
                    const bTime = isValid(bDate) ? bDate.getTime() : 0;
                    return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
                }

                const aVal = (a.item[sortField] || "").toLowerCase();
                const bVal = (b.item[sortField] || "").toLowerCase();

                if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
                if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [schedule, invisibleRecords, visibilityFilter, sortField, sortDirection]);

    const virtualizer = useVirtualizer({
        count: tableData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 10,
    });

    const handleSort = (field: "group" | "date" | "teacher" | "time") => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const SortIcon = ({ field }: { field: "group" | "date" | "teacher" | "time" }) => {
        if (sortField === field) {
            return sortDirection === "asc" ? (
                <ArrowUpIcon className="h-4 w-4" />
            ) : (
                <ArrowDownIcon className="h-4 w-4" />
            );
        }
        return <ArrowUpDownIcon className="h-4 w-4 text-muted-foreground" />;
    };

    if (tableData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border-2 border-dashed rounded-lg min-h-[300px]">
                {visibilityFilter === "invisible" ? (
                    <>
                        <CheckCircleIcon className="h-10 w-10 mb-4 text-success/50" />
                        <p className="font-medium text-lg text-foreground">Отличная работа!</p>
                        <p className="text-sm">
                            Скрытых записей не обнаружено. Всё расписание отображается корректно.
                        </p>
                    </>
                ) : (
                    <>
                        <TableIcon className="h-10 w-10 mb-4 opacity-30" />
                        <p className="font-medium">Список пуст</p>
                        <p className="text-sm">По выбранным критериям записей не найдено.</p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="w-full text-sm">
            {/* Заголовок и строки — в одном прокручиваемом контейнере. Иначе на
                узком экране заголовок остаётся на месте, а строки уезжают
                вбок и перестают с ним совпадать. */}
            <div ref={parentRef} className="h-[calc(100vh-320px)] overflow-auto">
                <div className="flex border-b bg-background sticky top-0 z-10 min-w-max">
                    <div className="p-2 w-12 shrink-0">#</div>
                    <div
                        className="p-2 w-32 shrink-0 cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort("group")}
                    >
                        <div className="flex items-center gap-1">
                            Группа
                            <SortIcon field="group" />
                        </div>
                    </div>
                    <div
                        className="p-2 w-24 shrink-0 cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort("date")}
                    >
                        <div className="flex items-center gap-1">
                            Дата
                            <SortIcon field="date" />
                        </div>
                    </div>
                    <div className="p-2 w-16 shrink-0">День</div>
                    <div
                        className="p-2 w-28 shrink-0 cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort("time")}
                    >
                        <div className="flex items-center gap-1">
                            Время
                            <SortIcon field="time" />
                        </div>
                    </div>
                    <div className="p-2 flex-1 min-w-40">Дисциплина</div>
                    <div
                        className="p-2 w-40 shrink-0 cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort("teacher")}
                    >
                        <div className="flex items-center gap-1">
                            Преподаватель
                            <SortIcon field="teacher" />
                        </div>
                    </div>
                    <div className="p-2 w-16 shrink-0">Ауд.</div>
                    <div className="p-2 w-16 shrink-0 text-center flex items-center justify-center">
                        <ViewIcon className="h-4 w-4" />
                    </div>
                </div>

                <div
                    className="min-w-max"
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: "100%",
                        position: "relative",
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                        const { item, originalIndex, isInvisible } = tableData[virtualRow.index];
                        return (
                            <div
                                key={originalIndex}
                                className={`flex border-b hover:bg-muted/50 absolute top-0 left-0 w-full ${isInvisible ? "bg-destructive/5 dark:bg-destructive/20" : ""}`}
                                style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <div className="p-2 w-12 shrink-0 text-muted-foreground">
                                    <SheetRowLink index={originalIndex} />
                                </div>
                                <div className="p-2 w-32 shrink-0 truncate">
                                    {item.group || <span className="text-destructive">—</span>}
                                </div>
                                <div className="p-2 w-24 shrink-0">
                                    {item.date || <span className="text-destructive">—</span>}
                                </div>
                                <div className="p-2 w-16 shrink-0">
                                    {item.dayOfWeek || <span className="text-destructive">—</span>}
                                </div>
                                <div
                                    className={`p-2 w-28 shrink-0 ${!TIME_SLOTS.includes(item.time) ? "text-destructive font-semibold" : ""}`}
                                >
                                    {item.time || <span className="text-destructive">—</span>}
                                </div>
                                <div className="p-2 flex-1 min-w-40 truncate">
                                    {item.subject || <span className="text-destructive">—</span>}
                                </div>
                                <div className="p-2 w-40 shrink-0 truncate">
                                    {item.teacher || <span className="text-destructive">—</span>}
                                </div>
                                <div className="p-2 w-16 shrink-0">
                                    {item.classroom || <span className="text-destructive">—</span>}
                                </div>
                                <div className="p-2 w-12 shrink-0 flex items-center justify-center">
                                    {isInvisible ? (
                                        <ViewOffIcon className="h-4 w-4 text-destructive" />
                                    ) : (
                                        <ViewIcon className="h-4 w-4 text-success" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
