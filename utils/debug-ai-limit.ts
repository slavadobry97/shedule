import { Redis } from "@upstash/redis";

/**
 * Дневной лимит запросов к ИИ-чату отладки.
 *
 * Счётчик живёт на сервере: клиентский счётчик в localStorage обходился
 * удалением хранилища, поэтому трафик к Gemini-ключу ничем не ограничивался.
 *
 * Хранилище — Redis (он же используется для push-подписок). Если переменных
 * Redis в окружении нет, работает запасной счётчик в памяти процесса —
 * в serverless это счётётся в рамках одного инстанса, но лучше, чем ничего.
 *
 * Счётчик растёт только за состоявшиеся ответы: неудачные запросы
 * (сломанный ключ, сетевая ошибка) не должны съедать лимит.
 */

/** Общий дневной лимит на приложение */
export const DEBUG_AI_DAILY_LIMIT = 250;

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

let client: Redis | null = null;

function getRedis(): Redis | null {
    if (!REDIS_URL || !REDIS_TOKEN) return null;
    if (!client) {
        client = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
    }
    return client;
}

export interface DebugAiUsage {
    count: number;
    limit: number;
}

/** Запасной счётчик в памяти процесса */
const memory = new Map<string, { count: number; expiresAt: number }>();

/**
 * Ключ дня в UTC: лимит обнуляется в 00:00 UTC, то есть в 03:00 по Минску.
 * Это же время называет баннер в components/debug/ai-chat.tsx — менять вместе.
 */
function dayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

export async function getDebugAiUsage(): Promise<DebugAiUsage> {
    const key = `debug:ai:${dayKey()}`;
    const redis = getRedis();

    if (redis) {
        const count = (await redis.get<number>(key)) ?? 0;
        return { count, limit: DEBUG_AI_DAILY_LIMIT };
    }

    const entry = memory.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
        return { count: 0, limit: DEBUG_AI_DAILY_LIMIT };
    }

    return { count: entry.count, limit: DEBUG_AI_DAILY_LIMIT };
}

export async function incrementDebugAiUsage(): Promise<DebugAiUsage> {
    const key = `debug:ai:${dayKey()}`;
    const redis = getRedis();

    if (redis) {
        const count = await redis.incr(key);
        if (count === 1) {
            // TTL на двое суток, чтобы ключ сам протух
            await redis.expire(key, 60 * 60 * 48);
        }
        return { count, limit: DEBUG_AI_DAILY_LIMIT };
    }

    const entry = memory.get(key) ?? {
        count: 0,
        expiresAt: Date.now() + 1000 * 60 * 60 * 48,
    };
    entry.count += 1;
    memory.set(key, entry);

    return { count: entry.count, limit: DEBUG_AI_DAILY_LIMIT };
}
