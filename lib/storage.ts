/**
 * Безопасный доступ к localStorage.
 *
 * Зачем: в приватном режиме Safari, при «блокировать данные сайтов» и в части
 * вебвью обращение к localStorage бросает SecurityError вместо возврата null.
 * Голый вызов в рендере или useEffect роняет дерево React (error boundary в
 * проекте нет) — студент видит белый экран вместо расписания.
 *
 * Контракт: при недоступности хранилища ведём себя так, будто ничего не
 * сохранено — safeGet возвращает null, safeSet тихо пропускает запись.
 * Эталон обёрток — components/debug/ai-chat.tsx.
 */

export function safeGet(key: string): string | null {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function safeSet(key: string, value: string): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Хранилище заблокировано: настройки просто не сохранятся до следующего
        // визита — это лучше белого экрана.
    }
}
