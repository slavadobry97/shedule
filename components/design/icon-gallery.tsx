"use client";

import { useMemo, useState } from "react";
import * as Icons from "@/components/icons";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "@/components/icons";

type IconEntry = { name: string; Component: (props: { className?: string }) => React.JSX.Element };

export function IconGallery() {
    const [query, setQuery] = useState("");

    const icons = useMemo<IconEntry[]>(() => {
        return Object.entries(Icons)
            .filter(
                ([name, value]) =>
                    name !== "IconComponent" && typeof value === "function"
            )
            .map(([name, Component]) => ({
                name,
                Component: Component as IconEntry["Component"],
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return icons;
        return icons.filter((icon) => icon.name.toLowerCase().includes(q));
    }, [icons, query]);

    return (
        <div>
            <div className="relative max-w-sm">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Найти иконку…"
                    className="pl-9"
                    aria-label="Поиск по иконкам"
                />
            </div>

            <p className="mt-4 font-mono text-tiny text-muted-foreground">
                {filtered.length} из {icons.length}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {filtered.map((icon) => (
                    <div
                        key={icon.name}
                        className="flex flex-col items-center gap-2 rounded-md border border-border/60 bg-card p-3"
                    >
                        <icon.Component className="h-6 w-6" />
                        <span className="w-full truncate text-center font-mono text-xxs text-muted-foreground">
                            {icon.name}
                        </span>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <p className="mt-6 text-sm text-muted-foreground">Ничего не найдено.</p>
            )}
        </div>
    );
}
