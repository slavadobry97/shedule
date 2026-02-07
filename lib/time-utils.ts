import { parse, isSameDay, isWithinInterval, set } from "date-fns";

/**
 * Checks if a specific lesson time slot is currently active.
 * @param timeSlot - format "HH.MM - HH.MM" (e.g. "08.30 - 10.00")
 * @param dateStr - format "dd.MM.yyyy" (e.g. "27.01.2025")
 * @returns boolean
 */
export function isLessonActive(timeSlot: string, dateStr: string): boolean {
    try {
        const now = new Date();
        const lessonDate = parse(dateStr, "dd.MM.yyyy", new Date());

        // Check if it's the same day
        if (!isSameDay(now, lessonDate)) {
            return false;
        }

        // Parse time range
        const [startStr, endStr] = timeSlot.split(" - ");
        if (!startStr || !endStr) return false;

        const [startHour, startMinute] = startStr.split(".").map(Number);
        const [endHour, endMinute] = endStr.split(".").map(Number);

        const startTime = set(now, { hours: startHour, minutes: startMinute, seconds: 0, milliseconds: 0 });
        const endTime = set(now, { hours: endHour, minutes: endMinute, seconds: 0, milliseconds: 0 });

        return isWithinInterval(now, { start: startTime, end: endTime });
    } catch (error) {
        console.error("Error checking active lesson:", error);
        return false;
    }
}

/**
 * Checks if the given date string corresponds to today.
 * @param dateStr - format "dd.MM.yyyy"
 */
export function isToday(dateStr: string): boolean {
    try {
        const now = new Date();
        const date = parse(dateStr, "dd.MM.yyyy", new Date());
        return isSameDay(now, date);
    } catch {
        return false;
    }
}
