"use client";

import { useEffect, useState } from "react";

/**
 * «Сейчас», обновляющееся по таймеру (по умолчанию раз в 30 с).
 * Общий тикер для живых индикаторов времени: баннер идущей пары
 * (components/now-banner.tsx), полоса продолжительности в карточках.
 */
export function useNow(intervalMs: number = 30_000) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);

    return now;
}
