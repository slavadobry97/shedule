import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EXTERNAL_LINKS } from "@/lib/constants";
import { Reveal } from "./reveal";

export function LandingCta() {
    return (
        <section className="container mx-auto px-4 pb-16 sm:pb-20">
            <Reveal>
                <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-brand px-6 py-10 text-background sm:px-10 sm:py-12 md:flex-row md:items-center">
                    <div className="max-w-xl">
                        <h2 className="font-evolventa text-2xl font-bold tracking-[-0.01em] text-balance sm:text-3xl">
                            Расписание уже здесь
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed opacity-80">
                            Без регистрации и установки. Выберите группу — и неделя перед вами.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            asChild
                            size="lg"
                            className="h-11 bg-background px-6 text-foreground hover:bg-background/90"
                        >
                            <Link href="/">
                                Открыть расписание
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="h-11 border-background/30 bg-transparent px-6 text-background hover:bg-background/10 hover:text-background"
                        >
                            <a
                                href={EXTERNAL_LINKS.SPRAVKA}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Заказать справку
                            </a>
                        </Button>
                    </div>
                </div>
            </Reveal>
        </section>
    );
}
