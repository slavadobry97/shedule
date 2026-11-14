"use client";

import { DashboardSummary } from "@/components/dashboard/dashboard-status";
import { DashboardKpi } from "@/components/dashboard/dashboard-kpi";

/**
 * Вариант «Итог» (выбор владельца: «3 с баннером») — порядок вопросов,
 * с которыми открывают операционную панель:
 * «всё ли живо» (сводка) → «какие цифры» (KPI) → «что произошло» (лента).
 * Сборка из компонентов вариантов 2 и 3, поведение моков прежнее.
 */
export function DashboardOps() {
    return (
        <div className="space-y-4">
            <DashboardSummary />
            <DashboardKpi />
        </div>
    );
}
