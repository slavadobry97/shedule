"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EXTERNAL_LINKS } from "@/lib/constants";
import { MOTION_DURATION, motionTransition } from "@/lib/motion";
import { WeekPreview } from "./week-preview";

const FACTS = [
    { label: "Данные", value: "каждую минуту" },
    { label: "Доступ", value: "без регистрации" },
    { label: "Экспорт", value: "iCal, PDF" },
];

export function Hero() {
    const reduceMotion = useReducedMotion();

    const rise = (delay: number) =>
        reduceMotion
            ? {}
            : {
                initial: { opacity: 0, y: 16 },
                animate: { opacity: 1, y: 0 },
                transition: motionTransition(reduceMotion, { duration: MOTION_DURATION.slow, delay }),
            };

    return (
        <section className="relative overflow-hidden">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent_75%)]"
            />

            <div className="container mx-auto grid items-center gap-12 px-4 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24 lg:pb-16">
                <div>
                    <motion.div
                        {...rise(0)}
                        className="flex items-center gap-3 text-tiny uppercase tracking-[0.2em] text-muted-foreground"
                    >
                        <span className="h-px w-8 bg-border" aria-hidden="true" />
                        Расписание · Филиал РГСУ в г. Минске
                    </motion.div>

                    <motion.h1
                        {...rise(0.06)}
                        className="mt-6 font-evolventa text-4xl font-bold leading-[1.08] tracking-[-0.02em] text-balance sm:text-5xl"
                    >
                        Расписание без лишних шагов
                    </motion.h1>

                    <motion.p
                        {...rise(0.12)}
                        className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground text-balance sm:text-lg"
                    >
                        Выберите группу или преподавателя — неделя, аудитории и типы занятий перед вами.
                        Таблица обновляется каждую минуту, а о переносах мы сообщаем сразу.
                    </motion.p>

                    <motion.div {...rise(0.18)} className="mt-8 flex flex-wrap items-center gap-3">
                        <Button asChild size="lg" className="h-11 px-6">
                            <Link href="/">
                                Открыть расписание
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-11 px-6">
                            <a href={EXTERNAL_LINKS.SPRAVKA} target="_blank" rel="noopener noreferrer">
                                Справки и документы
                            </a>
                        </Button>
                    </motion.div>

                    <motion.dl
                        {...rise(0.24)}
                        className="mt-12 grid max-w-lg grid-cols-3 divide-x divide-border border-t border-border pt-6"
                    >
                        {FACTS.map((fact) => (
                            <div key={fact.label} className="px-4 first:pl-0 last:pr-0">
                                <dt className="text-xxs uppercase tracking-[0.18em] text-muted-foreground">
                                    {fact.label}
                                </dt>
                                <dd className="mt-1.5 text-sm font-medium leading-snug">{fact.value}</dd>
                            </div>
                        ))}
                    </motion.dl>
                </div>

                <motion.div
                    {...rise(0.3)}
                    className="relative mx-auto w-full max-w-md lg:max-w-none"
                >
                    <div
                        aria-hidden="true"
                        className="absolute -inset-6 -z-10 rounded-3xl bg-primary/[0.04] blur-2xl"
                    />
                    <WeekPreview />
                </motion.div>
            </div>
        </section>
    );
}
