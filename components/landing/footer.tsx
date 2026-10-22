import Link from "next/link";
import { IconLogo } from "@/components/logo/icon-logo";
import { APP_INFO, EXTERNAL_LINKS } from "@/lib/constants";

const LINKS = [
    { href: "/", label: "Расписание", external: false },
    { href: EXTERNAL_LINKS.SPRAVKA, label: "Справки и документы", external: true },
];

export function LandingFooter() {
    return (
        <footer className="border-t border-border">
            <div className="container mx-auto px-4 py-10">
                <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 items-center justify-center text-brand">
                            <IconLogo className="h-full w-full" />
                        </span>
                        <div className="leading-tight">
                            <p className="text-sm font-semibold">{APP_INFO.TITLE}</p>
                            <p className="text-xs text-muted-foreground">{APP_INFO.SUBTITLE}</p>
                        </div>
                    </div>

                    <nav aria-label="Основная навигация" className="flex flex-col gap-2 sm:items-end">
                        {LINKS.map((link) =>
                            link.external ? (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    {link.label}
                                </a>
                            ) : (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    {link.label}
                                </Link>
                            )
                        )}
                    </nav>
                </div>

                <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <p>© {new Date().getFullYear()} Филиал РГСУ в г. Минске</p>
                    <p>Данные обновляются автоматически из таблицы деканата</p>
                </div>
            </div>
        </footer>
    );
}
