"use client";

import useSWR from "swr";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    ArrowUpIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    CloseCircleIcon,
    HistoryIcon,
} from "@/components/icons";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/** Что нового в приложении */
export function ChangelogContent() {
    const { data, error, isLoading } = useSWR<{ content: string }>("/api/changelog", fetcher);

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
                    <CloseCircleIcon className="h-4 w-4" />
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
                                <CalendarDaysIcon className="h-5 w-5 text-primary" />
                                <span className="text-lg font-semibold m-0">{children}</span>
                            </div>
                        ),
                        h3: ({ children }) => {
                            const text = String(children);
                            let variant: "default" | "secondary" | "destructive" | "outline" = "default";
                            let icon = <CheckCircleIcon className="h-3 w-3" />;

                            if (text.includes("Добавлено")) {
                                variant = "default";
                                icon = <CheckCircleIcon className="h-3 w-3" />;
                            } else if (text.includes("Улучшено") || text.includes("Обновлено")) {
                                variant = "secondary";
                                icon = <ArrowUpIcon className="h-3 w-3" />;
                            } else if (text.includes("Удалено")) {
                                variant = "destructive";
                                icon = <CloseCircleIcon className="h-3 w-3" />;
                            } else if (text.includes("Исправлено")) {
                                variant = "outline";
                                icon = <CheckCircleIcon className="h-3 w-3" />;
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
                        strong: ({ children }) => (
                            <strong className="font-semibold text-foreground">{children}</strong>
                        ),
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
                    <HistoryIcon className="h-5 w-5" />
                    История изменений
                </CardTitle>
                <CardDescription>Что нового в приложении</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {data?.content && renderChangelog(data.content)}
            </CardContent>
        </Card>
    );
}
