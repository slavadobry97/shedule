"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { MapPin, Info } from "lucide-react";
import { getDeclension } from "@/lib/utils";



interface ClassroomData {
    classroom: string;
    count: number;
    utilizationPercent: number;
    dailyPattern: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat]
}

interface ClassroomHeatmapProps {
    data: ClassroomData[];
}

export function ClassroomHeatmap({ data }: ClassroomHeatmapProps) {
    const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

    // Helper to determine color based on utilization
    const getColor = (percent: number) => {
        if (percent < 10) return "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
        if (percent < 25) return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
        return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
    };

    const getHoverColor = (percent: number) => {
        if (percent < 10) return "hover:bg-red-200 dark:hover:bg-red-900/60";
        if (percent < 25) return "hover:bg-amber-200 dark:hover:bg-amber-900/60";
        return "hover:bg-green-200 dark:hover:bg-green-900/60";
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Загруженность аудиторий (Heatmap)
                </h4>
                <p className="text-xs text-muted-foreground">
                    Наведите на ячейку для деталей. <span className="text-red-500">Красный</span> &lt; 10%, <span className="text-amber-500">Желтый</span> 10-25%, <span className="text-green-500">Зеленый</span> &gt; 25%.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                <TooltipProvider delayDuration={100}>
                    {data.map((item) => (
                        <Tooltip key={item.classroom}>
                            <TooltipTrigger asChild>
                                <div
                                    className={`
                    w-16 h-16 rounded-md border flex flex-col items-center justify-center cursor-pointer transition-colors
                    ${getColor(item.utilizationPercent)}
                    ${getHoverColor(item.utilizationPercent)}
                  `}
                                >
                                    <span className="font-bold text-sm">{item.classroom}</span>
                                    <span className="text-[10px] opacity-80">{item.utilizationPercent.toFixed(0)}%</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="p-4 max-w-[220px] bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-xl border border-zinc-200 dark:border-zinc-800">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="font-bold text-base">Ауд. {item.classroom}</span>
                                        <Badge variant="secondary" className="text-xs h-6 px-2">
                                            {item.count} {getDeclension(item.count, ['пара', 'пары', 'пар'])}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Активность по дням</p>
                                        <div className="flex justify-between gap-1">
                                            {item.dailyPattern.map((isActive, idx) => (
                                                <div key={idx} className="flex flex-col items-center gap-1">
                                                    <div
                                                        className={`w-5 h-8 rounded-sm border transition-colors ${isActive ? 'bg-primary border-primary' : 'bg-muted/50 border-border'}`}
                                                        title={DAYS[idx]}
                                                    />
                                                    <span className="text-[9px] text-muted-foreground font-medium">{DAYS[idx]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Загрузка:</span>
                                        <span className={`font-bold text-sm ${item.utilizationPercent < 10 ? 'text-red-600' :
                                            item.utilizationPercent < 25 ? 'text-amber-600' : 'text-green-600'
                                            }`}>
                                            {item.utilizationPercent.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>
        </div>
    );
}
