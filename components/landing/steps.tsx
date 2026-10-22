import { Reveal } from "./reveal";

const STEPS = [
    {
        title: "Выберите профиль",
        description:
            "Группа или преподаватель. Профиль с охраняется в  браузере — в  с ледующий раз с разу о ткрывается в аша неделя.",
    },
    {
        title: "Смотрите неделю",
        description:
            "Таблица на десктопе и компактный вид на телефоне. Фильтры, поиск, переключение дней, подсветка текущей пары.",
    },
    {
        title: "Экспортируйте или подпишитесь",
        description:
            "Календарь iCal для с инхронизации с  телефоном либо push-уведомления, к огда расписание изменилось.",
    },
];

export function Steps() {
    return (
        <section className="border-t border-border">
            <div className="container mx-auto px-4 py-16 sm:py-20">
                <Reveal>
                    <p className="text-tiny uppercase tracking-[0.2em] text-muted-foreground">
                        Как это работает
                    </p>
                </Reveal>

                <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
                    {STEPS.map((step, index) => (
                        <Reveal key={step.title} delay={index * 0.08}>
                            <li className="border-t border-border pt-5">
                                <span className="font-mono text-tiny tabular-nums tracking-[0.18em] text-muted-foreground">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <h3 className="mt-3 text-lg font-semibold tracking-[-0.01em]">{step.title}</h3>
                                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    {step.description}
                                </p>
                            </li>
                        </Reveal>
                    ))}
                </ol>
            </div>
        </section>
    );
}
