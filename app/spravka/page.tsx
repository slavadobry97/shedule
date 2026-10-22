import { permanentRedirect } from "next/navigation";
import { EXTERNAL_LINKS } from "@/lib/constants";

/**
 * Заказ справок и документов переехал в отдельный сервис — spravka.rgsu.by.
 * Старые ссылки и закладки на /spravka продолжают работать через редирект.
 */
export default function SpravkaPage() {
  permanentRedirect(EXTERNAL_LINKS.SPRAVKA);
}
