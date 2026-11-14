"use client";

import type { ReactNode } from "react";

import { HeaderActions } from "@/components/header-actions";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Оболочка страницы состояния расписания: сайдбар с меню слева + узкая
 * шапка контента. Глобальный Header на /dashboard скрыт (components/Header.tsx),
 * иначе шапка дублировалась бы.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <SidebarProvider>
            <DashboardSidebar />
            {/* Полотно как на лендинге: канвас вместо чистого background —
                белые карточки «всплывают» на тонированном фоне */}
            <SidebarInset className="bg-canvas">
                <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-canvas supports-[backdrop-filter]:bg-canvas/80 backdrop-blur-[20px] backdrop-saturate-180 px-4">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <SidebarTrigger className="-ml-1" />
                        <span className="truncate font-evolventa text-base font-bold tracking-[-0.01em]">
                            Состояние расписания
                        </span>
                    </div>
                    <HeaderActions />
                </header>
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
