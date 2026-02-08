"use client";

import useSWR from "swr";
import { ScheduleItem } from "@/types/schedule";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    RotateCcw,
    Users,
    CalendarDays,
    Clock,
    FileText,
    User,
    AlertOctagon,
    Eye,
    EyeOff,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    MapPin,
    SlidersHorizontal,
    Loader2,
    History,
    LayoutDashboard,
    ShieldCheck,
    Table2,
    Sparkles,
    Bot,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo, useTransition, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { parse, isValid } from "date-fns";
import { DebugAIChat } from "@/components/debug/ai-chat";
import ReactMarkdown from "react-markdown";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
    DrawerTitle,
    DrawerDescription
} from "@/components/ui/drawer";
import { API_ENDPOINTS, REFRESH_INTERVAL } from "@/lib/constants";
import { compareScheduleData, ChangeDetails, LogEntry } from "@/lib/schedule-utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Стандартные тайм-слоты из calendar (schedule-view.tsx)
const VALID_TIME_SLOTS = [
    "08.30 - 10.00",
    "10.10 - 11.40",
    "12.10 - 13.40",
    "13.50 - 15.20",
    "15.30 - 17.00",
    "17.10 - 18.40",
    "18.50 - 20.20",
    "20.30 - 22.00",
];



// Допустимые дни недели
const VALID_DAYS = ["пн", "вт", "ср", "чт", "пт", "сб"];

interface InvisibleRecord {
    item: ScheduleItem;
    index: number;
    reasons: string[];
}

// Высота строки таблицы для виртуализации
const ROW_HEIGHT = 36;

interface VirtualizedTableProps {
    schedule: ScheduleItem[];
    stats: {
        invisibleRecords: InvisibleRecord[];
        total: number;
    } | null;
    visibilityFilter: 'all' | 'visible' | 'invisible';
    sortField: 'group' | 'date' | 'teacher' | 'time' | null;
    sortDirection: 'asc' | 'desc';
    setSortField: (field: 'group' | 'date' | 'teacher' | 'time' | null) => void;
    setSortDirection: (direction: 'asc' | 'desc') => void;
}

