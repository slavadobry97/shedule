"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "cn";
import { APP_INFO } from "@/lib/constants";
import type { DebugTab } from "@/components/debug/ai-chat";
import {
    AnalyticsIcon,
    CalendarIcon,
    Grid2x2Icon,
    HistoryIcon,
    InfoIcon,
    LayoutDashboardIcon,
    PaintBoardIcon,
    ShieldCheckIcon,
    SparklesIcon,
    TableIcon,
    TrashIcon,
    type IconComponent,
} from "@/components/icons";
import { IconLogo } from "@/components/logo/icon-logo";
import { SECTION_META } from "@/components/dashboard/section-meta";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";

type NavItemData = {
    title: string;
    href: string;
    icon: IconComponent;
    /**
     * Для пунктов-вкладок /dashboard: с каким ?tab= связан пункт.
     * Активность сверяется с адресом, а не с pathname.
     */
    tab?: DebugTab;
};

const MAIN_ITEMS: NavItemData[] = [
    { title: "Расписание", href: "/", icon: CalendarIcon },
    { title: "О сервисе", href: "/landing", icon: InfoIcon },
];

/**
 * Вкладки служебной зоны. «Сводка» — чистый /dashboard без параметра,
 * остальные — глубокие ссылки ?tab=…: навигация живёт в адресе, поэтому
 * работает и «назад», и шаринг ссылок. Названия — из общего реестра
 * section-meta: сайдбар и заголовки разделов не могут разойтись.
 */
const DASHBOARD_TABS: NavItemData[] = (
    [
        ["summary", "summary", LayoutDashboardIcon],
        ["checks", "checks", ShieldCheckIcon],
        ["overview", "overview", AnalyticsIcon],
        ["records", "records", TableIcon],
        ["table", "table", Grid2x2Icon],
        ["journal", "journal", TrashIcon],
        ["history", "history", HistoryIcon],
        ["chat", "chat", SparklesIcon],
        ["design", "design", PaintBoardIcon],
    ] as const
).map(([tab, param, icon]) => ({
    title: SECTION_META[tab].title,
    href: param === "summary" ? "/dashboard" : `/dashboard?tab=${param}`,
    icon,
    tab,
}));

function NavItem({ item }: { item: NavItemData }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isMobile } = useSidebar();

    // Вкладки /dashboard активны по ?tab=, остальные — по pathname.
    // «Сводка» активна и когда параметра нет вовсе (чистый /dashboard).
    const currentTab: DebugTab | null =
        pathname === "/dashboard" && item.tab
            ? (searchParams.get("tab") as DebugTab | null) ?? "summary"
            : null;
    const isActive = item.tab ? currentTab === item.tab : pathname === item.href;

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.title}
                className={cn(
                    "h-10 rounded-2xl px-3 [&_svg]:size-[18px]",
                    // Цель касания на мобильном — от 44px
                    isMobile && "h-11"
                )}
            >
                <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

/**
 * Левое меню: публичные разделы сверху, вкладки состояния расписания ниже.
 * Десктоп: сворачивается в рейку с иконками (клик по краю-рельсе или
 * Ctrl/Cmd+B). Мобильный: выезжает слева по гамбургеру из шапки оболочки.
 */
export function DashboardSidebar() {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="p-3 pb-1 group-data-[collapsible=icon]:p-2">
                <Link
                    href="/"
                    className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-sidebar-accent/60 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                    aria-label={APP_INFO.TITLE}
                >
                    <IconLogo className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" />
                    <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-semibold">{APP_INFO.TITLE}</span>
                        <span className="text-tiny text-muted-foreground">{APP_INFO.SUBTITLE}</span>
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-3 pb-1 group-data-[collapsible=icon]:px-2">
                <SidebarGroup className="px-0 py-1">
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {MAIN_ITEMS.map((item) => (
                                <NavItem key={item.href} item={item} />
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="px-0 py-2">
                    <SidebarGroupLabel className="px-3 text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground group-data-[collapsible=icon]:sr-only">
                        Состояние расписания
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {DASHBOARD_TABS.map((item) => (
                                <NavItem key={item.title} item={item} />
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    );
}
