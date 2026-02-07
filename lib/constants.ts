import { ScheduleItem } from "@/types/schedule";

// --- Data Constants ---

export const DAYS_DATA = [
    { id: "monday", label: "Пн", full: "понедельник", order: 1 },
    { id: "tuesday", label: "Вт", full: "вторник", order: 2 },
    { id: "wednesday", label: "Ср", full: "среда", order: 3 },
    { id: "thursday", label: "Чт", full: "четверг", order: 4 },
    { id: "friday", label: "Пт", full: "пятница", order: 5 },
    { id: "saturday", label: "Сб", full: "суббота", order: 6 },
    { id: "sunday", label: "Вс", full: "воскресенье", order: 7 },
] as const;

export const DAYS_OF_WEEK = DAYS_DATA.slice(0, 6).map(d => ({ id: d.id, label: d.label }));

export const DAYS_ORDER: Record<string, number> = DAYS_DATA.reduce((acc, day) => {
    acc[day.label.toLowerCase()] = day.order;
    acc[day.full.toLowerCase()] = day.order;
    return acc;
}, {} as Record<string, number>);

export const TIME_SLOTS = [
    "08.30 - 10.00",
    "10.10 - 11.40",
    "12.10 - 13.40",
    "13.50 - 15.20",
    "15.30 - 17.00",
    "17.10 - 18.40",
    "18.50 - 20.20",
    "20.30 - 22.00",
];

// --- UI Configuration ---

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 25;

export const TABLE_COLUMNS: { key: keyof ScheduleItem; label: string; className?: string }[] = [
    { key: "group", label: "Группа", className: "w-40" },
    { key: "dayOfWeek", label: "День недели" },
    { key: "date", label: "Дата" },
    { key: "time", label: "Время", className: "w-28" },
    { key: "subject", label: "Дисциплина" },
    { key: "lessonType", label: "Вид занятия" },
    { key: "teacher", label: "Преподаватель" },
    { key: "classroom", label: "Аудитория" },
];

export const BREAKPOINTS = {
    SM: 640,
} as const;

export const DATE_FORMATS = {
    FULL: "dd.MM.yyyy",
    SHORT: "dd.MM",
} as const;

// --- Application Config ---

export const STORAGE_KEYS = {
    SELECTED_GROUP: "selectedGroup",
    SELECTED_TEACHER: "selectedTeacher",
} as const;

export const API_ENDPOINTS = {
    SCHEDULE: "/api/schedule/",
    CALENDAR: "/api/calendar/",
} as const;

export const REFRESH_INTERVAL = 60000;
