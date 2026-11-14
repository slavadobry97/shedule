/**
 * Ошибки ИИ-чата отладки: как их показывать человеку.
 *
 * Провайдер отдаёт исключение строкой вроде:
 *   "Provider returned error" или "No auth credentials found"
 *
 * Пользователю такая строка ничего не объясняет — там коды и служебные
 * слова. Поэтому ошибку переводим в короткий понятный текст, а исходник
 * оставляем в серверном логе.
 */

export type AiErrorCode =
    | "not_configured"
    | "invalid_key"
    | "quota_exceeded"
    | "limit_exceeded"
    | "blocked"
    | "empty_response"
    | "model_unavailable"
    | "upstream";

export interface AiError {
    code: AiErrorCode;
    /** Текст для человека: что произошло и что делать */
    message: string;
    /** HTTP-статус ответа API */
    status: number;
}

/**
 * Разбирает исключение провайдера в понятную человеку ошибку.
 *
 * Порядок важен: сначала частные случаи, потом общий «upstream».
 */
export function classifyAiError(error: unknown): AiError {
    const raw = error instanceof Error ? error.message : String(error);
    const text = raw.toLowerCase();

    // Ключ не задан в окружении — проверяется до вызова, но на всякий случай
    if (text.includes("no auth credentials") || text.includes("api key not configured")) {
        return {
            code: "not_configured",
            message: "Ключ ИИ не задан. Добавьте ключ провайдера в .env.",
            status: 503,
        };
    }

    // Ключ неверный или отозван
    if (
        text.includes("invalid api key") ||
        text.includes("api key not valid") ||
        text.includes("api_key_invalid") ||
        text.includes("unauthorized") ||
        text.includes("401")
    ) {
        return {
            code: "invalid_key",
            message: "Ключ ИИ не принят. Проверьте ключ провайдера в .env.",
            status: 502,
        };
    }

    // Исчерпана квота у провайдера (не наш дневной лимит)
    if (
        text.includes("quota exceeded") ||
        text.includes("resource_exhausted") ||
        text.includes("rate limit") ||
        text.includes("429")
    ) {
        return {
            code: "quota_exceeded",
            message: "Закончились бесплатные запросы у провайдера. Попробуйте позже или выберите другую модель.",
            status: 429,
        };
    }

    // Модель недоступна: ушла из бесплатной фазы или её сняли
    if (text.includes("model not found") || text.includes("no endpoints found") || text.includes("404")) {
        return {
            code: "model_unavailable",
            message: "Модель недоступна: её сняли или переименовали. Выберите другую в списке.",
            status: 502,
        };
    }

    // Ответ заблокирован фильтром безопасности
    if (text.includes("blocked") || text.includes("safety") || text.includes("recitation")) {
        return {
            code: "blocked",
            message: "Запрос заблокирован фильтром безопасности. Переформулируйте его.",
            status: 422,
        };
    }

    // Модель не успела закончить: у reasoning-моделей лимит уходит на размышления.
    // Текст исключения содержит AI_MAX_TOKENS и служебные детали — человеку
    // он не нужен, но причина и действие должны остаться.
    if (text.includes("не успела закончить") || text.includes("пустой ответ")) {
        return {
            code: "empty_response",
            message: "Модель не успела ответить: лимит токенов ушёл на рассуждения. Повторите вопрос или выберите другую модель.",
            status: 502,
        };
    }

    return {
        code: "upstream",
        message: "Сервис ИИ не отвечает. Повторите попытку через минуту.",
        status: 502,
    };
}
