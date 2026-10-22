"use client";

import Link from "next/link";
import useSWR from "swr";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MOTION_DURATION, motionTransition } from "@/lib/motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { analyzeSchedule } from "@/lib/debug-analysis";
import { API_ENDPOINTS, REFRESH_INTERVAL } from "@/lib/constants";
import { compareScheduleData, LogEntry } from "@/lib/schedule-utils";
import { ScheduleItem } from "@/types/schedule";
import { ScheduleAnalysis } from "@/types/debug";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ScheduleError } from "@/components/schedule-error";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { Island } from "@/components/debug/debug-island";
import { DebugChecks, ChecksSummary } from "@/components/debug/debug-checks";
import { DebugOverview } from "@/components/debug/debug-overview";
import { SessionLog } from "@/components/debug/session-log";
import { ChangelogContent } from "@/components/debug/changelog-content";
import {
    SortField,
    VisibilityFilter,
    VirtualizedTable,
} from "@/components/debug/records-table";
import { DebugAIChat, type DebugTab } from "@/components/debug/ai-chat";
import {
    HistoryIcon,
    LayoutDashboardIcon,
    LoadingIcon,
    PaintBoardIcon,
    RefreshIcon,
    ShieldCheckIcon,
    SlidersHorizontalIcon,
    SparklesIcon,
    TableIcon,
    TrashIcon,
} from "@/components/icons";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Служебный раздел: проверка данных расписания.
 *
 * Устройство страницы:
 * - «Проверки» — что сломано. Единый список, критичные сверху.
 * - «Обзор» — цифры и аналитика: нагрузка, окна, аудитории.
 * - «Записи» — сырые строки таблицы.
 * - «Журнал» — что менялось за сессию.
 * - «История» — что нового в приложении.
 */
