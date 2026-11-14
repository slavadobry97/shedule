/**
 * Провайдер ИИ для чата отладки.
 *
 * Почему не Gemini: Google AI Studio и Gemini API официально недоступны
 * в Беларуси (нет в списке поддерживаемых стран), поэтому привязка к нему
 * означала бы, что чат не работает у половины пользователей проекта.
 *
 * Почему OpenAI-совместимый API: один и тот же формат запросов у OpenRouter,
 * Groq, Mistral и opencode.ai/inference — переключение провайдера сводится
 * к правке .env, а не к правке кода.
 *
 * Настройка (в .env):
 *   AI_PROVIDER=openrouter
 *   OPENROUTER_API_KEY=sk-or-v1-...
 *   AI_MODEL=cohere/north-mini-code:free
 *   AI_ALLOWED_MODELS=openrouter/model-a:free,openrouter/model-b:free
 *
 * AI_MODEL — модель по умолчанию, AI_ALLOWED_MODELS — белый список того,
 * что человек может выбрать в чате. Ключи и адреса живут только здесь:
 * клиент присылает лишь идентификатор провайдера и модели, и оба
 * проверяются по этому списку.
 */

export type AiProvider = "openrouter" | "groq" | "opencode" | "custom";

export interface ProviderConfig {
    /** Базовый URL OpenAI-совместимого API */
    baseUrl: string;
    /** Ключ из окружения */
    apiKey: string;
    /** Модель */
    model: string;
    /** Название провайдера для человека */
    label: string;
    /**
     * Потолок токенов на внутренние рассуждения модели.
     *
     * У бесплатных моделей OpenRouter почти все — reasoning: они тратят
     * заметную часть ответа на «размышление», и на сложном вопросе лимит
     * уходит целиком, а текст приходит пустым. null — провайдер такого
     * параметра не знает, не отправляем.
     */
    reasoningCapTokens: number | null;
}

/** Пресеты провайдеров: ключ берётся из своей переменной окружения */
const PROVIDERS: Record<
    Exclude<AiProvider, "custom">,
    {
        baseUrl: string;
        envKey: string;
        defaultModel: string;
        label: string;
        reasoningCapTokens: number | null;
    }
> = {
    openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        envKey: "OPENROUTER_API_KEY",
        // Проверено на реальном объёме (промпт ~7.5K токенов, 205 конфликтов):
        // стабильно доходит до ответа, тратя ~300 токенов на рассуждения.
        // cohere/north-mini-code:free на большом промпте уходил в размышления
        // целиком и возвращал пустой ответ.
        defaultModel: "dots-studio/dots-3-note-preview:free",
        label: "OpenRouter",
        // Бюджет на «размышления»: 1024 хватает, остальное остаётся на ответ
        reasoningCapTokens: 1024,
    },
    groq: {
        baseUrl: "https://api.groq.com/openai/v1",
        envKey: "GROQ_API_KEY",
        defaultModel: "meta-llama/llama-3.3-70b-versatile",
        label: "Groq",
        reasoningCapTokens: null,
    },
    opencode: {
        baseUrl: "https://opencode.ai/inference/openai/v1",
        envKey: "OPENCODE_API_KEY",
        defaultModel: "glm-5.3-flash-free",
        label: "OpenCode",
        reasoningCapTokens: null,
    },
};

/** Что человек выбрал в чате: только идентификаторы, без ключей и адресов */
export interface AiModelSelection {
    provider: AiProvider;
    model: string;
}

/** Пункт выпадающего списка моделей */
export interface AiModelOption extends AiModelSelection {
    /** Короткое имя модели для человека */
    label: string;
    /** Название провайдера для подписи */
    providerLabel: string;
}

export type ProviderResolution =
    | { ok: true; config: ProviderConfig }
    | { ok: false; code: "not_configured" | "model_unavailable" };

function isKnownProvider(value: string): value is AiProvider {
    return value === "custom" || Object.prototype.hasOwnProperty.call(PROVIDERS, value);
}

/** «dots-studio/dots-3-note-preview:free» → «dots-3-note-preview» */
function shortModelName(model: string): string {
    return model.split("/").pop()?.replace(/:free$/, "") || model;
}

/** Модель и провайдер по умолчанию — из .env */
export function getDefaultSelection(): AiModelSelection {
    const provider = (process.env.AI_PROVIDER ?? "openrouter").toLowerCase();
    const safeProvider = isKnownProvider(provider) ? provider : "openrouter";

    if (safeProvider === "custom") {
        return { provider: "custom", model: process.env.AI_MODEL || "gpt-4o-mini" };
    }

    return {
        provider: safeProvider,
        model: process.env.AI_MODEL || PROVIDERS[safeProvider].defaultModel,
    };
}

