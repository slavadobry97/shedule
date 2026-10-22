"use client";

import { useEffect, useRef, useState } from "react";

const COLOR_TOKENS = [
    { name: "royal-blue", label: "Royal blue" },
    { name: "navy-blue", label: "Navy blue" },
    { name: "ruby", label: "Ruby" },
    { name: "canvas", label: "Полотно" },
    { name: "background", label: "Фон" },
    { name: "foreground", label: "Текст" },
    { name: "card", label: "Карточка" },
    { name: "popover", label: "Поповер" },
    { name: "primary", label: "Акцент" },
    { name: "secondary", label: "Вторичный" },
    { name: "muted", label: "Приглушённый" },
    { name: "accent", label: "Акцент-подложка" },
    { name: "destructive", label: "Ошибка" },
    { name: "success", label: "Успех" },
    { name: "warning", label: "Внимание" },
    { name: "info", label: "Информация" },
    { name: "border", label: "Граница" },
    { name: "input", label: "Поле" },
    { name: "ring", label: "Фокус" },
    { name: "brand", label: "Бренд" },
];

function TokenSwatch({ name, label }: { name: string; label: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const [value, setValue] = useState("");
    const [resolved, setResolved] = useState("");

    useEffect(() => {
        const read = () => {
            const raw = getComputedStyle(document.documentElement)
                .getPropertyValue(`--${name}`)
                .trim();
            setValue(raw);
            // Токены-выражения (--canvas) показываем в вычисленном виде
            setResolved(ref.current ? getComputedStyle(ref.current).backgroundColor : "");
        };

        read();
        const observer = new MutationObserver(read);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, [name]);

    const shown = value.includes("(") ? resolved : value;

    return (
        <div className="flex items-center gap-3 border-b border-border/60 py-3 last:border-b-0">
            <span
                ref={ref}
                className="h-9 w-9 shrink-0 rounded-md border border-border/60"
                // Имя токена подставляется в runtime — Tailwind такой класс не
                // генерирует, поэтому цвет задаём инлайном.
                style={{ backgroundColor: `var(--${name})` }}
                aria-hidden="true"
            />
            <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{label}</p>
                <p className="truncate font-mono text-tiny text-muted-foreground">
                    --{name}
                    {shown ? ` · ${shown}` : ""}
                </p>
            </div>
        </div>
    );
}

export function TokenSwatches() {
    return (
        <div className="grid gap-x-10 sm:grid-cols-2">
            {COLOR_TOKENS.map((token) => (
                <TokenSwatch key={token.name} {...token} />
            ))}
        </div>
    );
}