function VirtualizedTable({
    schedule,
    stats,
    visibilityFilter,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
}: VirtualizedTableProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    // Подготавливаем данные с индексами и признаком невидимости
    const tableData = useMemo(() => {
        let data = schedule.map((item, idx) => ({
            item,
            originalIndex: idx + 1,
            isInvisible: stats?.invisibleRecords.some(r => r.index === idx + 1) || false
        }));

        // Фильтрация по видимости
        if (visibilityFilter === 'visible') {
            data = data.filter(row => !row.isInvisible);
        } else if (visibilityFilter === 'invisible') {
            data = data.filter(row => row.isInvisible);
        }

        // Сортировка
        if (sortField) {
            data.sort((a, b) => {
                if (sortField === 'date') {
                    const aDate = parse(a.item.date || '', 'dd.MM.yyyy', new Date());
                    const bDate = parse(b.item.date || '', 'dd.MM.yyyy', new Date());
                    const aTime = isValid(aDate) ? aDate.getTime() : 0;
                    const bTime = isValid(bDate) ? bDate.getTime() : 0;
                    return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
                }

                const aVal = (a.item[sortField] || '').toLowerCase();
                const bVal = (b.item[sortField] || '').toLowerCase();

                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [schedule, stats, visibilityFilter, sortField, sortDirection]);

    const virtualizer = useVirtualizer({
        count: tableData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 10,
    });

    const handleSort = (field: 'group' | 'date' | 'teacher' | 'time') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ field }: { field: 'group' | 'date' | 'teacher' | 'time' }) => {
        if (sortField === field) {
            return sortDirection === 'asc'
                ? <ArrowUp className="h-4 w-4" />
                : <ArrowDown className="h-4 w-4" />;
        }
        return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    };

    if (tableData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border-2 border-dashed rounded-lg min-h-[300px]">
                {visibilityFilter === 'invisible' ? (
                    <>
                        <CheckCircle className="h-10 w-10 mb-4 text-green-500/50" />
                        <p className="font-medium text-lg text-foreground">Отличная работа!</p>
                        <p className="text-sm">Скрытых записей не обнаружено. Всё расписание отображается корректно.</p>
                    </>
                ) : (
                    <>
                        <Table2 className="h-10 w-10 mb-4 opacity-30" />
                        <p className="font-medium">Список пуст</p>
                        <p className="text-sm">По выбранным критериям записей не найдено.</p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="w-full text-sm">
            {/* Заголовок таблицы */}
            <div className="flex border-b bg-background sticky top-0 z-10">
                <div className="p-2 w-12 shrink-0">#</div>
                <div
                    className="p-2 w-32 shrink-0 cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('group')}
                >
                    <div className="flex items-center gap-1">
                        Группа
                        <SortIcon field="group" />
                    </div>
                </div>
                <div
                    className="p-2 w-24 shrink-0 cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('date')}
                >
                    <div className="flex items-center gap-1">
                        Дата
                        <SortIcon field="date" />
                    </div>
                </div>
                <div className="p-2 w-16 shrink-0">День</div>
                <div
                    className="p-2 w-28 shrink-0 cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('time')}
                >
                    <div className="flex items-center gap-1">
                        Время
                        <SortIcon field="time" />
                    </div>
                </div>
                <div className="p-2 flex-1 min-w-40">Дисциплина</div>
                <div
                    className="p-2 w-40 shrink-0 cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('teacher')}
                >
                    <div className="flex items-center gap-1">
                        Преподаватель
                        <SortIcon field="teacher" />
                    </div>
                </div>
                <div className="p-2 w-16 shrink-0">Ауд.</div>
                <div className="p-2 w-16 shrink-0 text-center flex items-center justify-center">
                    <Eye className="h-4 w-4" />
                </div>
            </div>

            {/* Виртуализированный контейнер */}
            <div
                ref={parentRef}
                className="h-[calc(100vh-320px)] overflow-auto"
            >
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                        const { item, originalIndex, isInvisible } = tableData[virtualRow.index];
                        return (
                            <div
                                key={originalIndex}
                                className={`flex border-b hover:bg-muted/50 absolute top-0 left-0 w-full ${isInvisible ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                                style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <div className="p-2 w-12 shrink-0 text-muted-foreground">{originalIndex}</div>
                                <div className="p-2 w-32 shrink-0 truncate">{item.group || <span className="text-red-500">—</span>}</div>
                                <div className="p-2 w-24 shrink-0">{item.date || <span className="text-red-500">—</span>}</div>
                                <div className="p-2 w-16 shrink-0">{item.dayOfWeek || <span className="text-red-500">—</span>}</div>
                                <div className={`p-2 w-28 shrink-0 ${!VALID_TIME_SLOTS.includes(item.time) ? 'text-red-600 font-semibold' : ''}`}>
                                    {item.time || <span className="text-red-500">—</span>}
                                </div>
                                <div className="p-2 flex-1 min-w-40 truncate">{item.subject || <span className="text-red-500">—</span>}</div>
                                <div className="p-2 w-40 shrink-0 truncate">{item.teacher || <span className="text-red-500">—</span>}</div>
                                <div className="p-2 w-16 shrink-0">{item.classroom || <span className="text-red-500">—</span>}</div>
                                <div className="p-2 w-12 shrink-0 flex items-center justify-center">
                                    {isInvisible ? (
                                        <EyeOff className="h-4 w-4 text-red-500" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-green-500" />
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

// Компонент для отображения Changelog
function ChangelogContent() {
    const { data, error, isLoading } = useSWR<{ content: string }>('/api/changelog', fetcher);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <div className="space-y-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardContent className="pt-6 flex items-center gap-2 text-destructive">
                    <XCircle className="h-4 w-4" />
                    Ошибка загрузки истории версий
                </CardContent>
            </Card>
        );
    }

    // Рендер в стиле shadcn/ui с использованием ReactMarkdown
    const renderChangelog = (content: string) => {
        return (
            <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                    components={{
                        h1: () => null, // Пропускаем главный заголовок
                        h2: ({ children }) => (
                            <div className="flex items-center gap-3 mt-6 first:mt-0 mb-4 border-b pb-2">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                <span className="text-lg font-semibold m-0">{children}</span>
                            </div>
                        ),
                        h3: ({ children }) => {
                            const text = String(children);
                            let variant: "default" | "secondary" | "destructive" | "outline" = "default";
                            let icon = <CheckCircle className="h-3 w-3" />;

                            if (text.includes('Добавлено')) {
                                variant = "default";
                                icon = <CheckCircle className="h-3 w-3" />;
                            } else if (text.includes('Улучшено') || text.includes('Обновлено')) {
                                variant = "secondary";
                                icon = <ArrowUp className="h-3 w-3" />;
                            } else if (text.includes('Удалено')) {
                                variant = "destructive";
                                icon = <XCircle className="h-3 w-3" />;
                            } else if (text.includes('Исправлено')) {
                                variant = "outline";
                                icon = <CheckCircle className="h-3 w-3" />;
                            }

                            return (
                                <Badge variant={variant} className="mt-4 mb-2 gap-1 flex w-fit">
                                    {icon}
                                    {children}
                                </Badge>
                            );
                        },
                        ul: ({ children }) => <ul className="space-y-1 ml-1 list-none p-0">{children}</ul>,
                        li: ({ children }) => (
                            <div className="flex items-start gap-2 py-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 shrink-0" />
                                <div className="text-sm text-muted-foreground flex-1">{children}</div>
                            </div>
                        ),
                        hr: () => <Separator className="my-6" />,
                        p: ({ children }) => <p className="text-sm text-muted-foreground my-1">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    История изменений
                </CardTitle>
                <CardDescription>
                    Что нового в приложении
                </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {data?.content && renderChangelog(data.content)}
            </CardContent>
        </Card>
    );
}

// Компонент для отображения лога сессии в Debug
function SessionLog() {
    const [log, setLog] = useState<LogEntry[]>([]);

    // Загружаем лог при монтировании и добавляем слушатель на изменение (если нужно реактивно, но sessionStorage не триггерит events в той же вкладке)
    // Поэтому просто читаем при рендере, так как вкладка переключается
    useEffect(() => {
        const loadLog = () => {
            if (typeof window !== 'undefined') {
                try {
                    const stored = sessionStorage.getItem('schedule_changes_log');
                    if (stored) {
                        setLog(JSON.parse(stored));
                    }
                } catch (e) {
                    console.error("Failed to parse log", e);
                }
            }
        };
        loadLog();

        // Можно добавить интервал или кнопку обновления, но пока хватит загрузки при маунте
    }, []);

    const handleClear = () => {
        sessionStorage.removeItem('schedule_changes_log');
        setLog([]);
    };

    if (log.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Лог сессии</CardTitle>
                    <CardDescription>История изменений расписания за текущую сессию</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <History className="h-8 w-8 mb-2 opacity-50" />
                        <p>Лог пуст. Изменений пока не было.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Лог сессии</CardTitle>
                    <CardDescription>Показаны последние 50 записей об изменениях</CardDescription>
                </div>
                <Button variant="destructive" size="sm" onClick={handleClear}>
                    <Trash2 className="h-4 w-4" />
                    Очистить
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {log.map((entry, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="font-mono">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {entry.changes.added.length > 0 && (
                                <div className="text-sm">
                                    <span className="font-semibold text-green-600">Добавлено: {entry.changes.added.length}</span>
                                    <ul className="list-disc list-inside text-muted-foreground mt-1 text-xs pl-2">
                                        {entry.changes.added.map((item, i) => (
                                            <li key={i}>{item.subject} ({item.group}, {item.time})</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {entry.changes.modified.length > 0 && (
                                <div className="text-sm">
                                    <span className="font-semibold text-amber-600">Изменено: {entry.changes.modified.length}</span>
                                    <div className="grid gap-2 mt-2">
                                        {entry.changes.modified.map(({ old, new: cur }, i) => {
                                            const changes: { field: string; from: string; to: string }[] = [];
                                            if (old.subject !== cur.subject) changes.push({ field: 'Дисциплина', from: old.subject, to: cur.subject });
                                            if (old.teacher !== cur.teacher) changes.push({ field: 'Преподаватель', from: old.teacher || '-', to: cur.teacher || '-' });
                                            if (old.classroom !== cur.classroom) changes.push({ field: 'Аудитория', from: old.classroom || '-', to: cur.classroom || '-' });
                                            if (old.lessonType !== cur.lessonType) changes.push({ field: 'Тип', from: old.lessonType || '-', to: cur.lessonType || '-' });
                                            if (old.time !== cur.time) changes.push({ field: 'Время', from: old.time || '-', to: cur.time || '-' });
                                            if (old.date !== cur.date) changes.push({ field: 'Дата', from: old.date || '-', to: cur.date || '-' });

                                            return (
                                                <div key={i} className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm text-sm">
                                                    <div className="font-semibold">{cur.subject}</div>
                                                    <div className="text-muted-foreground flex flex-wrap gap-2 mt-1 mb-2 text-xs">
                                                        <Badge variant="outline">{cur.date}</Badge>
                                                        <Badge variant="outline">{cur.time}</Badge>
                                                        <Badge variant="outline">{cur.group}</Badge>
                                                        {cur.teacher && <Badge variant="secondary">{cur.teacher}</Badge>}
                                                    </div>

                                                    {changes.length > 0 ? (
                                                        <div className="space-y-1 bg-muted/50 p-2 rounded text-xs">
                                                            {changes.map((change, idx) => (
                                                                <div key={idx}>
                                                                    <span className="text-muted-foreground">{change.field}: </span>
                                                                    <span className="line-through text-red-500/70">{change.from}</span>
                                                                    <span className="mx-1">→</span>
                                                                    <span className="text-green-600 dark:text-green-400 font-medium">{change.to}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-muted-foreground italic">Нет видимых изменений</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {entry.changes.removed.length > 0 && (
                                <div className="text-sm">
                                    <span className="font-semibold text-red-600">Удалено: {entry.changes.removed.length}</span>
                                    <ul className="list-disc list-inside text-muted-foreground mt-1 text-xs pl-2">
                                        {entry.changes.removed.map((item, i) => (
                                            <li key={i}>{item.subject} ({item.group})</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default function DebugClient() {
    const { data: schedule, error, isLoading, mutate } = useSWR<ScheduleItem[]>(
        "/api/schedule/",
        fetcher,
        {
            refreshInterval: REFRESH_INTERVAL, // Обновляем данные автоматически
        }
    );

    const [showAllDuplicates, setShowAllDuplicates] = useState(false);
    const [showAllInvisible, setShowAllInvisible] = useState(false);

    // Логика отслеживания изменений (аналогично DynamicSchedule)
    const previousDataRef = useRef<ScheduleItem[] | null>(null);
    const isFirstLoadRef = useRef(true);

    useEffect(() => {
        if (schedule && schedule.length > 0) {
            if (isFirstLoadRef.current) {
                previousDataRef.current = [...schedule];
                isFirstLoadRef.current = false;
            } else if (previousDataRef.current) {
                const changes = compareScheduleData(previousDataRef.current, schedule);

                if (typeof window !== 'undefined') {
                    try {
                        const hasAnyChanges = changes.added.length > 0 || changes.removed.length > 0 || changes.modified.length > 0;
                        if (hasAnyChanges) {
                            const logEntry: LogEntry = {
                                timestamp: Date.now(),
                                changes: changes
                            };
                            const existingLog = sessionStorage.getItem('schedule_changes_log');
                            const log = existingLog ? JSON.parse(existingLog) : [];
                            log.unshift(logEntry);
                            if (log.length > 50) log.length = 50;
                            sessionStorage.setItem('schedule_changes_log', JSON.stringify(log));
                        }
                    } catch (e) {
                        console.error('Failed to log schedule changes in debug', e);
                    }
                }

                previousDataRef.current = [...schedule];
            }
        }
    }, [schedule]);


    // Фильтр и сортировка таблицы
    const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'invisible'>('invisible');
    const [sortField, setSortField] = useState<'group' | 'date' | 'teacher' | 'time' | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Состояние обновления
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Проверка мобильного устройства
    const isMobile = useIsMobile();

    // Обработчик кнопки "Обновить"
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await mutate();
        } finally {
            setIsRefreshing(false);
        }
    };

    // Вычисляем статистику и проверки
    const stats = useMemo(() => {
        if (!schedule) return null;

        const uniqueGroups = new Set(schedule.map(item => item.group));
        const uniqueTeachers = new Set(schedule.map(item => item.teacher));
        const uniqueDates = new Set(schedule.map(item => item.date));
        const uniqueSubjects = new Set(schedule.map(item => item.subject));
        const uniqueTimeSlots = new Set(schedule.map(item => item.time));

        // Проверяем на пустые поля
        const emptyFields = {
            group: schedule.filter(item => !item.group || item.group.trim() === '').length,
            date: schedule.filter(item => !item.date || item.date.trim() === '').length,
            time: schedule.filter(item => !item.time || item.time.trim() === '').length,
            subject: schedule.filter(item => !item.subject || item.subject.trim() === '').length,
            teacher: schedule.filter(item => !item.teacher || item.teacher.trim() === '').length,
            classroom: schedule.filter(item => !item.classroom || item.classroom.trim() === '').length,
        };

        // Дубликаты (по ключу группа-дата-время-преподаватель-предмет)
        const keyCount = new Map<string, number>();
        schedule.forEach(item => {
            const key = `${item.group} | ${item.date} | ${item.time} | ${item.teacher} | ${item.subject}`;
            keyCount.set(key, (keyCount.get(key) || 0) + 1);
        });
        const duplicates = Array.from(keyCount.entries()).filter(([, count]) => count > 1);

        // === КРИТИЧЕСКИЕ ПРОВЕРКИ ДЛЯ ОТОБРАЖЕНИЯ В КАЛЕНДАРЕ ===

        // 1. Проверка тайм-слотов
        const invalidTimeSlots: { item: ScheduleItem; index: number }[] = [];
        schedule.forEach((item, index) => {
            if (item.time && !VALID_TIME_SLOTS.includes(item.time)) {
                invalidTimeSlots.push({ item, index: index + 1 });
            }
        });

        // 2. Проверка формата даты (dd.MM.yyyy)
        const invalidDates: { item: ScheduleItem; index: number }[] = [];
        schedule.forEach((item, index) => {
            if (item.date) {
                const parsed = parse(item.date, "dd.MM.yyyy", new Date());
                if (!isValid(parsed)) {
                    invalidDates.push({ item, index: index + 1 });
                }
            }
        });

        // 3. Проверка дня недели
        const invalidDays: { item: ScheduleItem; index: number }[] = [];
        schedule.forEach((item, index) => {
            if (item.dayOfWeek) {
                const dayLower = item.dayOfWeek.toLowerCase();
                const hasValidDay = VALID_DAYS.some(d => dayLower.includes(d));
                if (!hasValidDay) {
                    invalidDays.push({ item, index: index + 1 });
                }
            }
        });

        // 4. Сводка: записи которые НЕ отобразятся в календаре
        const invisibleRecords: InvisibleRecord[] = [];
        schedule.forEach((item, index) => {
            const reasons: string[] = [];

            // Проверка времени
            if (item.time && !VALID_TIME_SLOTS.includes(item.time)) {
                reasons.push(`Время "${item.time}" не совпадает со слотами календаря`);
            }

            // Проверка даты
            if (item.date) {
                const parsed = parse(item.date, "dd.MM.yyyy", new Date());
                if (!isValid(parsed)) {
                    reasons.push(`Неверный формат даты "${item.date}"`);
                }
            } else {
                reasons.push("Дата не указана");
            }

            // Проверка дня недели
            if (item.dayOfWeek) {
                const dayLower = item.dayOfWeek.toLowerCase();
                const hasValidDay = VALID_DAYS.some(d => dayLower.includes(d));
                if (!hasValidDay) {
                    reasons.push(`День недели "${item.dayOfWeek}" не распознан`);
                }
            }

            if (reasons.length > 0) {
                invisibleRecords.push({ item, index: index + 1, reasons });
            }
        });

        // 5. ГЛУБОКАЯ АНАЛИТИКА: Нагрузка и Окна

        // Нагрузка преподавателей
        const teacherWorkload: Record<string, number> = {};
        schedule.forEach(item => {
            if (item.teacher) {
                teacherWorkload[item.teacher] = (teacherWorkload[item.teacher] || 0) + 1;
            }
        });

        // Поиск окон у групп
        const groupDaySchedule: Record<string, Record<string, Set<string>>> = {};
        schedule.forEach(item => {
            if (item.group && item.date && item.time) {
                if (!groupDaySchedule[item.group]) groupDaySchedule[item.group] = {};
                if (!groupDaySchedule[item.group][item.date]) groupDaySchedule[item.group][item.date] = new Set();
                groupDaySchedule[item.group][item.date].add(item.time);
            }
        });

        const gaps: { group: string; date: string; gapTime: string }[] = [];
        Object.entries(groupDaySchedule).forEach(([group, dates]) => {
            Object.entries(dates).forEach(([date, times]) => {
                const daySlots = VALID_TIME_SLOTS.map((slot, index) => ({ slot, index }))
                    .filter(s => times.has(s.slot));

                if (daySlots.length > 1) {
                    const minIdx = Math.min(...daySlots.map(s => s.index));
                    const maxIdx = Math.max(...daySlots.map(s => s.index));

                    for (let i = minIdx + 1; i < maxIdx; i++) {
                        if (!times.has(VALID_TIME_SLOTS[i])) {
                            gaps.push({ group, date, gapTime: VALID_TIME_SLOTS[i] });
                        }
                    }
                }
            });
        });

        // 6. АНАЛИТИКА АУДИТОРИЙ

        // Использование аудиторий
        const classroomUsage: Record<string, number> = {};
        schedule.forEach(item => {
            if (item.classroom) {
                classroomUsage[item.classroom] = (classroomUsage[item.classroom] || 0) + 1;
            }
        });

        // Конфликты аудиторий (двойное бронирование разными преподавателями)
        const classroomConflicts: { classroom: string; date: string; time: string; teachers: string[]; subjects: string[] }[] = [];
        const classroomOccupancy = new Map<string, { teacher: string; subject: string; group: string }>();

        schedule.forEach(item => {
            if (item.classroom && item.date && item.time && item.teacher) {
                const key = `${item.classroom}|${item.date}|${item.time}`;
                const existing = classroomOccupancy.get(key);

                if (existing) {
                    // Конфликт только если разные преподаватели (потоковая лекция - не конфликт)
                    if (existing.teacher !== item.teacher) {
                        const existingConflict = classroomConflicts.find(
                            c => c.classroom === item.classroom && c.date === item.date && c.time === item.time
                        );

                        if (existingConflict) {
                            if (!existingConflict.teachers.includes(item.teacher)) {
                                existingConflict.teachers.push(item.teacher);
                                existingConflict.subjects.push(item.subject);
                            }
                        } else {
                            classroomConflicts.push({
                                classroom: item.classroom,
                                date: item.date,
                                time: item.time,
                                teachers: [existing.teacher, item.teacher],
                                subjects: [existing.subject, item.subject]
                            });
                        }
                    }
                } else {
                    classroomOccupancy.set(key, {
                        teacher: item.teacher,
                        subject: item.subject,
                        group: item.group
                    });
                }
            }
        });

        // Процент использования аудиторий (для выявления недоиспользуемых)
        const totalTimeSlots = uniqueDates.size * VALID_TIME_SLOTS.length; // Всего возможных слотов
        const classroomUtilization = Object.entries(classroomUsage).map(([classroom, count]) => ({
            classroom,
            count,
            utilizationPercent: (count / totalTimeSlots) * 100
        })).sort((a, b) => a.utilizationPercent - b.utilizationPercent); // Сортировка по возрастанию (недоиспользуемые первыми)

        return {
            total: schedule.length,
            groups: uniqueGroups.size,
            teachers: uniqueTeachers.size,
            dates: uniqueDates.size,
            subjects: uniqueSubjects.size,
            timeSlots: uniqueTimeSlots.size,
            emptyFields,
            duplicates,
            hasEmptyFields: Object.values(emptyFields).some(v => v > 0),
            hasDuplicates: duplicates.length > 0,
            invalidTimeSlots,
            invalidDates,
            invalidDays,
            invisibleRecords,
            hasInvalidTimeSlots: invalidTimeSlots.length > 0,
            hasInvalidDates: invalidDates.length > 0,
            hasInvalidDays: invalidDays.length > 0,
            hasInvisibleRecords: invisibleRecords.length > 0,
            // Новая аналитика
            teacherWorkload: Object.entries(teacherWorkload)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15), // Топ-15 нагруженных для контекста
            gaps: gaps.slice(0, 20), // Первые 20 окон для примера
            totalGaps: gaps.length,
            // Аналитика аудиторий
            classroomUsage: Object.entries(classroomUsage)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10), // Топ-10 аудиторий
            classroomConflicts: classroomConflicts,
            hasClassroomConflicts: classroomConflicts.length > 0,
            classroomUtilization: classroomUtilization, // Все аудитории с процентом использования
        };
    }, [schedule]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-2 border-muted" />
                    <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">Загрузка данных...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-8">
                <Card className="border-red-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-500">
                            <XCircle className="h-5 w-5" />
                            Ошибка загрузки
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error.message}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h1 className="text-lg sm:text-xl font-semibold flex items-center gap-2 sm:gap-3">
                    <Badge variant="outline" className="text-xs font-mono">Debug</Badge>
                    Проверка данных расписания
                </h1>
                <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
                    {isRefreshing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    {isRefreshing ? "Обновление..." : "Обновить"}
                </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto">
                    <TabsTrigger value="overview" className="flex items-center gap-1.5">
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        Обзор
                    </TabsTrigger>
                    <TabsTrigger value="checks" className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Проверки
                    </TabsTrigger>
                    <TabsTrigger value="details" className="flex items-center gap-1.5">
                        <Table2 className="h-3.5 w-3.5" />
                        Детали
                    </TabsTrigger>
                    <TabsTrigger value="session-log" className="flex items-center gap-1.5">
                        <Trash2 className="h-3.5 w-3.5" />
                        Лог сессии
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-1.5">
                        <History className="h-3.5 w-3.5" />
                        История
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">

                    {/* КРИТИЧЕСКАЯ СЕКЦИЯ: Невидимые записи */}
                    {stats?.hasInvisibleRecords && (
                        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <AlertOctagon className="h-5 w-5" />
                                    КРИТИЧНО: {stats.invisibleRecords.length} записей НЕ отображаются в календаре!
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-red-600 mb-4">
                                    Эти записи есть в Google Sheets, но студенты и преподаватели их НЕ видят!
                                </p>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {(showAllInvisible ? stats.invisibleRecords : stats.invisibleRecords.slice(0, 5)).map(({ item, index, reasons }) => (
                                        <div key={index} className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="outline" className="font-mono">#{index}</Badge>
                                                        <span className="font-semibold">{item.group}</span>
                                                        <span className="text-muted-foreground">|</span>
                                                        <span>{item.date}</span>
                                                        <span className="text-muted-foreground">|</span>
                                                        <span className="text-red-600 font-medium">{item.time}</span>
                                                    </div>
                                                    <p className="text-sm mt-1">{item.subject}</p>
                                                    <div className="mt-2 space-y-1">
                                                        {reasons.map((reason, i) => (
                                                            <p key={i} className="text-xs text-red-600 flex items-center gap-1">
                                                                <EyeOff className="h-3 w-3" />
                                                                {reason}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {stats.invisibleRecords.length > 5 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-red-600"
                                            onClick={() => setShowAllInvisible(!showAllInvisible)}
                                        >
                                            {showAllInvisible
                                                ? "Скрыть"
                                                : `Показать все ${stats.invisibleRecords.length} записей`}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Индикатор: всё ОК */}
                    {!stats?.hasInvisibleRecords && (
                        <Card className="border border-green-500">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <Eye className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="font-medium text-green-600">Все записи отображаются в календаре</p>
                                        <p className="text-sm text-muted-foreground">
                                            Все {stats?.total} записей из Google Sheets корректно попадают в календарь
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Общая статистика */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Занятий</span>
                                </div>
                                <p className="text-3xl font-bold font-mono tabular-nums">{stats?.total || 0}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Группы</span>
                                </div>
                                <p className="text-3xl font-bold font-mono tabular-nums">{stats?.groups || 0}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Преподаватели</span>
                                </div>
                                <p className="text-3xl font-bold font-mono tabular-nums">{stats?.teachers || 0}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Учебные дни</span>
                                </div>
                                <p className="text-3xl font-bold font-mono tabular-nums">{stats?.dates || 0}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Временные слоты</span>
                                </div>
                                <p className="text-3xl font-bold font-mono tabular-nums">{stats?.timeSlots || 0}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Дисциплины</span>
                                </div>
                                <p className="text-3xl font-bold font-mono tabular-nums">{stats?.subjects || 0}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Аналитика (свернута по умолчанию) */}
                    <Accordion type="multiple" className="space-y-4">
                        {/* Нагрузка преподавателей */}
                        {stats?.teacherWorkload && stats.teacherWorkload.length > 0 && (
                            <AccordionItem value="teacher-workload" className="border rounded-lg">
                                <AccordionTrigger className="px-6 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        <div className="text-left">
                                            <p className="font-semibold">Нагрузка преподавателей</p>
                                            <p className="text-sm text-muted-foreground font-normal">
                                                Топ-10 самых загруженных преподавателей
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <div className="space-y-3">
                                        {stats.teacherWorkload.slice(0, 10).map(([teacher, count], index) => {
                                            const maxCount = stats.teacherWorkload[0][1];
                                            const percentage = (count / maxCount) * 100;

                                            // Цветовая кодировка
                                            let barColor = "bg-green-500";
                                            if (percentage > 80) barColor = "bg-red-500";
                                            else if (percentage > 60) barColor = "bg-amber-500";

                                            return (
                                                <div key={teacher} className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            <Badge variant="outline" className="font-mono shrink-0">
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
                                                            className={`h-full ${barColor} transition-all`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {stats.teacherWorkload.length > 10 && (
                                        <p className="text-xs text-muted-foreground mt-4">
                                            Показано топ-10 из {stats.teacherWorkload.length} преподавателей
                                        </p>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        )}

                        {/* Окна в расписании */}
                        {stats?.gaps && stats.gaps.length > 0 && (
                            <AccordionItem value="schedule-gaps" className="border rounded-lg">
                                <AccordionTrigger className="px-6 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-amber-500" />
                                        <div className="text-left">
                                            <p className="font-semibold">Окна в расписании групп</p>
                                            <p className="text-sm text-muted-foreground font-normal">
                                                Найдено {stats.totalGaps} свободных слотов между занятиями
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/50">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                                Найдено {stats.totalGaps} окон в расписании
                                            </p>
                                        </div>
                                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                            Окна снижают посещаемость и увеличивают время пребывания студентов в университете
                                        </p>
                                    </div>

                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {stats.gaps.map((gap, index) => (
                                            <div
                                                key={`${gap.group}-${gap.date}-${gap.gapTime}-${index}`}
                                                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                            >
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
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

                                    {stats.totalGaps > 20 && (
                                        <p className="text-xs text-muted-foreground mt-4">
                                            Показано первых 20 из {stats.totalGaps} окон
                                        </p>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        )}

                        {/* Использование аудиторий */}
                        {stats?.classroomUsage && stats.classroomUsage.length > 0 && (
                            <AccordionItem value="classroom-usage" className="border rounded-lg">
                                <AccordionTrigger className="px-6 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-blue-500" />
                                        <div className="text-left">
                                            <p className="font-semibold">Использование аудиторий</p>
                                            <p className="text-sm text-muted-foreground font-normal">
                                                Топ-10 аудиторий и {stats.hasClassroomConflicts ? `${stats.classroomConflicts.length} конфликтов` : 'конфликтов нет'}
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6 space-y-6">
                                    {/* Конфликты (если есть) */}
                                    {stats.hasClassroomConflicts && (
                                        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertOctagon className="h-4 w-4 text-red-600" />
                                                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                                    Найдено {stats.classroomConflicts.length} конфликтов (двойное бронирование)
                                                </p>
                                            </div>
                                            <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                                                Разные преподаватели используют одну аудиторию в одно время
                                            </p>
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {stats.classroomConflicts.map((conflict, index) => (
                                                    <div
                                                        key={`${conflict.classroom}-${conflict.date}-${conflict.time}-${index}`}
                                                        className="p-2 bg-white dark:bg-gray-900 rounded border border-red-200 dark:border-red-800"
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="h-3.5 w-3.5 text-red-600" />
                                                                <span className="font-semibold text-sm">ауд. {conflict.classroom}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Badge variant="outline" className="font-mono text-xs">
                                                                    {conflict.date}
                                                                </Badge>
                                                                <Badge variant="destructive" className="font-mono text-xs">
                                                                    {conflict.time}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs space-y-1">
                                                            {conflict.teachers.map((teacher, i) => (
                                                                <div key={i} className="flex items-center gap-1 text-muted-foreground">
                                                                    <User className="h-3 w-3" />
                                                                    <span>{teacher}</span>
                                                                    <span className="text-xs">({conflict.subjects[i]})</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Топ-10 аудиторий */}
                                    <div>
                                        <h4 className="text-sm font-semibold mb-3">Топ-10 самых используемых аудиторий</h4>
                                        <div className="space-y-3">
                                            {stats.classroomUsage.map(([classroom, count], index) => {
                                                const maxCount = stats.classroomUsage[0][1];
                                                const percentage = (count / maxCount) * 100;

                                                // Цветовая кодировка
                                                let barColor = "bg-blue-500";
                                                if (percentage > 80) barColor = "bg-purple-500";
                                                else if (percentage > 60) barColor = "bg-blue-600";

                                                return (
                                                    <div key={classroom} className="space-y-1">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                <Badge variant="outline" className="font-mono shrink-0">
                                                                    #{index + 1}
                                                                </Badge>
                                                                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                <span className="truncate font-medium">ауд. {classroom}</span>
                                                            </div>
                                                            <span className="font-bold tabular-nums shrink-0 ml-2">
                                                                {count} пар
                                                            </span>
                                                        </div>
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${barColor} transition-all`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Недоиспользуемые аудитории */}
                                    {stats.classroomUtilization && stats.classroomUtilization.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Недоиспользуемые аудитории (для планирования ремонта)</h4>
                                            <p className="text-xs text-muted-foreground mb-3">
                                                Аудитории с низкой загрузкой - кандидаты на ремонт или перепрофилирование
                                            </p>
                                            <div className="space-y-2">
                                                {stats.classroomUtilization.slice(0, 10).map((item) => {
                                                    // Цветовая кодировка по загрузке
                                                    let bgColor = "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50";
                                                    let textColor = "text-green-700 dark:text-green-300";
                                                    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";

                                                    if (item.utilizationPercent < 10) {
                                                        bgColor = "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50";
                                                        textColor = "text-red-700 dark:text-red-300";
                                                        badgeVariant = "destructive";
                                                    } else if (item.utilizationPercent < 25) {
                                                        bgColor = "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50";
                                                        textColor = "text-amber-700 dark:text-amber-300";
                                                        badgeVariant = "secondary";
                                                    }

                                                    return (
                                                        <div
                                                            key={item.classroom}
                                                            className={`p-2 rounded-lg border ${bgColor}`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    <span className="font-medium text-sm">ауд. {item.classroom}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-xs ${textColor} font-medium`}>
                                                                        {item.count} пар
                                                                    </span>
                                                                    <Badge variant={badgeVariant} className="text-xs">
                                                                        {item.utilizationPercent.toFixed(1)}%
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-3">
                                                🔴 Менее 10% - критически низкая загрузка | 🟡 10-25% - низкая загрузка | 🟢 Более 25% - нормальная
                                            </p>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        )}
                    </Accordion>

                </TabsContent>

                <TabsContent value="checks" className="space-y-6">
                    {/* Проверки: Тайм-слоты */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card className={stats?.hasInvalidTimeSlots ? "border border-red-500" : "border border-green-500"}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {stats?.hasInvalidTimeSlots ? (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    ) : (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    )}
                                    <span>Формат времени</span>
                                </CardTitle>
                                <CardDescription>
                                    Проверка корректности записи времени (ЧЧ:ММ - ЧЧ:ММ)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {stats?.hasInvalidTimeSlots ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-red-600 mb-2">
                                            Найдено {stats.invalidTimeSlots.length} записей с нестандартным временем.
                                            Они не отобразятся в календаре!
                                        </p>
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {stats.invalidTimeSlots.slice(0, 10).map(({ item, index }) => (
                                                <div key={index} className="flex items-center justify-between text-sm">
                                                    <span className="truncate">#{index} {item.group} — {item.date}</span>
                                                    <Badge variant="destructive">{item.time}</Badge>
                                                </div>
                                            ))}
                                            {stats.invalidTimeSlots.length > 10 && (
                                                <p className="text-xs text-muted-foreground">
                                                    ...и ещё {stats.invalidTimeSlots.length - 10}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-2 pt-2 border-t">
                                            <p className="text-xs text-muted-foreground">Допустимые слоты:</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {VALID_TIME_SLOTS.map(slot => (
                                                    <Badge key={slot} variant="outline" className="text-xs">{slot}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-100 dark:border-green-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
                                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-green-900 dark:text-green-100">Всё отлично!</p>
                                                <p className="text-sm text-green-700 dark:text-green-300">Все записи имеют корректный формат времени</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Проверка формата даты */}
                        <Card className={stats?.hasInvalidDates ? "border border-red-500" : "border border-green-500"}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {stats?.hasInvalidDates ? (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    ) : (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    )}
                                    <span>Формат даты</span>
                                </CardTitle>
                                <CardDescription>
                                    Проверка корректности записи даты (ДД.ММ.ГГГГ)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {stats?.hasInvalidDates ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-red-600">
                                            Найдено {stats.invalidDates.length} записей с некорректной датой (ожидается dd.MM.yyyy)
                                        </p>
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {stats.invalidDates.slice(0, 10).map(({ item, index }) => (
                                                <div key={index} className="flex items-center justify-between text-sm">
                                                    <span className="truncate">#{index} {item.group}</span>
                                                    <Badge variant="destructive">{item.date || "пусто"}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-100 dark:border-green-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
                                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-green-900 dark:text-green-100">Всё отлично!</p>
                                                <p className="text-sm text-green-700 dark:text-green-300">Все даты указаны верно</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <Separator />

                    {/* Проверки: Пустые поля и дубликаты */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Пустые поля */}
                        <Card className={stats?.hasEmptyFields ? "border border-amber-500" : "border border-green-500"}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {stats?.hasEmptyFields ? (
                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    ) : (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    )}
                                    <span>Заполненность данных</span>
                                </CardTitle>
                                <CardDescription>
                                    Поиск пропущенных обязательных полей
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {stats?.hasEmptyFields ? (
                                    <div className="space-y-2">
                                        {Object.entries(stats.emptyFields).map(([field, count]) => (
                                            count > 0 && (
                                                <div key={field} className="flex items-center justify-between">
                                                    <span className="capitalize">{field}</span>
                                                    <Badge variant="destructive">{count} пустых</Badge>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-100 dark:border-green-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
                                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-green-900 dark:text-green-100">Всё отлично!</p>
                                                <p className="text-sm text-green-700 dark:text-green-300">Все обязательные поля заполнены</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Повторяющиеся записи */}
                        <Card className={stats?.hasDuplicates ? "border border-amber-500" : "border border-green-500"}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {stats?.hasDuplicates ? (
                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    ) : (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    )}
                                    <span>Дубликаты записей</span>
                                </CardTitle>
                                <CardDescription>
                                    Поиск полностью идентичных повторяющихся строк
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {stats?.hasDuplicates ? (
                                    <div className={`space-y-2 ${showAllDuplicates ? "" : "max-h-60 overflow-y-auto"}`}>
                                        {(showAllDuplicates ? stats.duplicates : stats.duplicates.slice(0, 10)).map(([key, count]) => (
                                            <div key={key} className="flex items-start justify-between gap-2 text-sm">
                                                <span className="font-mono text-xs break-all min-w-0">{key}</span>
                                                <Badge variant="outline" className="shrink-0">{count}x</Badge>
                                            </div>
                                        ))}
                                        {stats.duplicates.length > 10 && !showAllDuplicates && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-muted-foreground"
                                                onClick={() => setShowAllDuplicates(true)}
                                            >
                                                Показать ещё {stats.duplicates.length - 10}
                                            </Button>
                                        )}
                                        {showAllDuplicates && stats.duplicates.length > 10 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-muted-foreground"
                                                onClick={() => setShowAllDuplicates(false)}
                                            >
                                                Скрыть
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-100 dark:border-green-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
                                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-green-900 dark:text-green-100">Всё отлично!</p>
                                                <p className="text-sm text-green-700 dark:text-green-300">Полных дубликатов не найдено</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                    {/* Детальный список */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                                <span>Полный список записей</span>
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                                    <Select
                                        value={visibilityFilter}
                                        onValueChange={(value: string) => setVisibilityFilter(value as 'all' | 'visible' | 'invisible')}
                                    >
                                        <SelectTrigger className="w-[180px] h-8 text-sm">
                                            <SelectValue placeholder="Все записи" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Все записи</SelectItem>
                                            <SelectItem value="visible">Только видимые</SelectItem>
                                            <SelectItem value="invisible">Только невидимые</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <VirtualizedTable
                                schedule={schedule || []}
                                stats={stats}
                                visibilityFilter={visibilityFilter}
                                sortField={sortField}
                                sortDirection={sortDirection}
                                setSortField={setSortField}
                                setSortDirection={setSortDirection}
                            />
                            {visibilityFilter !== 'all' && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Показано {visibilityFilter === 'invisible' ? stats?.invisibleRecords.length : (stats?.total || 0) - (stats?.invisibleRecords.length || 0)} из {stats?.total} записей
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="session-log">
                    <SessionLog />
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <ChangelogContent />
                </TabsContent>
            </Tabs >

            {/* Плавающая кнопка ИИ Помощника */}
            <div className="fixed bottom-6 right-6 z-50">
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                    >
                        {!isMobile ? (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full shadow-lg bg-background/80 backdrop-blur-md transition-all hover:scale-110 active:scale-95 group border-muted-foreground/20"
                                    >
                                        <Sparkles className="h-[1.2rem] w-[1.2rem] text-primary animate-pulse" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    side="top"
                                    align="end"
                                    className="p-0 w-[400px] border-none bg-transparent shadow-2xl mb-4 mr-0"
                                >
                                    <DebugAIChat stats={stats} />
                                </PopoverContent>
                            </Popover>
                        ) : (
                            <Drawer>
                                <DrawerTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full shadow-lg bg-background/80 backdrop-blur-md transition-all hover:scale-110 active:scale-95 group border-muted-foreground/20"
                                    >
                                        <Sparkles className="h-[1.2rem] w-[1.2rem] text-primary animate-pulse" />
                                    </Button>
                                </DrawerTrigger>
                                <DrawerContent className="h-[85vh] p-0">
                                    <div className="hidden">
                                        <DrawerTitle>ИИ Помощник</DrawerTitle>
                                        <DrawerDescription>Чат с ИИ помощником по расписанию</DrawerDescription>
                                    </div>
                                    <div className="h-full w-full">
                                        <DebugAIChat stats={stats} className="h-full border-none shadow-none rounded-none" />
                                    </div>
                                </DrawerContent>
                            </Drawer>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
