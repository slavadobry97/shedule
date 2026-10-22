"use client";

import { ThemeTuner } from "./theme-tuner";
import { TokenSwatches } from "./token-swatches";
import { ComponentShowcase } from "./component-showcase";
import { IconGallery } from "./icon-gallery";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    { name: "rounded-sm", value: "calc(--radius - 4px)" },
    { name: "rounded-md", value: "calc(--radius - 2px)" },
    { name: "rounded-lg", value: "var(--radius)" },
    { name: "rounded-xl", value: "0.75rem" },
    { name: "rounded-2xl", value: "1rem" },
    { name: "rounded-full", value: "9999px" },
];

export function DesignSystemPage() {
    return (
        <div className="container mx-auto px-4 py-10 sm:py-14">
            <header className="max-w-3xl">
                <p className="font-mono text-tiny uppercase tracking-[0.2em] text-muted-foreground">
                    Служебная страница
                </p>
                <h1 className="mt-3 font-evolventa text-4xl font-bold tracking-[-0.02em] text-balance sm:text-5xl">
                    Дизайн-система
                </h1>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    Живая витрина компонентов и токенов. Токены — в{" "}
                    <code className="font-mono text-sm">app/globals.css</code>, правила — в{" "}
                    <code className="font-mono text-sm">docs/ui-guidelines.md</code>.
                    Здесь же можно потрогать значения и посмотреть, как система
                    поведёт себя с другими.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/debug">Открыть отладку</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/">К расписанию</Link>
                    </Button>
                </div>
            </header>

            <div className="mt-12 space-y-12">
                <Section
                    title="Тюнер темы"
                    description="Меняет CSS-переменные прямо в  превью: с кругление, о ттенок акцента, масштаб шрифта. Значения применяются только к  превью — настройки проекта не меняются."
                >
                    <ThemeTuner />
                </Section>

                <Section
                    title="Палитра"
                    description="Токены цветов. Значения подписаны так, как они лежат в :root и .dark — темная тема подхватывается автоматически."
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
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {RADII.map((radius) => (
                            <div key={radius.name} className="text-center">
                                <div
                                    className={`${radius.name} h-16 w-full border border-border bg-muted/40`}
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
                    title="Компоненты"
                    description="Все к омпоненты из components/ui в  текущем с остоянии — те же, что используются в  приложении."
                >
                    <ComponentShowcase />
                </Section>

                <Section
                    title="Иконки"
                    description="Hugeicons. Новые иконки добавляются в  components/icons/index.tsx поштучным импортом."
                >
                    <IconGallery />
                </Section>
            </div>
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
        <section className="border-t border-border pt-10">
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