export default function DebugClient() {
    const reduceMotion = useReducedMotion();
    const { data: schedule, error, isLoading, mutate } = useSWR<ScheduleItem[]>(
        API_ENDPOINTS.SCHEDULE,
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

                if (typeof window !== "undefined") {
                    try {
                        const hasAnyChanges =
                            changes.added.length > 0 ||
                            changes.removed.length > 0 ||
                            changes.modified.length > 0;
                        if (hasAnyChanges) {
                            const logEntry: LogEntry = {
                                timestamp: Date.now(),
                                changes: changes,
                            };
                            const existingLog = sessionStorage.getItem("schedule_changes_log");
                            const log = existingLog ? JSON.parse(existingLog) : [];
                            log.unshift(logEntry); // Новые сверху
                            if (log.length > 50) log.length = 50; // Храним последние 50 записей
                            sessionStorage.setItem("schedule_changes_log", JSON.stringify(log));
                        }
                    } catch (e) {
                        console.error("Failed to log schedule changes in debug", e);
                    }
                }

                previousDataRef.current = [...schedule];
            }
        }
    }, [schedule]);

    // Фильтр и сортировка таблицы
    const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // Состояние обновления
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Панель ИИ: на десктопе — Sheet справа, на мобильном — Drawer снизу.
    // Открытость общая, чтобы кнопка закрытия работала в обоих вариантах.
    const [chatOpen, setChatOpen] = useState(false);

    // Активная вкладка нужна ИИ-помощнику: по ней строятся подсказки
    // и строка «Смотрю: …» в шапке.
    const [activeTab, setActiveTab] = useState<DebugTab>("checks");

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

    // Весь разбор данных: цифры, аналитика и список проверок
    const analysis: ScheduleAnalysis | null = useMemo(
        () => (schedule ? analyzeSchedule(schedule) : null),
        [schedule]
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Spinner className="h-5 w-5 text-muted-foreground" />
                <p className="font-mono text-tiny uppercase tracking-[0.2em] text-muted-foreground">
                    Загрузка данных
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4 sm:p-8">
                <ScheduleError error={error} onRetry={handleRefresh} />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8">
            <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 font-mono text-tiny uppercase tracking-[0.2em] text-muted-foreground">
                        Служебный раздел
                        <Badge variant="outline" className="h-4 rounded-sm px-1 font-mono text-xxs">
                            Debug
                        </Badge>
                    </div>
                    <h1 className="mt-2 font-evolventa text-2xl font-bold tracking-[-0.015em] sm:text-3xl">
                        Проверка данных расписания
                    </h1>
                </div>
                <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    disabled={isRefreshing}
                    className="w-full gap-2 sm:w-auto"
                >
                    {isRefreshing ? (
                        <LoadingIcon className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshIcon className="h-4 w-4" />
                    )}
                    {isRefreshing ? "Обновление…" : "Обновить"}
                </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                    Проверяются сырые данные таблицы деканата и результат
                    преобразования в календарь.
                </p>
                <Button asChild variant="ghost" size="sm" className="shrink-0 gap-2">
                    <Link href="/design">
                        <PaintBoardIcon className="h-4 w-4" />
                        Дизайн-система
                    </Link>
                </Button>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as DebugTab)}
                className="space-y-6"
            >
                <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg border border-border/60 bg-accent p-1 shadow-xs">
                    <TabsTrigger value="checks" className="flex items-center gap-1.5 whitespace-nowrap">
                        <ShieldCheckIcon className="h-3.5 w-3.5" />
                        Проверки
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="flex items-center gap-1.5 whitespace-nowrap">
                        <LayoutDashboardIcon className="h-3.5 w-3.5" />
                        Обзор
                    </TabsTrigger>
                    <TabsTrigger value="records" className="flex items-center gap-1.5 whitespace-nowrap">
                        <TableIcon className="h-3.5 w-3.5" />
                        Записи
                    </TabsTrigger>
                    <TabsTrigger value="journal" className="flex items-center gap-1.5 whitespace-nowrap">
                        <TrashIcon className="h-3.5 w-3.5" />
                        Журнал
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-1.5 whitespace-nowrap">
                        <HistoryIcon className="h-3.5 w-3.5" />
                        История
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="checks" className="space-y-6">
                    {analysis && (
                        <>
                            <ChecksSummary analysis={analysis} />
                            <Island>
                                <DebugChecks
                                    analysis={analysis}
                                    showAllInvisible={showAllInvisible}
                                    onToggleAllInvisible={() => setShowAllInvisible(!showAllInvisible)}
                                    showAllDuplicates={showAllDuplicates}
                                    onToggleAllDuplicates={() => setShowAllDuplicates(!showAllDuplicates)}
                                />
                            </Island>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="overview" className="space-y-6">
                    {analysis && <DebugOverview analysis={analysis} />}
                </TabsContent>

                <TabsContent value="records" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                                <span>Полный список записей</span>
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontalIcon className="h-4 w-4 text-muted-foreground" />
                                    <Select
                                        value={visibilityFilter}
                                        onValueChange={(value: string) =>
                                            setVisibilityFilter(value as VisibilityFilter)
                                        }
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
                                invisibleRecords={analysis?.invisibleRecords ?? []}
                                visibilityFilter={visibilityFilter}
                                sortField={sortField}
                                sortDirection={sortDirection}
                                setSortField={setSortField}
                                setSortDirection={setSortDirection}
                            />
                            {visibilityFilter !== "all" && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Показано{" "}
                                    {visibilityFilter === "invisible"
                                        ? (analysis?.invisibleRecords.length ?? 0)
                                        : (analysis?.total ?? 0) - (analysis?.invisibleRecords.length ?? 0)}{" "}
                                    из {analysis?.total ?? 0} записей
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="journal">
                    <SessionLog />
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <ChangelogContent />
                </TabsContent>
            </Tabs>

            {/* Плавающая кнопка ИИ Помощника */}
            <div className="fixed bottom-6 right-6 z-50">
                {/* Постоянная кнопка: вход на первом рендере не нужен */}
                <AnimatePresence initial={false}>
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={motionTransition(reduceMotion, { duration: MOTION_DURATION.base })}
                        className="relative"
                    >
                        {!isMobile ? (
                            <Sheet open={chatOpen} onOpenChange={setChatOpen} modal={false}>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        aria-label="Открыть ИИ-помощника"
                                        title="ИИ-помощник"
                                        className="rounded-full shadow-lg bg-canvas supports-[backdrop-filter]:bg-canvas/80 backdrop-blur-[20px] backdrop-saturate-180 transition-[color,background-color,box-shadow,transform] hover:scale-110 active:scale-[0.96] group border-muted-foreground/20"
                                    >
                                        <SparklesIcon className="h-[1.2rem] w-[1.2rem] text-primary animate-pulse" />
                                    </Button>
                                </SheetTrigger>
                                {/* Оверлея нет: таблицу на странице надо читать и
                                    выделять, пока чат открыт. modal={false} у Sheet
                                    снимает блокировку кликов и скролла. */}
                                {/* Клик по странице не должен закрывать панель:
                                    её смысл — работать с таблицей, не теряя чат. */}
                                <SheetContent
                                    side="right"
                                    hideOverlay
                                    hideClose
                                    onPointerDownOutside={(event) => event.preventDefault()}
                                    onInteractOutside={(event) => event.preventDefault()}
                                    className="w-full gap-0 border-l border-primary/10 bg-canvas p-0 shadow-2xl sm:w-[min(560px,45vw)] sm:max-w-none data-[state=open]:duration-300 data-[state=closed]:duration-300 [animation-timing-function:cubic-bezier(0.22,1,0.36,1)]"
                                >
                                    <SheetTitle className="sr-only">ИИ-помощник</SheetTitle>
                                    <DebugAIChat
                                        stats={analysis}
                                        activeTab={activeTab}
                                        className="h-full rounded-none border-0 shadow-none"
                                        onClose={() => setChatOpen(false)}
                                    />
                                </SheetContent>
                            </Sheet>
                        ) : (
                            <Drawer open={chatOpen} onOpenChange={setChatOpen}>
                                <DrawerTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        aria-label="Открыть ИИ-помощника"
                                        title="ИИ-помощник"
                                        className="rounded-full shadow-lg bg-canvas supports-[backdrop-filter]:bg-canvas/80 backdrop-blur-[20px] backdrop-saturate-180 transition-[color,background-color,box-shadow,transform] hover:scale-110 active:scale-[0.96] group border-muted-foreground/20"
                                    >
                                        <SparklesIcon className="h-[1.2rem] w-[1.2rem] text-primary animate-pulse" />
                                    </Button>
                                </DrawerTrigger>
                                <DrawerContent className="h-[85vh] p-0">
                                    <div className="hidden">
                                        <DrawerTitle>ИИ-помощник</DrawerTitle>
                                        <DrawerDescription>
                                            Вопросы по данным расписания
                                        </DrawerDescription>
                                    </div>
                                    <div className="h-full w-full">
                                        <DebugAIChat
                                            stats={analysis}
                                            activeTab={activeTab}
                                            className="h-full border-none shadow-none rounded-none"
                                            onClose={() => setChatOpen(false)}
                                        />
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
