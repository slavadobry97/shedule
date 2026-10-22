"use client";

import { useState, type ReactNode } from "react";
import { cn } from "cn";
import { ChevronDownIcon } from "@/components/icons";

export type IslandTone = "success" | "warning" | "danger" | "info" | "neutral";

const TILE: Record<IslandTone, string> = {
    success: "border-success/25 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
    info: "border-info/30 bg-info/10 text-info",
    neutral: "border-border bg-muted/50 text-muted-foreground",
};

const ACCENT: Record<IslandTone, string> = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    info: "text-info",
    neutral: "text-muted-foreground",
};

/**
 * «Остров» — скруглённый контейнер, разделённый волосяными линиями.
 * Список проверок, метрик или настроек в одном блоке вместо сетки карточек.
 */
export function Island({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "overflow-hidden rounded-lg border border-border/70 bg-card divide-y divide-border/60",
                className
            )}
        >
            {children}
        </div>
    );
}

interface IslandRowProps {
    icon: ReactNode;
    tone?: IslandTone;
    title: ReactNode;
    description?: ReactNode;
    status?: { label: string; tone?: IslandTone };
    details?: ReactNode;
    defaultOpen?: boolean;
    /** Показывать «Показать/Скрыть» даже без деталей (например, кнопка действия) */
    action?: ReactNode;
}

export function IslandRow({
    icon,
    tone = "neutral",
    title,
    description,
    status,
    details,
    defaultOpen = false,
    action,
}: IslandRowProps) {
    const [open, setOpen] = useState(defaultOpen);
    const hasDetails = !!details;

    return (
        <div className="px-4 py-3.5 sm:px-5">
            <div className="flex items-start gap-3 sm:gap-4">
                <span
                    className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
                        TILE[tone]
                    )}
                >
                    {icon}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <span className="text-sm font-semibold tracking-[-0.01em]">{title}</span>
                        {status && (
                            <span className={cn("font-mono text-xs", ACCENT[status.tone ?? tone])}>
                                {status.label}
                            </span>
                        )}
                    </div>
                    {description && (
                        <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{description}</p>
                    )}
                </div>

                {action}

                {hasDetails && (
                    <button
                        type="button"
                        onClick={() => setOpen((value) => !value)}
                        aria-expanded={open}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/70 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        {open ? "Скрыть" : "Показать"}
                        <ChevronDownIcon
                            className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
                        />
                    </button>
                )}
            </div>

            {hasDetails && open && (
                <div className="mt-3 pl-12 sm:pl-[3.25rem]">{details}</div>
            )}
        </div>
    );
}

/** Строка-метрика: подпись слева, значение справа */
export function IslandMetric({
    icon,
    label,
    value,
    hint,
}: {
    icon: ReactNode;
    label: string;
    value: ReactNode;
    hint?: string;
}) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{label}</p>
                {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </div>
            <span className="shrink-0 font-mono text-lg font-semibold tabular-nums">{value}</span>
        </div>
    );
}
