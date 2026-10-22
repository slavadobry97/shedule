import { createHash } from "crypto";
import { loadSchedule } from "./loadSchedule";
import type { ScheduleItem } from "@/types/schedule";

/** Сколько живёт запись в кэше */
const TTL_MS = 60_000;

export interface ScheduleCacheEntry {
    /** Данные расписания */
    data: ScheduleItem[];
    /** Сериализованное тело ответа — чтобы не собирать его заново */
    body: string;
    /** ETag тела */
    etag: string;
    /** Момент получения данных */
    fetchedAt: number;
}

let entry: ScheduleCacheEntry | null = null;
let inflight: Promise<ScheduleCacheEntry> | null = null;

const buildEntry = (data: ScheduleItem[]): ScheduleCacheEntry => {
    const body = JSON.stringify(data);
    const etag = `"${createHash("sha1").update(body).digest("base64")}"`;

    return { data, body, etag, fetchedAt: Date.now() };
};

/**
 * Кэш расписания на стороне сервера.
 *
 * Зачем: без кэша каждый запрос /api/schedule уходил в Google Sheets API
 * (квота 60 запросов в минуту на проект) и отдавал ~3 МБ. Теперь данные
 * берутся из памяти не чаще раза в TTL, а пачка параллельных запросов
 * сваливается в один вызов Sheets API.
 */
export async function getSchedule(): Promise<ScheduleCacheEntry> {
    const now = Date.now();

    if (entry && now - entry.fetchedAt < TTL_MS) {
        return entry;
    }

    // Параллельные запросы не должны дёргать Sheets API каждый по отдельности
    if (!inflight) {
        inflight = loadSchedule()
            .then((data) => {
                entry = buildEntry(data);
                return entry;
            })
            .finally(() => {
                inflight = null;
            });
    }

    return inflight;
}

/** Текущая запись кэша, если она ещё актуальна */
export function getFreshEntry(): ScheduleCacheEntry | null {
    if (entry && Date.now() - entry.fetchedAt < TTL_MS) {
        return entry;
    }

    return null;
}
