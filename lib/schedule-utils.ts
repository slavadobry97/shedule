import { ScheduleItem } from "@/types/schedule";

// Создаём уникальный ключ для занятия
export const createItemKey = (item: ScheduleItem): string => {
    // Используем id если есть, иначе комбинацию всех ключевых полей
    if (item.id) {
        return item.id;
    }
    // Включаем предмет и преподавателя для уникальности
    // (у одной группы может быть несколько занятий в одно время с разными преподавателями)
    return `${item.date}-${item.time}-${item.group}-${item.subject}-${item.teacher}`;
};

// Сравниваем два набора данных и возвращаем детали изменений
export interface ChangeDetails {
    added: ScheduleItem[];
    removed: ScheduleItem[];
    modified: { old: ScheduleItem; new: ScheduleItem }[];
}

export interface LogEntry {
    timestamp: number;
    changes: ChangeDetails;
}

export const compareScheduleData = (
    oldData: ScheduleItem[],
    newData: ScheduleItem[]
): ChangeDetails => {
    const oldMap = new Map<string, ScheduleItem>();
    const newMap = new Map<string, ScheduleItem>();

    oldData.forEach((item) => oldMap.set(createItemKey(item), item));
    newData.forEach((item) => newMap.set(createItemKey(item), item));

    const added: ScheduleItem[] = [];
    const removed: ScheduleItem[] = [];
    const modified: { old: ScheduleItem; new: ScheduleItem }[] = [];

    // Находим добавленные и изменённые
    newData.forEach((newItem) => {
        const key = createItemKey(newItem);
        const oldItem = oldMap.get(key);

        if (!oldItem) {
            added.push(newItem);
        } else if (
            oldItem.subject !== newItem.subject ||
            oldItem.teacher !== newItem.teacher ||
            oldItem.classroom !== newItem.classroom ||
            oldItem.lessonType !== newItem.lessonType
        ) {
            modified.push({ old: oldItem, new: newItem });
        }
    });

    // Находим удалённые
    oldData.forEach((oldItem) => {
        const key = createItemKey(oldItem);
        if (!newMap.has(key)) {
            removed.push(oldItem);
        }
    });

    return { added, removed, modified };
};
