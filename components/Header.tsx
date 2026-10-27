"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HeaderActions } from "./header-actions";
import { ChevronRightIcon, UserIcon, UsersIcon } from "@/components/icons";
import { Suspense } from "react";
import { IconLogo } from "@/components/logo/icon-logo";
import { APP_INFO } from "@/lib/constants";

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
                <Link href="/" className="flex items-end gap-2 transition-opacity hover:opacity-80 shrink-0 text-brand">
                    <div className="flex h-9 w-9 items-center justify-center">
                        <IconLogo className="h-full w-full" />
                    </div>
                    <div className="hidden sm:flex flex-col leading-none">
                        <span className="font-bold whitespace-nowrap text-base leading-none">{APP_INFO.TITLE}</span>
                        <span className="text-xs font-medium whitespace-nowrap tracking-wider leading-none">{APP_INFO.SUBTITLE}</span>
                    </div>
                </Link>

                {badgeLabel && (
                    <>
 <ChevronRightIcon className="h-4 w-4 text-muted-foreground/50 shrink-0" />

                        <div className="flex items-center gap-1.5 overflow-hidden pl-0.5 pr-2 py-0.5 rounded-full bg-muted/50 border border-border/50">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-xs text-primary shrink-0">
 {isGroup ? <UsersIcon className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                            </div>
                            <span className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[200px]">
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
        <header className="sticky top-0 z-50 w-full border-b bg-canvas supports-[backdrop-filter]:bg-canvas/80 backdrop-blur-[20px] backdrop-saturate-180">
            <Suspense fallback={<div className="h-14" />}>
                <HeaderContent />
            </Suspense>
        </header>
    );
}
