"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HeaderActions } from "./header-actions";
import { GraduationCap, ChevronRight, User, Users } from "lucide-react";
import { Suspense } from "react";

function HeaderContent() {
    const searchParams = useSearchParams();
    const group = searchParams.get("group");
    const teacher = searchParams.get("teacher");

    // Determine the label to show
    const badgeLabel = group || teacher;
    const isGroup = !!group;

    return (
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-1 sm:gap-2 overflow-hidden">
                <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80 shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="hidden font-bold sm:inline-block whitespace-nowrap">
                        Расписание РГСУ
                    </div>
                    <div className="inline-block font-bold sm:hidden">
                        РГСУ
                    </div>
                </Link>

                {badgeLabel && (
                    <>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />

                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
                                {isGroup ? <Users className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                            </div>
                            <span className="font-semibold text-sm sm:text-base truncate">
                                {badgeLabel}
                            </span>
                        </div>
                    </>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <HeaderActions />
            </div>
        </div>
    );
}

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Suspense fallback={<div className="h-14" />}>
                <HeaderContent />
            </Suspense>
        </header>
    );
}
