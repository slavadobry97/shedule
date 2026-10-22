"use client";

import { useEffect } from "react";

/**
 * В dev service worker отключён (см. next.config.mjs), но в браузере мог
 * остаться SW, установленный production-сборкой: он кэширует страницы и
 * отдаёт устаревшие бандлы — ломается гидратация, React роняет обновления
 * состояния («Can't perform a React state update on a component that hasn't
 * mounted yet»), а страница может «залипнуть» на старой версии.
 *
 * Снимаем регистрацию и чистим кэши. В production ничего не трогаем.
 */
export function PwaDevCleanup() {
    useEffect(() => {
        if (process.env.NODE_ENV === "production") return;
        if (!("serviceWorker" in navigator)) return;

        navigator.serviceWorker
            .getRegistrations()
            .then((registrations) => {
                registrations.forEach((registration) => registration.unregister());
            })
            .catch(() => {});

        if ("caches" in window) {
            caches
                .keys()
                .then((keys) => {
                    keys.forEach((key) => caches.delete(key));
                })
                .catch(() => {});
        }
    }, []);

    return null;
}
