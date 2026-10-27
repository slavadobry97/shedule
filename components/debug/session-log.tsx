"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HistoryIcon, TrashIcon } from "@/components/icons";
import { LogEntry } from "@/lib/schedule-utils";

/** Что изменилось в расписании за текущую сессию */
export function SessionLog() {
    const [log, setLog] = useState<LogEntry[]>([]);

    // sessionStorage не шлёт события внутри вкладки, поэтому читаем при монтировании
    useEffect(() => {
        const loadLog = () => {
            if (typeof window !== "undefined") {
                try {
                    const stored = sessionStorage.getItem("schedule_changes_log");
                    if (stored) {
                        setLog(JSON.parse(stored));
                    }
                } catch (e) {
                    console.error("Failed to parse log", e);
                }
            }
        };
        loadLog();
    }, []);

    const handleClear = () => {
        sessionStorage.removeItem("schedule_changes_log");
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
                    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border-2 border-dashed rounded-3xl">
                        <HistoryIcon className="h-8 w-8 mb-2 opacity-50" />
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
                    <TrashIcon className="h-4 w-4" />
                    Очистить
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {log.map((entry, idx) => (
                    <div key={idx} className="border rounded-3xl p-4 space-y-3">
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
                                    <span className="font-semibold text-success">
                                        Добавлено: {entry.changes.added.length}
                                    </span>
                                    <ul className="list-disc list-inside text-muted-foreground mt-1 text-xs pl-2">
                                        {entry.changes.added.map((item, i) => (
                                            <li key={i}>
                                                {item.subject} ({item.group}, {item.time})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {entry.changes.modified.length > 0 && (
                                <div className="text-sm">
                                    <span className="font-semibold text-warning">
                                        Изменено: {entry.changes.modified.length}
                                    </span>
                                    <div className="grid gap-2 mt-2">
                                        {entry.changes.modified.map(({ old, new: cur }, i) => {
                                            const changes: {
                                                field: string;
                                                from: string;
                                                to: string;
                                            }[] = [];
                                            if (old.subject !== cur.subject)
                                                changes.push({
                                                    field: "Дисциплина",
                                                    from: old.subject,
                                                    to: cur.subject,
                                                });
                                            if (old.teacher !== cur.teacher)
                                                changes.push({
                                                    field: "Преподаватель",
                                                    from: old.teacher || "-",
                                                    to: cur.teacher || "-",
                                                });
                                            if (old.classroom !== cur.classroom)
                                                changes.push({
                                                    field: "Аудитория",
                                                    from: old.classroom || "-",
                                                    to: cur.classroom || "-",
                                                });
                                            if (old.lessonType !== cur.lessonType)
                                                changes.push({
                                                    field: "Тип",
                                                    from: old.lessonType || "-",
                                                    to: cur.lessonType || "-",
                                                });
                                            if (old.time !== cur.time)
                                                changes.push({
                                                    field: "Время",
                                                    from: old.time || "-",
                                                    to: cur.time || "-",
                                                });
                                            if (old.date !== cur.date)
                                                changes.push({
                                                    field: "Дата",
                                                    from: old.date || "-",
                                                    to: cur.date || "-",
                                                });

                                            return (
                                                <div
                                                    key={i}
                                                    className="p-3 rounded-3xl border bg-card text-card-foreground shadow-xs text-sm"
                                                >
                                                    <div className="font-semibold">{cur.subject}</div>
                                                    <div className="text-muted-foreground flex flex-wrap gap-2 mt-1 mb-2 text-xs">
                                                        <Badge variant="outline">{cur.date}</Badge>
                                                        <Badge variant="outline">{cur.time}</Badge>
                                                        <Badge variant="outline">{cur.group}</Badge>
                                                        {cur.teacher && (
                                                            <Badge variant="secondary">{cur.teacher}</Badge>
                                                        )}
                                                    </div>

                                                    {changes.length > 0 ? (
                                                        <div className="space-y-1 bg-muted/50 p-2 rounded-xl text-xs">
                                                            {changes.map((change, idx) => (
                                                                <div key={idx}>
                                                                    <span className="text-muted-foreground">
                                                                        {change.field}:{" "}
                                                                    </span>
                                                                    <span className="line-through text-destructive/70">
                                                                        {change.from}
                                                                    </span>
                                                                    <span className="mx-1">→</span>
                                                                    <span className="text-success dark:text-success font-medium">
                                                                        {change.to}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-muted-foreground italic">
                                                            Нет видимых изменений
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {entry.changes.removed.length > 0 && (
                                <div className="text-sm">
                                    <span className="font-semibold text-destructive">
                                        Удалено: {entry.changes.removed.length}
                                    </span>
                                    <ul className="list-disc list-inside text-muted-foreground mt-1 text-xs pl-2">
                                        {entry.changes.removed.map((item, i) => (
                                            <li key={i}>
                                                {item.subject} ({item.group})
                                            </li>
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
