import { NextResponse } from "next/server";
import { getSchedule } from "@/utils/scheduleCache";

export const dynamic = "force-dynamic";

/**
 * GET /api/schedule/meta — списки групп и преподавателей.
 *
 * Нужны, когда само расписание приходит уже отфильтрованным по группе:
 * без отдельной ручки приветственный экран и выпадающие списки были бы пустыми.
 * Вес — несколько килобайт.
 */
export async function GET() {
  try {
    const { data } = await getSchedule();

    if (!data || data.length === 0) {
      return NextResponse.json({ groups: [], teachers: [] }, { status: 404 });
    }

    const groups = Array.from(new Set(data.map((item) => item.group))).sort((a, b) =>
      a.localeCompare(b, "ru", { numeric: true })
    );

    const teachers = Array.from(
      new Set(data.map((item) => item.teacher).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));

    return NextResponse.json(
      { groups, teachers },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
          "CDN-Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Ошибка загрузки метаданных расписания:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки расписания" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
