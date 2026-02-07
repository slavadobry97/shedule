"use client";

import useSWR from "swr";
import { useMemo } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { NotificationSettings } from "@/components/NotificationSettings";
import { API_ENDPOINTS } from "@/lib/constants";
import { ScheduleItem } from "@/types/schedule";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function HeaderActions() {
    // Используем SWR с тем же ключом, что и в основном компоненте, 
    // чтобы использовать общий кэш и не дублировать запросы
    const { data: scheduleData } = useSWR<ScheduleItem[]>(API_ENDPOINTS.SCHEDULE, fetcher, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false
    });

    const { uniqueGroups, uniqueTeachers } = useMemo(() => {
        const groups = new Set<string>();
        const teachers = new Set<string>();
        const data = Array.isArray(scheduleData) ? scheduleData : [];

        data.forEach(item => {
            if (item.group) groups.add(item.group);
            if (item.teacher) teachers.add(item.teacher);
        });

        return {
            uniqueGroups: Array.from(groups).sort(),
            uniqueTeachers: Array.from(teachers).sort()
        };
    }, [scheduleData]);

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
