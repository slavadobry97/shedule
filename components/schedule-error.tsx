"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircleIcon, RefreshIcon, WifiOffIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/lib/constants";
import { ApiError } from "@/lib/api";
import { cn } from "cn";
import { MOTION_DURATION, motionTransition } from "@/lib/motion";

interface ScheduleErrorProps {
    error: unknown;
    onRetry: () => void;
    isRetrying?: boolean;
}

export function ScheduleError({ error, onRetry, isRetrying = false }: ScheduleErrorProps) {
    const reduceMotion = useReducedMotion();
    const [online, setOnline] = useState(true);
    const [attemptedAt, setAttemptedAt] = useState<Date | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        setOnline(navigator.onLine);

        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    useEffect(() => {
        setAttemptedAt(new Date());
    }, [error]);

    const status = error instanceof ApiError ? error.status : undefined;
    const message = error instanceof Error ? error.message : String(error ?? "");

    const { title, description } = useMemo(() => {
        if (!online) {
            return {
                title: "Нет с оединения с  с етью",
                description:
                    "Проверьте подключение к  интернету. Как только с вязь в осстановится, расписание подгрузится автоматически.",
            };
        }

        if (status === 404) {
            return {
                title: "Расписание не опубликовано",
                description:
                    "Данные за текущий период ещё не загружены деканатом. Попробуйте заглянуть позже.",
            };
        }

        if (status && status >= 500) {
            return {
                title: "Сервер расписания недоступен",
                description:
                    "Не у далось получить данные с  с ервера. Повторная попытка о бычно занимает несколько с екунд.",
            };
        }

        return {
            title: "Не удалось загрузить расписание",
            description:
                "Что-то пошло не так при получении данных. Попробуйте ещё раз — данные загрузятся целиком.",
        };
    }, [online, status]);

    const time = attemptedAt
        ? attemptedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "—";

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas p-4">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 opacity-50 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-sibg-size-[64px_64px]adial-gradient(ellipse_60%_55%_at_50%_45%,black,transparent_78%)]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(55%_45%_at_50%_0%,color-mix(in_oklab,var(--destructive)_7%,transparent),transparent_70%)]"
            />

            <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={motionTransition(reduceMotion, { duration: MOTION_DURATION.slow })}
                className="w-full max-w-lg"
            >
                <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-[0_1px_2px_hsl(222_47%_11%/0.05)] sm:p-8">
                    <div className="flex items-start gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-3xl border border-destructive/25 bg-destructive/10">
                            {online ? (
                                <AlertCircleIcon className="h-5 w-5 text-destructive" />
                            ) : (
                                <WifiOffIcon className="h-5 w-5 text-destructive" />
                            )}
                        </span>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xxs uppercase tracking-[0.2em] text-muted-foreground">
                                    Системная ошибка
                                </span>
                                {status !== undefined && (
                                    <span className="rounded-2xl border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 font-mono text-xxs leading-none text-destructive">
                                        HTTP {status}
                                    </span>
                                )}
                            </div>

                            <h1 className="mt-2 font-evolventa text-xl font-bold leading-tight tracking-[-0.01em] sm:text-2xl">
                                {title}
                            </h1>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-3xl border border-border/60 bg-muted/30 px-3 py-2 font-mono text-tiny text-muted-foreground">
                        <span className="text-foreground/80">GET {API_ENDPOINTS.SCHEDULE}</span>
                        <span className="ml-auto">
                            {status !== undefined ? (
                                <span className="text-destructive">HTTP {status}</span>
                            ) : (
                                "нет ответа"
                            )}
                        </span>
                        <span className="tabular-nums">{time}</span>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
                        <Button onClick={onRetry} disabled={isRetrying} className="gap-2">
                            <RefreshIcon className={cn("h-4 w-4", isRetrying && "animate-spin")} />
                            {isRetrying ? "Повторяем…" : "Попробовать снова"}
                        </Button>

                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowDetails((value) => !value)}
                            aria-expanded={showDetails}
                            className="h-auto p-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                            {showDetails ? "Скрыть детали" : "Показать детали"}
                        </Button>
                    </div>

                    {showDetails && (
                        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-3xl border border-border/60 bg-muted/40 p-3 font-mono text-tiny leading-relaxed text-muted-foreground">
                            {message || "Без деталей"}
                        </pre>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
