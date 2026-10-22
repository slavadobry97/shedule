"use client";

import useSWR from "swr";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { NotificationSettings } from "@/components/NotificationSettings";
import { API_ENDPOINTS } from "@/lib/constants";
import { metaFetcher } from "@/lib/api";
import { ScheduleMeta } from "@/types/schedule";

const fetcher = metaFetcher;

export function HeaderActions() {
    // Списки групп и преподавателей приходят отдельной лёгкой ручкой:
    // тянуть ради них всё расписание (3,9 МБ) незачем.
    const { data: meta } = useSWR<ScheduleMeta>(API_ENDPOINTS.SCHEDULE_META, fetcher, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false
    });

    const uniqueGroups = meta?.groups ?? [];
    const uniqueTeachers = meta?.teachers ?? [];

    return (
        <div className="flex items-center gap-1">
            <NotificationSettings
                groups={uniqueGroups}
                teachers={uniqueTeachers}
            />
            <ThemeSwitcher />
        </div>
    );
}
