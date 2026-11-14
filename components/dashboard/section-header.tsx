import { SECTION_META } from "@/components/dashboard/section-meta";
import type { DebugTab } from "@/components/debug/ai-chat";

interface SectionHeaderProps {
    /** Раздел: название и описание берутся из общего реестра (section-meta). */
    tab: DebugTab;
    /** Кнопки и контролы справа («Обновить», фильтры и т.п.). */
    actions?: React.ReactNode;
}

/**
 * Единая шапка раздела служебной зоны: название + описание из реестра,
 * действия справа. Паттерн PageHeader из journal-rgsu на типографике
 * проекта (Evolventa в заголовках).
 */
export function SectionHeader({ tab, actions }: SectionHeaderProps) {
    const meta = SECTION_META[tab];

    return (
        <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
                <h1 className="font-evolventa text-2xl font-bold tracking-[-0.015em]">
                    {meta.title}
                </h1>
                <p className="text-sm text-muted-foreground">{meta.description}</p>
            </div>
            {actions && (
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
                    {actions}
                </div>
            )}
        </div>
    );
}
