"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, Location01Icon } from "@/components/icons";
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
        if (percent < 10) return "bg-destructive/10 dark:bg-destructive/40 text-destructive dark:text-destructive border-destructive/30 dark:border-destructive/40";
        if (percent < 25) return "bg-warning/10 dark:bg-warning/40 text-warning dark:text-warning border-warning/30 dark:border-warning/40";
        return "bg-success/10 dark:bg-success/40 text-success dark:text-success border-success/30 dark:border-success/40";
    };

    const getHoverColor = (percent: number) => {
        if (percent < 10) return "hover:bg-destructive/20 dark:hover:bg-destructive/60";
        if (percent < 25) return "hover:bg-warning/20 dark:hover:bg-warning/60";
        return "hover:bg-success/20 dark:hover:bg-success/60";
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Location01Icon className="h-4 w-4" />
                    Загруженность аудиторий (Heatmap)
                </h4>
                <p className="text-xs text-muted-foreground">
                    Наведите на ячейку для деталей. <span className="text-destructive">Красный</span> &lt; 10%, <span className="text-warning">Желтый</span> 10-25%, <span className="text-success">Зеленый</span> &gt; 25%.
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
                                    <span className="text-xxs opacity-80">{item.utilizationPercent.toFixed(0)}%</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="p-4 max-w-[220px] bg-card dark:bg-muted/95 text-foreground dark:text-muted-foreground shadow-xl border border-border dark:border-border">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="font-bold text-base">Ауд. {item.classroom}</span>
                                        <Badge variant="secondary" className="text-xs h-6 px-2">
                                            {item.count} {getDeclension(item.count, ['пара', 'пары', 'пар'])}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xxs text-muted-foreground uppercase tracking-wider font-semibold">Активность по дням</p>
                                        <div className="flex justify-between gap-1">
                                            {item.dailyPattern.map((isActive, idx) => (
                                                <div key={idx} className="flex flex-col items-center gap-1">
                                                    <div
                                                        className={`w-5 h-8 rounded-sm border transition-colors ${isActive ? 'bg-primary border-primary' : 'bg-muted/50 border-border'}`}
                                                        title={DAYS[idx]}
                                                    />
                                                    <span className="text-xxs text-muted-foreground font-medium">{DAYS[idx]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Загрузка:</span>
                                        <span className={`font-bold text-sm ${item.utilizationPercent < 10 ? 'text-destructive' :
                                            item.utilizationPercent < 25 ? 'text-warning' : 'text-success'
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
