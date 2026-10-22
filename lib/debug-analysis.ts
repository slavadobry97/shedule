import { parse, isValid } from "date-fns";
import { TIME_SLOTS } from "@/lib/constants";
import { ScheduleItem } from "@/types/schedule";
import {
    CheckResult,
    ClassroomConflict,
    ClassroomUtilization,
    InvisibleRecord,
    RowIssue,
    ScheduleAnalysis,
    ScheduleGap,
    TeacherDoubleBooking,
} from "@/types/debug";

/** Допустимые дни недели в короткой записи */
const VALID_DAYS = ["пн", "вт", "ср", "чт", "пт", "сб"];

const WEEK_DAYS_SHORT = ["пн", "вт", "ср", "чт", "пт", "сб"];

const isValidTime = (time: string): boolean => TIME_SLOTS.includes(time);

const isValidDay = (day: string): boolean => {
    const lower = day.toLowerCase();
    return VALID_DAYS.some((d) => lower.includes(d));
};

const isValidDate = (date: string): boolean => {
    if (!date) return false;
    return isValid(parse(date, "dd.MM.yyyy", new Date()));
};

/**
 * Полный разбор расписания: цифры, аналитика и список проверок.
 *
 * Слоты времени берём из lib/constants — календарь и проверки должны
 * смотреть на один и тот же список, иначе проверка «время не совпадает
 * со слотами календаря» начнёт врать.
 */
