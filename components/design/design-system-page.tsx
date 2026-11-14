"use client";

import { ThemeTuner } from "./theme-tuner";
import { TokenSwatches } from "./token-swatches";
import { ComponentShowcase } from "./component-showcase";
import { IconGallery } from "./icon-gallery";
import { Reveal } from "@/components/landing/reveal";

const TYPE_SCALE = [
    { name: "text-4xl", label: "Заголовок", className: "font-evolventa text-4xl font-bold tracking-[-0.02em]" },
    { name: "text-2xl", label: "Подзаголовок", className: "font-evolventa text-2xl font-bold tracking-[-0.01em]" },
    { name: "text-lg", label: "Заголовок раздела", className: "text-lg font-semibold" },
    { name: "text-base", label: "Основной текст", className: "text-base" },
    { name: "text-sm", label: "Вторичный текст", className: "text-sm text-muted-foreground" },
    { name: "text-xs", label: "Подпись", className: "text-xs text-muted-foreground" },
    { name: "text-tiny", label: "Микро-подпись", className: "text-tiny uppercase tracking-[0.18em] text-muted-foreground" },
    { name: "font-mono", label: "Моно (числа, код)", className: "font-mono text-sm" },
];

const RADII = [
    { name: "rounded-xl", className: "rounded-xl" },
    { name: "rounded-2xl", className: "rounded-2xl" },
    { name: "rounded-3xl", className: "rounded-3xl" },
    { name: "rounded-4xl", className: "rounded-4xl" },
    { name: "rounded-full", className: "rounded-full" },
];

/**
 * Витрина дизайн-системы. Заголовок раздела даёт SectionHeader
 * (debug-client) — здесь только содержимое витрины.
 */
export function DesignSystemPage() {
    return (
        <div className="space-y-12">
            <Section
                title="Тюнер темы"
                description="Меняет CSS-переменные прямо в превью: скругление, оттенок акцента, масштаб шрифта. Значения применяются только к превью — настройки проекта не меняются."
            >
                <ThemeTuner />
            </Section>

            <Section
                title="Палитра"
                description="Токены цветов. Значения подписаны так, как они лежат в :root и .dark — тёмная тема подхватывается автоматически."
            >
                <TokenSwatches />
            </Section>

            <Section
                title="Типографика"
                description="Evolventa — заголовки, системный sans — текст, Geist Mono — числа и служебные подписи."
            >
                <div className="space-y-4">
                    {TYPE_SCALE.map((item) => (
                        <div
                            key={item.name}
                            className="flex flex-col gap-1 border-b border-border/60 pb-4 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-6"
                        >
                            <span className="w-40 shrink-0 font-mono text-tiny text-muted-foreground">
                                {item.name}
                            </span>
                            <span className={item.className}>Расписание занятий</span>
                            <span className="sm:ml-auto font-mono text-tiny text-muted-foreground">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </Section>

            <Section
                title="Скругления и поверхности"
                description="Радиусы задаются токеном --radius: 0.65rem по умолчанию."
            >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {RADII.map((radius) => (
                        <div key={radius.name} className="text-center">
                            <div
                                className={`${radius.className} h-16 w-full border border-border bg-muted/40`}
                                aria-hidden="true"
                            />
                            <p className="mt-2 font-mono text-xxs text-muted-foreground">
                                {radius.name}
                            </p>
                        </div>
                    ))}
                </div>
            </Section>

            <Section
                title="Тонированные подложки"
                description="Мягкий градиент из угла поверх bg-card — статус карточки читается до текста. Утилита bg-tone-* в globals.css: цвет берётся из токена, тёмная тема подхватывается сама."
            >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {([
                        ["info", "bg-tone-info", "Информация"],
                        ["success", "bg-tone-success", "Всё хорошо"],
                        ["warning", "bg-tone-warning", "Внимание"],
                        ["destructive", "bg-tone-destructive", "Ошибка"],
                    ] as const).map(([token, toneClass, label]) => (
                        <div
                            key={token}
                            className={`rounded-3xl border border-border/70 bg-card p-4 ${toneClass}`}
                        >
                            <span className="text-sm font-semibold">{label}</span>
                            <p className="mt-1 font-mono text-xxs uppercase tracking-[0.16em] text-muted-foreground">
                                bg-tone-{token}
                            </p>
                        </div>
                    ))}
                </div>
            </Section>

            <Section
                title="Компоненты"
                description="Все компоненты из components/ui в текущем состоянии — те же, что используются в приложении."
            >
                <ComponentShowcase />
            </Section>

            <Section
                title="Иконки"
                description="Hugeicons. Новые иконки добавляются в components/icons/index.tsx поштучным импортом."
            >
                <IconGallery />
            </Section>
        </div>
    );
}

function Section({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="border-t border-border pt-10 first:border-t-0 first:pt-0">
            <Reveal>
                <h2 className="font-evolventa text-2xl font-bold tracking-[-0.015em] sm:text-3xl">
                    {title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {description}
                </p>
            </Reveal>
            <div className="mt-6">{children}</div>
        </section>
    );
}
