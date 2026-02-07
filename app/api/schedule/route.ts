import { NextResponse } from "next/server";
import { loadSchedule } from "@/utils/loadSchedule";

export const revalidate = 60; // Данные будут обновляться каждые 60 секунд

// Обработчик GET-запросов
export async function GET() {
  try {
    const schedule = await loadSchedule();
    if (!schedule || schedule.length === 0) {
      return NextResponse.json(
        { error: "Расписание не найдено." },
        { status: 404 }
      );
    }
    return NextResponse.json(schedule, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "CDN-Cache-Control": "public, max-age=0",
        "Vercel-CDN-Cache-Control": "public, max-age=0",
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