export function analyzeSchedule(schedule: ScheduleItem[]): ScheduleAnalysis {
    const uniqueGroups = new Set(schedule.map((item) => item.group));
    const uniqueTeachers = new Set(schedule.map((item) => item.teacher));
    const uniqueDates = new Set(schedule.map((item) => item.date));
    const uniqueSubjects = new Set(schedule.map((item) => item.subject));
    const uniqueTimeSlots = new Set(schedule.map((item) => item.time));

    // --- Пропущенные поля ---
    const emptyFields = {
        group: schedule.filter((item) => !item.group || item.group.trim() === "").length,
        date: schedule.filter((item) => !item.date || item.date.trim() === "").length,
        time: schedule.filter((item) => !item.time || item.time.trim() === "").length,
        subject: schedule.filter((item) => !item.subject || item.subject.trim() === "").length,
        teacher: schedule.filter((item) => !item.teacher || item.teacher.trim() === "").length,
        classroom: schedule.filter((item) => !item.classroom || item.classroom.trim() === "").length,
    };

    // --- Дубликаты: полностью идентичные повторяющиеся строки ---
    const keyCount = new Map<string, number>();
    schedule.forEach((item) => {
        const key = `${item.group} | ${item.date} | ${item.time} | ${item.teacher} | ${item.subject}`;
        keyCount.set(key, (keyCount.get(key) || 0) + 1);
    });
    const duplicates = Array.from(keyCount.entries()).filter(([, count]) => count > 1);

    // --- Формат полей ---
    const invalidTimeSlots: RowIssue[] = [];
    const invalidDates: RowIssue[] = [];
    const invalidDays: RowIssue[] = [];

    schedule.forEach((item, index) => {
        if (item.time && !isValidTime(item.time)) {
            invalidTimeSlots.push({ item, index: index + 1 });
        }
        if (item.date && !isValidDate(item.date)) {
            invalidDates.push({ item, index: index + 1 });
        }
        if (item.dayOfWeek && !isValidDay(item.dayOfWeek)) {
            invalidDays.push({ item, index: index + 1 });
        }
    });

    // --- Сводка: записи, которые не отобразятся в календаре ---
    const invisibleRecords: InvisibleRecord[] = [];
    schedule.forEach((item, index) => {
        const reasons: string[] = [];

        if (item.time && !isValidTime(item.time)) {
            reasons.push(`Время "${item.time}" не совпадает со слотами календаря`);
        }

        if (item.date) {
            if (!isValidDate(item.date)) {
                reasons.push(`Неверный формат даты "${item.date}"`);
            }
        } else {
            reasons.push("Дата не указана");
        }

        if (item.dayOfWeek) {
            if (!isValidDay(item.dayOfWeek)) {
                reasons.push(`День недели "${item.dayOfWeek}" не распознан`);
            }
        }

        if (reasons.length > 0) {
            invisibleRecords.push({ item, index: index + 1, reasons });
        }
    });

    // --- Нагрузка преподавателей ---
    const teacherWorkload: Record<string, number> = {};
    schedule.forEach((item) => {
        if (item.teacher) {
            teacherWorkload[item.teacher] = (teacherWorkload[item.teacher] || 0) + 1;
        }
    });

    // --- Окна в расписании групп ---
    const groupDaySchedule: Record<string, Record<string, Set<string>>> = {};
    schedule.forEach((item) => {
        if (item.group && item.date && item.time) {
            if (!groupDaySchedule[item.group]) groupDaySchedule[item.group] = {};
            if (!groupDaySchedule[item.group][item.date]) {
                groupDaySchedule[item.group][item.date] = new Set();
            }
            groupDaySchedule[item.group][item.date].add(item.time);
        }
    });

    const gaps: ScheduleGap[] = [];
    Object.entries(groupDaySchedule).forEach(([group, dates]) => {
        Object.entries(dates).forEach(([date, times]) => {
            const daySlots = TIME_SLOTS.map((slot, index) => ({ slot, index })).filter((s) =>
                times.has(s.slot)
            );

            if (daySlots.length > 1) {
                const minIdx = Math.min(...daySlots.map((s) => s.index));
                const maxIdx = Math.max(...daySlots.map((s) => s.index));

                for (let i = minIdx + 1; i < maxIdx; i++) {
                    if (!times.has(TIME_SLOTS[i])) {
                        gaps.push({ group, date, gapTime: TIME_SLOTS[i] });
                    }
                }
            }
        });
    });

    // --- Использование аудиторий ---
    const classroomUsage: Record<string, number> = {};
    schedule.forEach((item) => {
        if (item.classroom) {
            classroomUsage[item.classroom] = (classroomUsage[item.classroom] || 0) + 1;
        }
    });

    // Конфликт аудитории: разные преподаватели в одной аудитории в одно время.
    // Потоковая лекция (один преподаватель) — не конфликт.
    const classroomConflicts: ClassroomConflict[] = [];
    const classroomOccupancy = new Map<string, { teacher: string; subject: string; group: string }>();

    schedule.forEach((item) => {
        if (item.classroom && item.date && item.time && item.teacher) {
            const key = `${item.classroom}|${item.date}|${item.time}`;
            const existing = classroomOccupancy.get(key);

            if (existing) {
                if (existing.teacher !== item.teacher) {
                    const existingConflict = classroomConflicts.find(
                        (c) => c.classroom === item.classroom && c.date === item.date && c.time === item.time
                    );

                    if (existingConflict) {
                        if (!existingConflict.teachers.includes(item.teacher)) {
                            existingConflict.teachers.push(item.teacher);
                            existingConflict.subjects.push(item.subject);
                        }
                    } else {
                        classroomConflicts.push({
                            classroom: item.classroom,
                            date: item.date,
                            time: item.time,
                            teachers: [existing.teacher, item.teacher],
                            subjects: [existing.subject, item.subject],
                        });
                    }
                }
            } else {
                classroomOccupancy.set(key, {
                    teacher: item.teacher,
                    subject: item.subject,
                    group: item.group,
                });
            }
        }
    });

    // Аудитории по дням недели — для штрих-кода использования
    const classroomDailyUsage: Record<string, Set<string>> = {};
    schedule.forEach((item) => {
        if (item.classroom && item.dayOfWeek) {
            if (!classroomDailyUsage[item.classroom]) {
                classroomDailyUsage[item.classroom] = new Set();
            }
            classroomDailyUsage[item.classroom].add(item.dayOfWeek.toLowerCase());
        }
    });

    const totalTimeSlots = uniqueDates.size * TIME_SLOTS.length;
    const classroomUtilization: ClassroomUtilization[] = Object.entries(classroomUsage)
        .map(([classroom, count]) => {
            const daysUsed = classroomDailyUsage[classroom] || new Set();
            const dailyPattern = WEEK_DAYS_SHORT.map((day) => Array.from(daysUsed).some((d) => d.includes(day)));

            return {
                classroom,
                count,
                utilizationPercent: (count / totalTimeSlots) * 100,
                dailyPattern,
            };
        })
        .sort((a, b) => a.classroom.localeCompare(b.classroom, undefined, { numeric: true }));

    // Преподаватель в двух аудиториях одновременно: так быть не может.
    // В паре/подгруппах аудитория одна и та же — это не конфликт.
    const teacherSlots = new Map<
        string,
        { teacher: string; date: string; time: string; rows: TeacherDoubleBooking["rows"] }
    >();
    schedule.forEach((item, index) => {
        if (!item.teacher || !item.date || !item.time || !item.classroom) return;

        const key = `${item.teacher}|${item.date}|${item.time}`;
        const entry = teacherSlots.get(key);

        if (!entry) {
            teacherSlots.set(key, {
                teacher: item.teacher,
                date: item.date,
                time: item.time,
                rows: [{ group: item.group, classroom: item.classroom, subject: item.subject, index: index + 1 }],
            });
            return;
        }

        entry.rows.push({
            group: item.group,
            classroom: item.classroom,
            subject: item.subject,
            index: index + 1,
        });
    });

    const teacherDoubleBookings = [...teacherSlots.values()]
        .filter((entry) => new Set(entry.rows.map((row) => row.classroom)).size > 1)
        .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));

    // --- Проверки ---
    // Порядок: сначала то, что ломает календарь, потом то, что стоит поправить.
    const checks: CheckResult[] = [
        { id: "invisible", severity: "critical", count: invisibleRecords.length },
        { id: "classroomConflict", severity: "critical", count: classroomConflicts.length },
        { id: "teacherDoubleBooking", severity: "critical", count: teacherDoubleBookings.length },
        { id: "invalidTime", severity: "warning", count: invalidTimeSlots.length },
        { id: "invalidDate", severity: "warning", count: invalidDates.length },
        { id: "invalidDay", severity: "warning", count: invalidDays.length },
        {
            id: "emptyFields",
            severity: "warning",
            count: Object.values(emptyFields).reduce((sum, value) => sum + value, 0),
        },
        { id: "duplicates", severity: "warning", count: duplicates.length },
    ];

    return {
        total: schedule.length,
        groups: uniqueGroups.size,
        teachers: uniqueTeachers.size,
        dates: uniqueDates.size,
        subjects: uniqueSubjects.size,
        timeSlots: uniqueTimeSlots.size,

        emptyFields,
        duplicates,

        invalidTimeSlots,
        invalidDates,
        invalidDays,
        invisibleRecords,

        teacherWorkload: Object.entries(teacherWorkload)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15),
        gaps: gaps.slice(0, 20),
        totalGaps: gaps.length,

        classroomUsage: Object.entries(classroomUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10),
        classroomUtilization,
        classroomConflicts,
        teacherDoubleBookings,

        checks,
        criticalCount: checks.filter((c) => c.severity === "critical" && c.count > 0).length,
        warningCount: checks.filter((c) => c.severity === "warning" && c.count > 0).length,
    };
}
