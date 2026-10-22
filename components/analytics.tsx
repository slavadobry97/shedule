"use client";

import { useEffect } from "react";
import { init } from "@plausible-analytics/tracker";
import { ANALYTICS } from "@/lib/constants";

/**
 * Аналитика Plausible.
 *
 * Счётчик без cookie: хранит только агрегированные данные, без IP и
 * идентификаторов. Пока не задан NEXT_PUBLIC_PLAUSIBLE_DOMAIN — не
 * подключается вовсе и не делает ни одного запроса.
 */
let initialized = false;

export function PlausibleAnalytics() {
    useEffect(() => {
        const { DOMAIN, ENDPOINT } = ANALYTICS;

        if (!DOMAIN || initialized) return;

        initialized = true;

        init({
            domain: DOMAIN,
            ...(ENDPOINT ? { endpoint: ENDPOINT } : {}),
            // SPA: страницы переключаются на клиенте, трекер сам слушает history API
            autoCapturePageviews: true,
            hashBasedRouting: false,
            outboundLinks: true,
            fileDownloads: true,
            captureOnLocalhost: false,
            logging: false,
        });
    }, []);

    return null;
}
