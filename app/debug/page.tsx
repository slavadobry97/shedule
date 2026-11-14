import { redirect } from "next/navigation";

/**
 * Служебная зона переехала на /dashboard — одна страница вместо двух
 * (вкладки «Сводка / Проверки / …»). Старые ссылки и закладки ведут
 * на вкладку «Проверки».
 */
export default function DebugPage() {
    redirect("/dashboard?tab=checks");
}
