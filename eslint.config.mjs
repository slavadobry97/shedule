import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// Next 16 удалил `next lint` — единственный способ запуска ESLint — flat config.
// Пресеты eslint-config-next отдают массивы flat-конфигов (core-web-vitals — 4,
// typescript — 5 записей).
const eslintConfig = [
    ...coreWebVitals,
    ...nextTypescript,
    {
        ignores: [
            ".next/**",
            "node_modules/**",
            "out/**",
            // Локальный скретч (скриншоты до/после), не часть проекта
            "Temp/**",
            // Генерируемые артефакты next-pwa (перезаписываются на сборке)
            "public/sw.js",
            "public/workbox-*.js",
            "public/worker-*.js",
            "public/swe-worker-*.js",
        ],
    },
    {
        // scripts/*.js — CommonJS-скрипты сборки (запуск: node scripts/...):
        // require там легален, ESM-переименование не требуется.
        files: ["scripts/**/*.js"],
        rules: {
            "@typescript-eslint/no-require-imports": "off",
        },
    },
];

export default eslintConfig;
