/**
 * Копирование текста в буфер обмена с фолбэком.
 *
 * `navigator.clipboard` доступен только в secure context (HTTPS или localhost)
 * и может быть запрещён политикой браузера или расширением. В этом случае
 * используем старый способ через скрытую textarea: он работает и по HTTP,
 * и без явного разрешения, потому что вызывается из пользовательского жеста.
 */
export async function copyText(text: string): Promise<boolean> {
    if (
        typeof navigator !== "undefined" &&
        typeof window !== "undefined" &&
        window.isSecureContext &&
        navigator.clipboard
    ) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Отказ в разрешении — не повод показывать ошибку: пробуем фолбэк.
        }
    }

    if (typeof document === "undefined") return false;

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.setAttribute("aria-hidden", "true");
    // За пределами экрана, но всё ещё в документе — иначе select() не сработает.
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";

    // Сохраняем текущее выделение, чтобы вернуть его после копирования.
    const selection = document.getSelection();
    const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    document.body.appendChild(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    let copied = false;
    try {
        copied = document.execCommand("copy");
    } catch {
        copied = false;
    } finally {
        document.body.removeChild(textarea);
        if (previousRange && selection) {
            selection.removeAllRanges();
            selection.addRange(previousRange);
        }
    }

    return copied;
}
