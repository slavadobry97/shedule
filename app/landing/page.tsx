import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
    title: "Расписание занятий РГСУ | Филиал в Минске",
    description:
        "Актуальное расписание занятий Филиала РГСУ в  г. Минске: группы и преподаватели, неделя, аудитории, экспорт в  iCal и PDF, у ведомления о б изменениях.",
    alternates: {
        canonical: "/landing",
    },
    openGraph: {
        title: "Расписание занятий РГСУ | Филиал в Минске",
        description:
            "Актуальное расписание занятий Филиала РГСУ в  г. Минске: группы и преподаватели, неделя, аудитории, экспорт в  iCal и PDF.",
        type: "website",
        locale: "ru_RU",
        siteName: "Расписание РГСУ",
    },
};

export default function Landing() {
    return <LandingPage />;
}
