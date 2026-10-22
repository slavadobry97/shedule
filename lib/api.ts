import { ScheduleItem, ScheduleMeta } from "@/types/schedule";

/** Ошибка запроса к API: несёт HTTP-статус и текст, пришедший с сервера */
export class ApiError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

/**
 * Загрузчик расписания.
 *
 * Раньше он молча отдавал тело ответа даже при 4xx/5xx, поэтому ошибка
 * выглядела как «неожиданные данные», а её код и текст терялись.
 * Теперь не-2xx превращается в ApiError со статусом и сообщением сервера.
 */
/**
 * Загрузка списков групп и преподавателей.
 * Отдельная лёгкая ручка: расписание приходит уже отфильтрованным по группе,
 * а списки нужны всегда — для приветственного экрана и выпадающих меню.
 */
export const metaFetcher = async (url: string): Promise<ScheduleMeta> => {
    let response: Response;

    try {
        response = await fetch(url);
    } catch {
        throw new ApiError("Нет соединения");
    }

    if (!response.ok) {
        throw new ApiError(`Ошибка ${response.status}`, response.status);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.groups) || !Array.isArray(data.teachers)) {
        throw new ApiError("Сервер вернул некорректные метаданные");
    }

    return data as ScheduleMeta;
};

export const scheduleFetcher = async (url: string): Promise<ScheduleItem[]> => {
    let response: Response;

    try {
        response = await fetch(url);
    } catch {
        throw new ApiError("Сеть недоступна");
    }

    if (!response.ok) {
        let message = `Ошибка ${response.status}`;

        try {
            const body = await response.json();
            if (body && typeof body.error === "string") {
                message = body.error;
            }
        } catch {
            // тело не JSON — оставляем сообщение по умолчанию
        }

        throw new ApiError(message, response.status);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        throw new ApiError(
            (data && typeof data.error === "string" && data.error) ||
                "Сервер вернул ответ в неожиданном формате"
        );
    }

    return data as ScheduleItem[];
};
