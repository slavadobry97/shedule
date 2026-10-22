/**
 * Общие настройки движения (docs/ui-guidelines.md, раздел «Движение»).
 *
 * Кривая — мягкое торможение без отскока, как в Apple HIG.
 * Длительности: 0.2–0.35 с для переходов внутри экрана, до 0.5 с для панелей.
 */

/** Кривая движения: cubic-bezier(0.22, 1, 0.36, 1) */
export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export const MOTION_DURATION = {
    /** Быстрый отклик: наведение, нажатие */
    fast: 0.2,
    /** Переходы внутри экрана */
    base: 0.25,
    /** Появление панелей и шторок */
    panel: 0.4,
    /** Медленные, «весомые» переходы */
    slow: 0.5,
} as const;

/** Пружина без отскока — для жестов и свайпов */
export const MOTION_SPRING = {
    type: "spring",
    stiffness: 320,
    damping: 34,
    mass: 0.9,
} as const;

/**
 * Смена иконки по контексту (copy → check): короткая пружина без отскока.
 * Иконку анимируем через opacity, scale и blur, а не переключаем видимость.
 */
export const MOTION_ICON_SPRING = {
    type: "spring",
    duration: 0.3,
    bounce: 0,
} as const;

type TransitionOptions = {
    duration?: number;
    delay?: number;
    spring?: boolean;
};

/**
 * Описание перехода для framer-motion с учётом prefers-reduced-motion.
 * При включённом reduced motion переход схлопывается в мгновенный.
 */
export function motionTransition(
    reduce: boolean | null,
    { duration = MOTION_DURATION.base, delay = 0, spring = false }: TransitionOptions = {}
) {
    if (reduce) {
        return { duration: 0, delay: 0 };
    }

    if (spring) {
        return { ...MOTION_SPRING, delay };
    }

    return { type: "tween" as const, duration, delay, ease: MOTION_EASE };
}
