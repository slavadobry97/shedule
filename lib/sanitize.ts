/**
 * Запрет эмодзи в данных и в генерируемом тексте.
 *
 * Эмодзи ломают сравнение строк, сортировку и поиск по расписанию,
 * а в текстовых полях таблицы выглядят как мусор. Чистим на входе.
 *
 * Знаки © и ® тоже входят в Unicode Extended_Pictographic, хотя без
 * вариации эмодзи не являются — их надо сохранить, поэтому перед
 * чисткой прячем их под плейсхолдер и возвращаем на место.
 */

/** Extended_Pictographic + селектор вариации + ZWJ + combining keycap */
const EMOJI_GLOBAL = /[\p{Extended_Pictographic}\uFE0F\u200D\u20E3]/gu;
const EMOJI_TEST = /[\p{Extended_Pictographic}\u20E3]/u;
const PROTECTED = /[\u00A9\u00AE]/g;
const PLACEHOLDER = /\u0000(\d+)\u0000/g;

/** Убирает эмодзи и лишние пробелы, возникшие после удаления */
export function stripEmoji(value: string): string {
    if (!value) return value;

    const stash: string[] = [];

    const text = value.replace(PROTECTED, (char) => {
        stash.push(char);
        return `\u0000${stash.length - 1}\u0000`;
    });

    return text
        .replace(EMOJI_GLOBAL, "")
        .replace(/[ \t]{2,}/g, " ")
        .replace(PLACEHOLDER, (_, index) => stash[Number(index)])
        .trim();
}

/** Есть ли в строке эмодзи */
export function hasEmoji(value: string): boolean {
    if (!value) return false;
    return EMOJI_TEST.test(value);
}
