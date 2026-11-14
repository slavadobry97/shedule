import { STORAGE_KEYS } from "@/lib/constants";
import { safeGet, safeSet } from "@/lib/storage";

/**
 * Единственное место логики «сохранённой группы или преподавателя»
 * («Моя группа» / «Это я»).
 *
 * Инвариант: выбран ровно один — группа ИЛИ преподаватель. Запись одного
 * сбрасывает другой в "all". Раньше эта логика с парами setItem была
 * скопирована в пяти местах (DynamicSchedule, schedule-view ×3,
 * NotificationSettings), из-за рассинхрона копий уже бывали UX-баги.
 *
 * Соглашение по значениям: "all" в хранилище = «не выбрано», null в
 * readSavedSelection() = «не выбрано».
 */

export interface SavedSelection {
    group: string | null;
    teacher: string | null;
}

/** Читает сохранённый профиль; "all" и отсутствие записи нормализуются в null */
export function readSavedSelection(): SavedSelection {
    const group = safeGet(STORAGE_KEYS.SELECTED_GROUP);
    const teacher = safeGet(STORAGE_KEYS.SELECTED_TEACHER);
    return {
        group: group && group !== "all" ? group : null,
        teacher: teacher && teacher !== "all" ? teacher : null,
    };
}

/** Сохраняет группу как «мою» и сбрасывает преподавателя */
export function saveGroupSelection(group: string): void {
    safeSet(STORAGE_KEYS.SELECTED_GROUP, group);
    safeSet(STORAGE_KEYS.SELECTED_TEACHER, "all");
}

/** Сохраняет преподавателя как «мой профиль» и сбрасывает группу */
export function saveTeacherSelection(teacher: string): void {
    safeSet(STORAGE_KEYS.SELECTED_TEACHER, teacher);
    safeSet(STORAGE_KEYS.SELECTED_GROUP, "all");
}

/** Сбрасывает сохранённую группу (преподавателя не трогает) */
export function clearSavedGroup(): void {
    safeSet(STORAGE_KEYS.SELECTED_GROUP, "all");
}

/** Сбрасывает сохранённого преподавателя (группу не трогает) */
export function clearSavedTeacher(): void {
    safeSet(STORAGE_KEYS.SELECTED_TEACHER, "all");
}
