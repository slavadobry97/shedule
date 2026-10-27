import { type IconComponent, BellRingIcon, CalendarPlusIcon, SearchIcon, WifiOffIcon } from "@/components/icons";
import { Reveal } from "./reveal";

interface Feature {
    icon: IconComponent;
    title: string;
    description: string;
}

const FEATURES: Feature[] = [
    {
        icon: SearchIcon,
        title: "Поиск по группам и преподавателям",
        description:
            "Выберите с вой профиль — в ся нагрузка в  о дной ленте. Фильтры по дате, в иду занятия и поиск по названию дисциплины.",
    },
    {
        icon: BellRingIcon,
        title: "Уведомления об изменениях",
        description:
            "Сервис сам следит за таблицей и сообщает, если пару перенесли, сменили аудиторию или преподавателя.",
    },
    {
        icon: CalendarPlusIcon,
        title: "Экспорт в  к алендарь и PDF",
        description:
            "Подпишитесь на iCal-календарь с воей группы или с охраните неделю в  PDF — без ручной перерисовки.",
    },
    {
        icon: WifiOffIcon,
        title: "Работает офлайн",
        description:
            "PWA ставится на главный экран и открывает расписание даже без сети. Последние данные остаются доступными.",
    },
];

export function Features() {
    return (
        <section className="container mx-auto px-4 py-16 sm:py-20">
            <Reveal>
                <div className="max-w-2xl">
                    <p className="text-tiny uppercase tracking-[0.2em] text-muted-foreground">
                        Возможности
                    </p>
                    <h2 className="mt-4 font-evolventa text-3xl font-bold tracking-[-0.015em] text-balance sm:text-4xl">
                        Всё, что нужно, чтобы не сверяться с доской объявлений
                    </h2>
                </div>
            </Reveal>

            <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
                {FEATURES.map((feature, index) => (
                    <Reveal key={feature.title} delay={index * 0.06} className="bg-background">
                        <article className="h-full p-6">
                            <div className="flex h-9 w-9 items-center justify-center rounded-3xl border border-border bg-background">
                                <feature.icon className="h-4 w-4 text-foreground" aria-hidden="true" />
                            </div>
                            <h3 className="mt-5 text-base font-semibold leading-snug">{feature.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                {feature.description}
                            </p>
                        </article>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}
