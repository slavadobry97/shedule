import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSchedule } from "@/utils/scheduleCache";

// Динамический роут: ISR-кэш Next не даст проверить If-None-Match,
// а данные всё равно живут в своём кэше на 60 секунд.
export const dynamic = "force-dynamic";

// Кэш на 60 секунд в браузере и CDN, со stale-while-revalidate на 5 минут.
const CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";

/**
 * GET /api/schedule
 * GET /api/schedule?group=ЮСТ-Б-2-Д-2025-1
 * GET /api/schedule?teacher=Иванов
 *
 * Без параметров — всё расписание вуза (3,9 МБ). С параметрами — только строки
 * выбранной группы или преподавателя: студенту грузится его часть, а не весь вуз.
 *
 * Неделя на сервере НЕ фильтруется: строки, уехавшие из окна, выглядели бы
 * как удалённые и запускали бы уведомления об изменениях.
 */
export async function GET(request: Request) {
  try {
    const entry = await getSchedule();
    const { data } = entry;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Расписание не найдено." },
        { status: 404 }
      );
    }

    const params = new URL(request.url).searchParams;
    const group = params.get("group");
    const teacher = params.get("teacher");

    const byGroup = Boolean(group && group !== "all");
    const byTeacher = Boolean(teacher && teacher !== "all");

    const rows =
      byGroup || byTeacher
        ? data.filter(
            (item) =>
              (!byGroup || item.group === group) &&
              (!byTeacher || item.teacher === teacher)
          )
        : data;

    // Без фильтра тело уже собрано в кэше — не сериализуем 12 тысяч строк заново.
    const body = byGroup || byTeacher
      ? JSON.stringify(rows)
      : entry.body;
    const etag = byGroup || byTeacher
      ? `"${createHash("sha1").update(body).digest("base64")}"`
      : entry.etag;

    // Клиент уже держит эту версию — отдаём 304 без тела.
    // Ответ 3,9 МБ при этом не уходит по сети совсем.
    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": CACHE_CONTROL,
          "CDN-Cache-Control": CACHE_CONTROL,
        },
      });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ETag: etag,
        "Cache-Control": CACHE_CONTROL,
        "CDN-Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error("Ошибка загрузки расписания:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки расписания" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
