"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { ScheduleItem } from "@/types/schedule";
import {
    DAYS_ORDER,
    TABLE_COLUMNS
} from "@/lib/constants";
import { FileDown, ArrowUpDown, ArrowUp, ArrowDown, SearchX, Check, ChevronsUpDown, Search, X } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";

interface VirtualScheduleTableProps {
    scheduleData: ScheduleItem[];
    isLoading?: boolean;
}

type SortField = keyof ScheduleItem;
type SortDirection = "asc" | "desc" | null;

// Фиксированная высота строки и заголовка для virtualization
const ROW_HEIGHT = 50;

export default function VirtualScheduleTable({ scheduleData, isLoading = false }: VirtualScheduleTableProps) {
    const [filter, setFilter] = useState("");
    const [debouncedFilter, setDebouncedFilter] = useState("");
    const [filterType, setFilterType] = useState("teacher");
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [comboboxOpen, setComboboxOpen] = useState(false);

    const parentRef = useRef<HTMLDivElement>(null);

    // State for filter options to avoid blocking render
    const [filterOptions, setFilterOptions] = useState<{ value: string; label: string }[]>([]);

    // Debounce filter input for better performance
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilter(filter);
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [filter]);

    // Effect to calculate filter options asynchronously
    useEffect(() => {
        // Оптимизация: вычисляем опции только если открыт комбобокс или уже выбран фильтр
        if (!comboboxOpen && !filter) {
            setFilterOptions([]);
            return;
        }

        if (!scheduleData || filterType === "all") {
            setFilterOptions([]);
            return;
        }

        // Используем setTimeout для переноса вычислений в конец стека событий
        const timer = setTimeout(() => {
            const uniqueValues = new Set<string>();
            scheduleData.forEach((item) => {
                const value = item[filterType as keyof ScheduleItem];
                if (value) uniqueValues.add(String(value));
            });

            const options = Array.from(uniqueValues)
                .sort((a, b) => {
                    return a.localeCompare(b, "ru");
                })
                .map((value) => ({ value: value.toLowerCase(), label: value }));

            setFilterOptions(options);
        }, 0);

        return () => clearTimeout(timer);
    }, [scheduleData, filterType, comboboxOpen, filter]);

    // Фильтрация данных с поддержкой поиска по всем полям
    const filteredData = useMemo(() => {
        if (!scheduleData) return [];
        if (!debouncedFilter) return []; // Не показывать данные пока не выбран фильтр

        const searchLower = debouncedFilter.toLowerCase();

        return scheduleData.filter((item) => {
            // Поиск по всем полям
            if (filterType === "all") {
                return TABLE_COLUMNS.some((col) => {
                    const value = item[col.key];
                    return value && String(value).toLowerCase().includes(searchLower);
                });
            }

            // Поиск по конкретному полю
            const value = item[filterType as keyof ScheduleItem];
            return value && String(value).toLowerCase().includes(searchLower);
        });
    }, [scheduleData, debouncedFilter, filterType]);

    // Сортировка данных
    const sortedData = useMemo(() => {
        if (!sortField || !sortDirection) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = a[sortField] ?? "";
            const bValue = b[sortField] ?? "";

            // Специальная сортировка для даты (dd.MM.yyyy)
            if (sortField === "date") {
                const parseDate = (dateStr: string) => {
                    const [day, month, year] = dateStr.split(".");
                    return new Date(+year, +month - 1, +day).getTime();
                };
                const aDate = parseDate(String(aValue));
                const bDate = parseDate(String(bValue));
                return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
            }

            // Специальная сортировка для времени
            if (sortField === "time") {
                const parseTime = (timeStr: string) => {
                    const startTime = timeStr.split(" - ")[0];
                    const [hour, minute] = startTime.split(".").map(Number);
                    return hour * 60 + minute;
                };
                const aTime = parseTime(String(aValue));
                const bTime = parseTime(String(bValue));
                return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
            }

            // Специальная сортировка для дней недели
            if (sortField === "dayOfWeek") {
                const aOrder = DAYS_ORDER[String(aValue).toLowerCase()] || 99;
                const bOrder = DAYS_ORDER[String(bValue).toLowerCase()] || 99;
                return sortDirection === "asc" ? aOrder - bOrder : bOrder - aOrder;
            }

            // Строковая сортировка для остальных полей
            const comparison = String(aValue).localeCompare(String(bValue), "ru");
            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [filteredData, sortField, sortDirection]);

    // Virtualizer
    const virtualizer = useVirtualizer({
        count: sortedData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 20, // Render extra rows for smoother scrolling
    });

    // Мемоизированные обработчики
    const handleSort = useCallback((field: SortField) => {
        if (sortField === field) {
            // Переключаем направление: asc -> desc -> null
            if (sortDirection === "asc") {
                setSortDirection("desc");
            } else if (sortDirection === "desc") {
                setSortField(null);
                setSortDirection(null);
            } else {
                setSortDirection("asc");
            }
        } else {
            // Новое поле — начинаем с asc
            setSortField(field);
            setSortDirection("asc");
        }
    }, [sortField, sortDirection]);

    const getSortIcon = useCallback((field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50 shrink-0" />;
        }
        if (sortDirection === "asc") {
            return <ArrowUp className="h-4 w-4 ml-1 shrink-0" />;
        }
        return <ArrowDown className="h-4 w-4 ml-1 shrink-0" />;
    }, [sortField, sortDirection]);

    const handleResetFilter = useCallback(() => {
        setFilter("");
    }, []);

    const downloadPDF = useCallback(async () => {
        try {
            const jsPDF = (await import("jspdf")).default;
            const autoTable = (await import("jspdf-autotable")).default;

            const doc = new jsPDF();

            doc.addFont(
                "https://fonts.cdnfonts.com/s/12165/Roboto-Regular.ttf",
                "Roboto",
                "normal"
            );
            doc.addFont(
                "https://fonts.cdnfonts.com/s/12165/Roboto-Bold.ttf",
                "Roboto-Bold",
                "bold"
            );
            doc.setFont("Roboto-Bold", "bold");
            doc.setFont("Roboto", "normal");

            autoTable(doc, {
                margin: 8,
                head: [TABLE_COLUMNS.map((col) => col.label)],
                body: sortedData.map((item) =>
                    TABLE_COLUMNS.map((col) => item[col.key] ?? "")
                ),
                rowPageBreak: "auto",
                styles: { font: "Roboto", fontSize: 8 },
                headStyles: {
                    fillColor: [200, 200, 200],
                    textColor: 0,
                    fontStyle: "normal",
                    valign: "middle",
                    halign: "center",
                },
                bodyStyles: {
                    valign: "top",
                    halign: "left",
                },
            });

            // Формирование динамического имени файла
            let fileName = "Расписание занятий";
            if (filter) {
                const activeOption = filterOptions.find(opt => opt.value === filter);
                const displayValue = activeOption ? activeOption.label : filter;

                if (filterType === "teacher") {
                    // Форматируем ФИО: Фамилия Имя Отчество -> Фамилия И. И.
                    const parts = displayValue.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        const lastName = parts[0];
                        const initials = parts.slice(1).map(p => `${p[0].toUpperCase()}.`).join(" ");
                        fileName += ` ${lastName} ${initials}`;
                    } else {
                        fileName += ` ${displayValue}`;
                    }
                } else if (filterType === "group") {
                    fileName += ` группы ${displayValue}`;
                } else {
                    fileName += ` ${displayValue}`;
                }
            }

            // Очистка от запрещенных символов
            fileName = fileName.replace(/[\\/:*?"<>|]/g, "").trim();
            doc.save(`${fileName}.pdf`);
        } catch (error) {
            console.error("Failed to load PDF libraries", error);
        }
    }, [sortedData, filter, filterType, filterOptions]);

    // Получить название фильтра для плейсхолдера
    const getFilterPlaceholder = useCallback(() => {
        const filterLabels: Record<string, string> = {
            teacher: "Преподавателю",
            group: "Группе",
            subject: "Дисциплине",
            classroom: "Аудитории",
            lessonType: "Виду занятия",
            all: "всем полям",
        };
        return filterLabels[filterType] || "Выбранному фильтру";
    }, [filterType]);

    return (
        <div className="p-2 h-full flex flex-col">
            {/* Фильтры и кнопки */}
            <div className="flex flex-wrap gap-4 mb-4 shrink-0">
                <Select
                    value={filterType}
                    onValueChange={(value: string) => {
                        setFilterType(value);
                        setFilter("");
                    }}
                    modal={false}
                >
                    <SelectTrigger className="max-w-40 order-first rounded-lg">
                        <SelectValue placeholder="Выберите тип фильтра" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Все поля</SelectItem>
                        <SelectItem value="teacher">Преподаватель</SelectItem>
                        <SelectItem value="group">Группа</SelectItem>
                        <SelectItem value="subject">Дисциплина</SelectItem>
                        <SelectItem value="lessonType">Вид занятия</SelectItem>
                        <SelectItem value="classroom">Аудитория</SelectItem>
                    </SelectContent>
                </Select>
                {/* Комбобокс с автодополнением */}
                <div className="relative w-full sm:w-64 order-last xs:order-2">
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen} modal={false}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={comboboxOpen}
                                className={cn(
                                    "w-full justify-between rounded-lg text-sm font-normal",
                                    filter && "pr-8"
                                )}
                            >
                                <span className="truncate">
                                    {filter
                                        ? filterOptions.find((opt) => opt.value === filter)?.label || filter
                                        : `Поиск по ${getFilterPlaceholder()}...`}
                                </span>
                                {!filter && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0">
                            <Command>
                                <CommandInput placeholder="Начните ввод..." />
                                <CommandEmpty>Ничего не найдено</CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-y-auto">
                                    {filterOptions.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.value}
                                            onSelect={(currentValue) => {
                                                setFilter(currentValue === filter ? "" : currentValue);
                                                setComboboxOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    filter === option.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {option.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {filter && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 mr-1 rounded-full hover:bg-destructive/10 hover:text-destructive z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleResetFilter();
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <Button
                    variant="outline"
                    onClick={downloadPDF}
                    className="order-2 sm:order-last ml-auto"
                    aria-label="Скачать расписание в формате PDF"
                >
                    <FileDown />
                    Скачать PDF
                </Button>
            </div>

            {/* Таблица */}
            <div className="rounded-lg border bg-background flex-1 flex flex-col overflow-hidden">
                <div
                    ref={parentRef}
                    className="flex-1 overflow-auto"
                >
                    {/* Header (Sticky inside scroll container to fix alignment) */}
                    <div className="sticky top-0 z-10 flex border-b bg-slate-100 dark:bg-gray-900 font-medium text-muted-foreground text-sm shrink-0 min-w-max sm:min-w-full">
                        {TABLE_COLUMNS.map((col, idx) => (
                            <div
                                key={col.key}
                                className={cn(
                                    "p-3 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors select-none",
                                    idx < TABLE_COLUMNS.length - 1 ? "border-r" : "",
                                    // Ширины колонок соответствуют данным
                                    col.key === 'group' && "w-40 shrink-0",
                                    col.key === 'dayOfWeek' && "w-24 shrink-0 text-center",
                                    col.key === 'date' && "w-28 shrink-0 text-center",
                                    col.key === 'time' && "w-32 shrink-0 text-center",
                                    col.key === 'subject' && "flex-1 min-w-[200px]",
                                    col.key === 'lessonType' && "w-32 shrink-0",
                                    col.key === 'teacher' && "w-48 shrink-0",
                                    col.key === 'classroom' && "w-24 shrink-0 text-center"
                                )}
                                onClick={() => handleSort(col.key)}
                            >
                                {col.label}
                                {getSortIcon(col.key)}
                            </div>
                        ))}
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {/* Оптимизированное количество скелетонов */}
                            {Array.from({ length: 10 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : sortedData.length > 0 ? (
                        <div
                            style={{
                                height: `${virtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {virtualizer.getVirtualItems().map((virtualRow) => {
                                const item = sortedData[virtualRow.index];
                                return (
                                    <div
                                        key={virtualRow.index}
                                        className="flex border-b hover:bg-slate-50 dark:hover:bg-gray-900/50 absolute top-0 left-0 w-full text-sm items-center min-w-max sm:min-w-full"
                                        style={{
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <div className="w-40 shrink-0 p-2 border-r truncate">{item.group}</div>
                                        <div className="w-24 shrink-0 p-2 border-r text-center">{item.dayOfWeek}</div>
                                        <div className="w-28 shrink-0 p-2 border-r text-center">{item.date}</div>
                                        <div className="w-32 shrink-0 p-2 border-r text-center">{item.time}</div>
                                        <div className="flex-1 min-w-[200px] p-2 border-r truncate" title={item.subject}>{item.subject}</div>
                                        <div className="w-32 shrink-0 p-2 border-r truncate" title={item.lessonType ?? ""}>{item.lessonType}</div>
                                        <div className="w-48 shrink-0 p-2 border-r truncate" title={item.teacher ?? ""}>{item.teacher}</div>
                                        <div className="w-24 shrink-0 p-2 text-center">{item.classroom}</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground h-full min-h-[300px]">
                            {filter ? (
                                <>
                                    <SearchX className="h-12 w-12 opacity-50" />
                                    <div className="text-center">
                                        <p className="font-medium text-lg">Ничего не найдено</p>
                                        <p className="text-sm">По вашему запросу &quot;{filter}&quot; не найдено записей</p>
                                    </div>
                                    <Button variant="outline" onClick={handleResetFilter}>
                                        Сбросить фильтр
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Search className="h-12 w-12 opacity-50" />
                                    <div className="text-center">
                                        <p className="font-medium text-lg">Выберите фильтр</p>
                                        <p className="text-sm">Выберите преподавателя, группу или другой параметр поиска для отображения расписания</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Info */}
            <div className="mt-2 text-xs text-muted-foreground text-center">
                Показано {sortedData.length} записей из {scheduleData?.length || 0}
            </div>
        </div>
    );
}
