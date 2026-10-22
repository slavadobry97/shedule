import { ScheduleItem } from "@/types/schedule";

/** Запись расписания с номером строки в таблице деканата */
export interface RowIssue {
    item: ScheduleItem;
    /** Номер строки в приложении (нумерация с 1) */
    index: number;
}

/** Запись, которая не попадёт в календарь, с причинами */
export interface InvisibleRecord extends RowIssue {
    reasons: string[];
}

/** Одна аудитория в одном слоте: разные преподаватели, но та же аудитория */
export interface ClassroomConflict {
    classroom: string;
    date: string;
    time: string;
    teachers: string[];
    subjects: string[];
}

/** Преподаватель в один слот в разных аудиториях */
export interface TeacherDoubleBooking {
    teacher: string;
    date: string;
    time: string;
    rows: {
        group: string;
        classroom: string;
        subject: string;
        index: number;
    }[];
}

/** Свободный слот между занятиями группы */
export interface ScheduleGap {
    group: string;
    date: string;
    gapTime: string;
}

/** Использование аудитории: сколько пар и в какие дни недели */
export interface ClassroomUtilization {
    classroom: string;
    count: number;
    utilizationPercent: number;
    dailyPattern: boolean[];
}

/** Пропущенные значения в полях */
export type EmptyFieldCounts = Record<
    "group" | "date" | "time" | "subject" | "teacher" | "classroom",
    number
>;

/** Ключ проверки: что именно проверяем */
export type CheckId =
    | "invisible"
    | "classroomConflict"
    | "teacherDoubleBooking"
    | "invalidTime"
    | "invalidDate"
    | "invalidDay"
    | "emptyFields"
    | "duplicates";

/**
 * Серьёзность проверки.
 *
 * critical — данные сломаны, студент это увидит (запись не попадёт в календарь
 * или два занятия займут одно место).
 * warning — данные в таблице стоит поправить, но на календарь это не влияет.
 */
export type CheckSeverity = "critical" | "warning";

/** Одна проверка: что проверяем и сколько проблем найдено */
export interface CheckResult {
    id: CheckId;
    severity: CheckSeverity;
    /** Сколько проблем найдено. 0 — всё в порядке */
    count: number;
}

/** Полный разбор расписания: цифры, аналитика и список проверок */
export interface ScheduleAnalysis {
    total: number;
    groups: number;
    teachers: number;
    dates: number;
    subjects: number;
    timeSlots: number;

    emptyFields: EmptyFieldCounts;
    duplicates: [string, number][];

    invalidTimeSlots: RowIssue[];
    invalidDates: RowIssue[];
    invalidDays: RowIssue[];
    invisibleRecords: InvisibleRecord[];

    teacherWorkload: [string, number][];
    gaps: ScheduleGap[];
    totalGaps: number;

    classroomUsage: [string, number][];
    classroomUtilization: ClassroomUtilization[];
    classroomConflicts: ClassroomConflict[];
    teacherDoubleBookings: TeacherDoubleBooking[];

    /** Проверки в порядке «критичное → предупреждение» */
    checks: CheckResult[];
    /** Сколько проверок с critical */
    criticalCount: number;
    /** Сколько проверок с warning */
    warningCount: number;
}