/**
 * Что можно выбрать в чате.
 *
 * Первым всегда идёт значение по умолчанию: если белый список не задан,
 * список состоит из одной модели и переключатель в интерфейсе не показывается.
 * Провайдер без ключа в окружении в список не попадает.
 */
export function getModelOptions(): AiModelOption[] {
    const options: AiModelOption[] = [];
    const seen = new Set<string>();

    const push = (provider: AiProvider, model: string) => {
        const key = `${provider}/${model}`;
        if (seen.has(key)) return;

        if (provider === "custom") {
            if (!process.env.AI_BASE_URL || !process.env.AI_API_KEY) return;
        } else if (!process.env[PROVIDERS[provider].envKey]) {
            return;
        }

        seen.add(key);
        options.push({
            provider,
            model,
            label: shortModelName(model),
            providerLabel: provider === "custom" ? "Свой провайдер" : PROVIDERS[provider].label,
        });
    };

    const defaults = getDefaultSelection();
    push(defaults.provider, defaults.model);

    const raw = process.env.AI_ALLOWED_MODELS?.trim();
    if (!raw) return options;

    for (const entry of raw.split(",")) {
        const value = entry.trim();
        if (!value) continue;

        // Формат «провайдер/модель»: делим по первому слэшу, потому что
        // в идентификаторе модели слэши тоже встречаются.
        const slash = value.indexOf("/");
        if (slash <= 0) continue;

        const provider = value.slice(0, slash).toLowerCase();
        const model = value.slice(slash + 1);
        if (!model || !isKnownProvider(provider)) continue;

        push(provider, model);
    }

    return options;
}

/** Разрешена ли модель: значение по умолчанию или пункт белого списка */
function isModelAllowed(provider: AiProvider, model: string): boolean {
    const defaults = getDefaultSelection();
    if (provider === defaults.provider && model === defaults.model) return true;

    return getModelOptions().some(
        (option) => option.provider === provider && option.model === model
    );
}

/**
 * Конфигурация провайдера для выбранной модели.
 *
 * Если выбор не передан — берётся пара из .env. Провайдер обязан быть
 * известным пресетом, модель — из белого списка. Клиент не может
 * подставить ни адрес, ни ключ.
 */
export function resolveProvider(selection?: AiModelSelection | null): ProviderResolution {
    const target = selection ?? getDefaultSelection();
    const provider = target.provider.toLowerCase();

    if (!isKnownProvider(provider)) {
        return { ok: false, code: "model_unavailable" };
    }

    if (provider === "custom") {
        const baseUrl = process.env.AI_BASE_URL;
        const apiKey = process.env.AI_API_KEY;
        if (!baseUrl || !apiKey) return { ok: false, code: "not_configured" };

        // Даже у своего провайдера модель должна быть из белого списка:
        // иначе через чат можно запросить что угодно на этом эндпоинте.
        if (!isModelAllowed("custom", target.model)) {
            return { ok: false, code: "model_unavailable" };
        }

        return {
            ok: true,
            config: {
                baseUrl: baseUrl.replace(/\/+$/, ""),
                apiKey,
                model: target.model || process.env.AI_MODEL || "gpt-4o-mini",
                label: "Свой провайдер",
                // Для своего провайдера параметр незнакомый — не отправляем
                reasoningCapTokens: null,
            },
        };
    }

    const preset = PROVIDERS[provider];
    const apiKey = process.env[preset.envKey];
    if (!apiKey) return { ok: false, code: "not_configured" };

    if (!isModelAllowed(provider, target.model)) {
        return { ok: false, code: "model_unavailable" };
    }

    return {
        ok: true,
        config: {
            baseUrl: preset.baseUrl,
            apiKey,
            model: target.model,
            label: preset.label,
            reasoningCapTokens: preset.reasoningCapTokens,
        },
    };
}

/** Текущая конфигурация провайдера из окружения */
export function getProviderConfig(): ProviderConfig | null {
    const resolution = resolveProvider();
    return resolution.ok ? resolution.config : null;
}

