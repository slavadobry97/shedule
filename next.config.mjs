import withPWAInit, { runtimeCaching as defaultRuntimeCaching } from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    // В dev service worker выключен: он кэширует страницы и отдаёт устаревшие
    // бандлы — ломается гидратация (React: «state update on a component that
    // hasn't mounted yet») и страница «залипает» на старой версии.
    disable: process.env.NODE_ENV === "development",
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    customWorkerSrc: "worker",
    workboxOptions: {
        disableDevLogs: true,
        // /debug отдаёт состояние по авторизации: его нельзя отдавать из кэша
        // service worker'а — иначе после выхода остаётся старая версия страницы,
        // а пользователь с паролем видит вместо отладки прошлую заглушку.
        // Правило должно идти первым: workbox берёт первое совпавшее.
        runtimeCaching: [
            {
                // ВАЖНО: workbox проверяет регулярку по полному URL
                // (https://хост/путь), а не по pathname. Шаблон с «^» в начале
                // никогда не сработает — поэтому ищем путь в любом месте строки.
                // Для чужих доменов workbox сам требует совпадения с начала.
                urlPattern: /\/debug(\/|$|\?)/,
                handler: "NetworkOnly",
                method: "GET",
            },
            {
                // Списки групп и преподавателей: отдельная лёгкая ручка.
                // Своё правило и своя копия, чтобы не забирать слот
                // у кэша расписания. Идёт раньше общего правила.
                urlPattern: /\/api\/schedule\/meta(\?|$)/,
                handler: "StaleWhileRevalidate",
                method: "GET",
                options: {
                    cacheName: "api-schedule-meta",
                    expiration: {
                        maxEntries: 2,
                        maxAgeSeconds: 300,
                    },
                },
            },
            {
                // Расписание: отдаём устаревшее сразу и обновляем в фоне —
                // приложение открывается мгновенно, а через 5 минут в фоне
                // обновляется копия. Правило выше дефолтного для /api/*,
                // иначе NetworkFirst на 24 часа перехватит запрос первым.
                // В кэше лежит и полная версия, и отфильтрованные по группе:
                // ключ запроса включает параметры, поэтому нужны все слоты.
                urlPattern: /\/api\/schedule(\?|$|\/)/,
                handler: "StaleWhileRevalidate",
                method: "GET",
                options: {
                    cacheName: "api-schedule",
                    expiration: {
                        maxEntries: 12,
                        maxAgeSeconds: 300,
                    },
                },
            },
            ...defaultRuntimeCaching,
        ],
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    // class-variance-authority и другие пакеты тянут clsx/tailwind-merge.
    // Алиасим их на cn, чтобы в бандле осталась одна реализация слияния классов.
    turbopack: {
        resolveAlias: {
            clsx: "cn",
            "tailwind-merge": "cn",
        },
    },
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            clsx: "cn",
            "tailwind-merge": "cn",
        };
        config.watchOptions = {
            ...config.watchOptions,
            ignored: [
                ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
                "**/node_modules/**",
                "**/.git/**",
                "**/System Volume Information/**",
                "D:/System Volume Information",
            ],
        };
        return config;
    },
};


export default withPWA(nextConfig);

