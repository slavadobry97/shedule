"use client";

/**
 * Тактильная отдача (docs/ui-gidelines.md, раздел «Haptics»).
 *
 * Вибрация только там, где несёт смысл: свайп недели, смена вкладки,
 * подтверждение действия. Не на каждое касание.
 *
 * Ограничения:
 * - только мобильные устройства (на десктопе вибрации нет);
 * - при prefers-reduced-motion вибрация не вызывается;
 * - поддержка проверяется через navigator.vibrate.
 */

export type HapticPattern = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const PATTERNS: Record<HapticPattern, number | number[]> = {
    light: 8,
    medium: 14,
    heavy: 22,
    success: [10, 40, 12],
    warning: [16, 60, 16],
    error: [24, 50, 24],
};

let touchChecked = false;
let isTouch = false;

function isTouchDevice() {
    if (touchChecked) return isTouch;

    touchChecked = true;
    isTouch =
        typeof window !== "undefined" &&
        (window.matchMedia?.("(pointer: coarse)").matches || navigator.maxTouchPoints > 0);

    return isTouch;
}

function prefersReducedMotion() {
    return (
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );
}

/**
 * Вибрирует по заданному паттерну. Вне мобильных и при reduced-motion
 * вызов — no-op, поэтому можно звать без проверок.
 */
export function haptic(pattern: HapticPattern = "light") {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;
    if (!("vibrate" in navigator)) return;
    if (!isTouchDevice()) return;
    if (prefersReducedMotion()) return;

    try {
        navigator.vibrate(PATTERNS[pattern]);
    } catch {
        // вибрация может быть запрещена политикой браузера — это не ошибка
    }
}