/** Настроен ли провайдер: есть ключ и модель */
export function isProviderConfigured(): boolean {
    return getProviderConfig() !== null;
}

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface ChatResult {
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

/**
 * Запас токенов на ответ.
 *
 * Reasoning-модели сначала «размышляют» и тратят токены на это. При малом
 * лимите текст ответа не появляется вовсе: приходит finish_reason=length
 * с content=null. На реальном вопросе про расписание 4096 токенов целиком
 * ушли на рассуждения, поэтому запас по умолчанию — 8192.
 *
 * Переопределяется через AI_MAX_TOKENS: у разных провайдеров свои потолки,
 * и упереться в чужой лимит хуже, чем получить пустой ответ.
 */
const MAX_TOKENS = Number(process.env.AI_MAX_TOKENS) || 8192;

/**
 * Один запрос к модели в формате OpenAI Chat Completions.
 *
 * Возвращает текст ответа. Если модель не успела — выбрасывает ошибку
 * с понятным объяснением, а не пустую строку.
 */
export async function chat(
    config: ProviderConfig,
    messages: ChatMessage[]
): Promise<ChatResult> {
    const requestBody: Record<string, unknown> = {
        model: config.model,
        messages,
        max_tokens: MAX_TOKENS,
    };

    // Бюджет на «размышления». Без него reasoning-модель на сложном вопросе
    // тратит весь max_tokens на рассуждения и возвращает пустой текст.
    if (config.reasoningCapTokens) {
        requestBody.reasoning = { max_tokens: config.reasoningCapTokens };
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
            // OpenRouter просит указать источник запроса — без этого он
            // отклоняет запросы от неизвестных клиентов.
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            "X-Title": "RGSU Schedule Debug",
        },
        body: JSON.stringify(requestBody),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            body?.error?.message || body?.message || `HTTP ${response.status}`;

        const error = new Error(message) as Error & { status?: number };
        error.status = response.status;
        throw error;
    }

    const choice = body?.choices?.[0];
    const content: string = choice?.message?.content ?? "";

    // Модель не успела дописать ответ: у reasoning-моделей весь лимит
    // мог уйти на «размышление».
    if (!content.trim()) {
        const finishReason = choice?.finish_reason;

        if (finishReason === "length") {
            throw new Error(
                "Модель не успела закончить ответ: лимит токенов ушёл на внутренние рассуждения. Увеличьте AI_MAX_TOKENS в .env или возьмите модель без reasoning."
            );
        }

        throw new Error("Модель вернула пустой ответ. Попробуйте переформулировать вопрос.");
    }

    return {
        content,
        usage: {
            promptTokens: body?.usage?.prompt_tokens ?? 0,
            completionTokens: body?.usage?.completion_tokens ?? 0,
            totalTokens: body?.usage?.total_tokens ?? 0,
        },
    };
}

/**
 * Состояние провайдера: работает ли он и какое у модели контекстное окно.
 *
 * Доступность нужна, чтобы страница сразу сказала «ИИ не работает», а не
 * заставляла человека писать вопрос и читать ошибку. Размер контекста нужен
 * для шапки чата: раньше там стояла константа 1M от Gemini, и после смены
 * провайдера она стала врать. Результат кэшируется на 10 минут — проверка
 * не должна сама стать источником запросов.
 */
export interface ProviderStatus {
    available: boolean;
    /** Размер контекстного окна модели. null — провайдер его не сообщает */
    contextLength: number | null;
}

/**
 * Кэш по паре «провайдер + модель»: один слот на всё приложение врал бы
 * после переключения модели — шапка показывала бы чужое контекстное окно.
 */
const statusCache = new Map<string, { status: ProviderStatus; checkedAt: number }>();
const CHECK_TTL = 10 * 60 * 1000;

export async function getProviderStatus(config: ProviderConfig): Promise<ProviderStatus> {
    const cacheKey = `${config.baseUrl}|${config.model}`;
    const cached = statusCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.checkedAt < CHECK_TTL) {
        return cached.status;
    }

    let status: ProviderStatus;

    try {
        const response = await fetch(`${config.baseUrl}/models`, {
            headers: { Authorization: `Bearer ${config.apiKey}` },
        });

        if (!response.ok) {
            status = { available: false, contextLength: null };
        } else {
            const body = await response.json().catch(() => null);
            const models: Array<{
                id?: string;
                context_length?: number;
                context_window?: number;
            }> = body?.data ?? [];

            const current = models.find((model) => model.id === config.model);

            status = {
                available: true,
                // OpenRouter сообщает context_length, Groq — context_window.
                contextLength: current?.context_length ?? current?.context_window ?? null,
            };
        }
    } catch {
        // Сеть недоступна — не считаем провайдера сломанным
        status = { available: true, contextLength: null };
    }

    statusCache.set(cacheKey, { status, checkedAt: now });
    return status;
}
