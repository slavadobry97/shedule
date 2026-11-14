"use client";

import { useRef } from "react";

/**
 * Горизонтальный свайп по контенту = переход к соседнему периоду (№120).
 * Порог 50px, как в мобильной «Неделе», где паттерн появился первым.
 * Без preventDefault: вертикальный скролл остаётся нативным, а браузер сам
 * отменяет click, если палец сместился дальше допустимого дрейфа — свайп
 * не «докликивает» по карточкам занятия.
 */
export function useHorizontalSwipe(onLeft: () => void, onRight: () => void, minDistance = 50) {
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);

    const onTouchStart = (e: React.TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (touchStart.current === null || touchEnd.current === null) return;
        const distance = touchStart.current - touchEnd.current;
        if (distance > minDistance) {
            onLeft();
        } else if (distance < -minDistance) {
            onRight();
        }
        touchStart.current = null;
        touchEnd.current = null;
    };

    return { onTouchStart, onTouchMove, onTouchEnd };
}
