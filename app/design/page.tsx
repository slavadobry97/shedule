import { redirect } from "next/navigation";

/**
 * Витрина дизайн-системы переехала в /dashboard (раздел «Дизайн-система»,
 * ?tab=design) — одна служебная зона вместо отдельных страниц.
 */
export default function DesignPage() {
    redirect("/dashboard?tab=design");
}
