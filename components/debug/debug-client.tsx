"use client";

import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { analyzeSchedule } from "@/lib/debug-analysis";
import { API_ENDPOINTS, REFRESH_INTERVAL } from "@/lib/constants";
import { compareScheduleData, LogEntry } from "@/lib/schedule-utils";
import { ScheduleItem } from "@/types/schedule";
import { ScheduleAnalysis } from "@/types/debug";
import type { DashboardData } from "@/components/dashboard/dashboard-bento";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScheduleError } from "@/components/schedule-error";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/dashboard/section-header";
import { DesignSystemPage } from "@/components/design/design-system-page";
import { Island } from "@/components/debug/debug-island";
import { DebugChecks, ChecksSummary } from "@/components/debug/debug-checks";
import { DebugOverview } from "@/components/debug/debug-overview";
import { SessionLog } from "@/components/debug/session-log";
import { ChangelogContent } from "@/components/debug/changelog-content";
import VirtualScheduleTable from "@/components/VirtualScheduleTable";
import {
    SortField,
    VisibilityFilter,
    VirtualizedTable,
} from "@/components/debug/records-table";
import { DebugAIChat, type DebugTab } from "@/components/debug/ai-chat";
import {
    LoaderCircleIcon,
    RefreshIcon,
    SlidersHorizontalIcon,
} from "@/components/icons";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/** Допустимые значения ?tab= в адресе страницы. */
const TAB_VALUES: DebugTab[] = [
    "summary",
    "checks",
    "overview",
    "records",
    "table",
    "journal",
    "history",
    "chat",
    "design",
];

/**
 * Служебная зона: разделы страницы /dashboard. Навигация живёт в сайдбаре
 * оболочки (ссылки ?tab=…), здесь — единая шапка раздела (SectionHeader,
 * названия из реестра section-meta) и содержимое активного раздела.
 *
 * Разделы:
 * - «Сводка» — серверные острова состояния (приходят готовой нодой
 *   summaryNode);
 * - «Проверки» — что мешает расписанию показываться правильно;
 * - «Обзор» — цифры: нагрузка, промежутки, аудитории;
 * - «Записи» — каждая строка таблицы деканата, со ссылками в Google Таблицу;
 * - «Рассылка» — собрать расписание по преподавателю/группе и скачать PDF;
 * - «Журнал» — что менялось, пока открыта страница;
 * - «История» — что нового в приложении.
 * - «ИИ-помощник» — чат по данным расписания (на весь раздел).
 * - «Дизайн-система» — витрина токенов и компонентов.
 */
export default function DebugClient({
    summaryNode,
    dashboardData = null,
}: {
    summaryNode?: ReactNode;
    /** Данные Сводки — уходят в ИИ-помощника для ответов о свежести */
    dashboardData?: DashboardData | null;
}) {
    const { data: schedule, error, isLoading, mutate } = useSWR<ScheduleItem[]>(
        API_ENDPOINTS.SCHEDULE,
        fetcher,
        {
            refreshInterval: REFRESH_INTERVAL, // Обновляем данные автоматически
        }
    );

    const [showAllDuplicates, setShowAllDuplicates] = useState(false);
    const [showAllInvisible, setShowAllInvisible] = useState(false);

    // Отслеживание изменений расписания (аналогично DynamicSchedule):
    // записываем в sessionStorage, читает раздел «Журнал».
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

    // Фильтр и сортировка таблицы записей
    const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // Состояние обновления
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Активный раздел читается из адреса (?tab=…): навигация — сайдбар и
    // ссылки, поэтому адрес — единственный источник правды. «Сводка» —
    // чистый /dashboard без параметра.
    const searchParams = useSearchParams();
    const rawTab = searchParams.get("tab") as DebugTab | null;
    const activeTab: DebugTab =
        rawTab && TAB_VALUES.includes(rawTab) && (rawTab !== "summary" || summaryNode)
            ? rawTab
            : "summary";

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

    if (error) {
        return <ScheduleError error={error} onRetry={handleRefresh} />;
    }

    const refreshButton = (
        <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="gap-2"
        >
            {isRefreshing ? (
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
            ) : (
                <RefreshIcon className="h-4 w-4" />
            )}
            {isRefreshing ? "Обновление…" : "Обновить"}
        </Button>
    );

    return (
        <div className="space-y-6">
            {/* Раздел выбирается в сайдбаре (ссылки ?tab=…), здесь — единая
                шапка раздела (SectionHeader) и содержимое. Тяжёлые разделы
                не монтируются впустую. */}
            {activeTab === "summary" && summaryNode}

            {activeTab === "checks" && (
                <>
                    <SectionHeader tab="checks" actions={refreshButton} />
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
                </>
            )}

            {activeTab === "overview" && (
                <>
                    <SectionHeader tab="overview" />
                    {analysis && <DebugOverview analysis={analysis} />}
                </>
            )}

            {activeTab === "records" && (
                <>
                    <SectionHeader
                        tab="records"
                        actions={
                            <div className="flex items-center gap-2">
                                <SlidersHorizontalIcon className="h-4 w-4 text-muted-foreground" />
                                <Select
                                    value={visibilityFilter}
                                    onValueChange={(value: string) =>
                                        setVisibilityFilter(value as VisibilityFilter)
                                    }
                                >
                                    <SelectTrigger className="w-[230px] h-8 text-sm">
                                        <SelectValue placeholder="Все записи" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Все записи</SelectItem>
                                        <SelectItem value="visible">Попадают в расписание</SelectItem>
                                        <SelectItem value="invisible">Не попадают в расписание</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        }
                    />
                    <Card>
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
                </>
            )}

            {activeTab === "table" && (
                <>
                    <SectionHeader tab="table" />
                    {/* Таблица рассылки: самодостаточный компонент, сам тянет
                        полный массив через SWR и монтируется лениво. */}
                    <VirtualScheduleTable isLoading={isLoading} />
                </>
            )}

            {activeTab === "journal" && (
                <>
                    <SectionHeader tab="journal" />
                    <SessionLog />
                </>
            )}

            {activeTab === "history" && (
                <>
                    <SectionHeader tab="history" />
                    <ChangelogContent />
                </>
            )}

            {activeTab === "chat" && (
                <div className="flex h-[calc(100dvh-6.5rem)] min-h-[460px] flex-col gap-6">
                    <SectionHeader tab="chat" />
                    {/* Колонка раздела занимает ровно высоту вьюпорта: лента —
                        flex-1 и сжимается, композер-остров всегда прижат к низу,
                        страница не скроллится. Ctrl+K фокусирует ввод. */}
                    <DebugAIChat
                        stats={analysis}
                        dashboard={dashboardData}
                        activeTab="chat"
                        className="min-h-0 flex-1"
                    />
                </div>
            )}

            {activeTab === "design" && (
                <>
                    <SectionHeader tab="design" />
                    <DesignSystemPage />
                </>
            )}
        </div>
    );
}
