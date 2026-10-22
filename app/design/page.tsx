import type { Metadata } from "next";
import { DesignSystemPage } from "@/components/design/design-system-page";

export const metadata: Metadata = {
    title: "Дизайн-система | Расписание РГСУ",
    description:
        "Служебная витрина компонентов, токенов и иконок приложения расписания РГСУ.",
    robots: { index: false, follow: false },
};

export default function DesignPage() {
    return <DesignSystemPage />;
}
