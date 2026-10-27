/**
 * Цветовая индикация по типу занятия.
 *
 * Используется в карточках занятий (день, неделя, месяц) для визуального
 * отделения лекций от практик, зачётов, экзаменов и лабораторных.
 *
 * Все цвета — семантические токены из globals.css (--lesson-*):
 * светлые значения выверены по контрасту ≥4.5 для текста 12px, тёмная
 * тема переопределяется в .dark.
 */

export type LessonTypeColor = {
    /** CSS-класс текста */
    text: string;
    /** CSS-класс точки */
    dot: string;
};

/** Ключи — нормализованные (нижний регистр, е вместо ё): normalize() приводит
 *  «Приём зачётов» и «Прием зачетов» к одному виду, дубли не нужны. */
const MAP: Record<string, LessonTypeColor> = {
    "чтение лекций": {
        text: "text-lesson-lecture",
        dot: "bg-lesson-lecture",
    },
    "ведение практических занятий": {
        text: "text-success",
        dot: "bg-success",
    },
    "проведение лабораторных работ": {
        text: "text-success",
        dot: "bg-success",
    },
    "прием зачетов": {
        text: "text-lesson-credit",
        dot: "bg-lesson-credit",
    },
    "прием дифференцированных зачетов": {
        text: "text-lesson-credit-diff",
        dot: "bg-lesson-credit-diff",
    },
    "прием экзаменов": {
        text: "text-destructive",
        dot: "bg-destructive",
    },
};

/** Нормализация: ё → е, нижний регистр */
function normalize(str: string): string {
    return str.replace(/ё/g, "е").toLowerCase();
}

/**
 * Возвращает цветовую схему для типа занятия или нейтральный fallback.
 */
export function getLessonTypeColor(rawType: string): LessonTypeColor {
    const key = normalize(rawType);
    return MAP[key] ?? {
        text: "text-muted-foreground",
        dot: "bg-muted-foreground/40",
    };
}
