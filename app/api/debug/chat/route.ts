import { NextResponse } from "next/server";
import { isDebugAuthorized } from "@/lib/debug-auth";
import { getDebugAiUsage, incrementDebugAiUsage } from "@/lib/debug-ai-limit";
import { classifyAiError } from "@/lib/debug-ai-errors";
import {
    chat,
    getDefaultSelection,
    getModelOptions,
    getProviderStatus,
    resolveProvider,
    type AiModelSelection,
    type ChatMessage,
} from "@/lib/debug-ai-provider";
import { ScheduleAnalysis } from "@/types/debug";

/**
 * Состояние дневного лимита и готовность ИИ — для панели в чате.
 *
 * Клиенту нужно знать заранее, работает ли ИИ: иначе человек пишет вопрос
 * и вместо ответа получает ошибку.
 */
/** Вкладки /debug, по которым строится контекст ответа. */
const TAB_LABELS: Record<string, string> = {
    checks: "Проверки",
    overview: "Обзор",
    records: "Записи",
    journal: "Журнал",
    history: "История",
};

/** Выбор модели из строки запроса. Неполная пара считается отсутствующей. */
function readSelection(url: URL): AiModelSelection | null {
    const provider = url.searchParams.get("provider");
    const model = url.searchParams.get("model");

    if (!provider || !model) return null;

    return { provider: provider as AiModelSelection["provider"], model };
}

export async function GET(req: Request) {
    if (!(await isDebugAuthorized())) {
        return NextResponse.json({ error: "Отладка закрыта" }, { status: 401 });
    }

    const usage = await getDebugAiUsage();
    const defaults = getDefaultSelection();
    const selection = readSelection(new URL(req.url));
    const resolved = resolveProvider(selection);

    // Модель без ключа или вне белого списка: чат показывает баннер,
    // а список моделей всё равно отдаём — человек сможет переключиться.
    const status = resolved.ok
        ? await getProviderStatus(resolved.config)
        : { available: false, contextLength: null };

    return NextResponse.json({
        ...usage,
        available: status.available,
        // Размер контекстного окна модели — для шапки чата
        contextLength: status.contextLength,
        limitReached: usage.count >= usage.limit,
        defaultProvider: defaults.provider,
        defaultModel: defaults.model,
        models: getModelOptions(),
    });
}

export async function POST(req: Request) {
    // Отладка защищена паролем. В проде без DEBUG_PASSWORD закрыто полностью,
    // в dev — открыто (см. lib/debug-auth.ts).
    if (!(await isDebugAuthorized())) {
        return NextResponse.json({ error: "Отладка закрыта" }, { status: 401 });
    }

    // Выбор приходит от клиента только идентификаторами. Адрес и ключ
    // берутся из окружения, а модель проверяется по белому списку —
    // иначе через чат можно было бы запросить любую модель аккаунта.
    const body = await req.json().catch(() => null);
    const providerId = typeof body?.provider === "string" ? body.provider : null;
    const modelId = typeof body?.model === "string" ? body.model : null;
    const selection: AiModelSelection | null =
        providerId && modelId ? { provider: providerId as AiModelSelection["provider"], model: modelId } : null;

    const resolved = resolveProvider(selection);

    if (!resolved.ok) {
        const notConfigured = resolved.code === "not_configured";

        return NextResponse.json(
            {
                error: notConfigured
                    ? "Ключ ИИ не задан. Добавьте ключ провайдера в .env."
                    : "Модель недоступна. Выберите другую в списке.",
                code: resolved.code,
            },
            { status: notConfigured ? 503 : 400 }
        );
    }

    const provider = resolved.config;

    // Дневной лимит запросов считается на сервере: клиентский счётчик
    // в localStorage обходился удалением хранилища.
    //
    // Проверяем лимит ДО увеличения: иначе запрос, который упрётся в
    // лимит, сам же его и расходует, и счётчик растёт без пользы.
    const current = await getDebugAiUsage();
    if (current.count >= current.limit) {
        return NextResponse.json(
            {
                error: `Дневной лимит запросов исчерпан (${current.limit})`,
                code: "limit_exceeded",
            },
            { status: 429 }
        );
    }

    try {
        const { messages, context } = body ?? {};
        const analysis = context as ScheduleAnalysis | null | undefined;

        // Вкладка приходит только идентификатором. Неизвестное значение
        // не ломает запрос — считаем, что открыты «Проверки».
        const requestedTab = typeof body?.activeTab === "string" ? body.activeTab : "checks";
        const activeTab = Object.prototype.hasOwnProperty.call(TAB_LABELS, requestedTab)
            ? requestedTab
            : "checks";
        const activeTabLabel = TAB_LABELS[activeTab];
        // Журнал и историю модель не получает: не позволяем ей выдумывать
        // записи, которых нет в контексте.
        const tabNote =
            activeTab === "journal" || activeTab === "history"
                ? "Содержимое этой вкладки тебе недоступно. Не выдумывай записи журнала или историю версий; отвечай только по данным расписания."
                : "";

        // Формируем системный промпт с контекстом.
        // Списки собираем отдельно: вложенные шаблонные строки внутри ${}
        // нечитаемы и легко ломают парсер.
        const checksList =
            analysis?.checks?.length
                ? analysis.checks
                      .map(
                          (check) =>
                              `- [${check.severity === "critical" ? "КРИТИЧНО" : "ВНИМАНИЕ"}] ${check.id}: ${check.count}`
                      )
                      .join("\n")
                : "Проверки не выполнялись";

        const workloadList = analysis?.teacherWorkload?.length
            ? analysis.teacherWorkload.map(([teacher, count]) => `- ${teacher}: ${count} пар`).join("\n")
            : "Нет данных";

        const gapsList = analysis?.gaps?.length
            ? analysis.gaps
                  .map((gap) => `- Группа ${gap.group} (${gap.date}): окно на ${gap.gapTime}`)
                  .join("\n")
            : "Окон не обнаружено";

        const invisibleList = analysis?.invisibleRecords?.length
            ? analysis.invisibleRecords
                  .map(
                      (record) =>
                          `- #${record.index} Группа ${record.item.group}: ${record.reasons.join(", ")}`
                  )
                  .join("\n")
            : "Критических ошибок в данных не обнаружено.";

        const classroomConflictsList = analysis?.classroomConflicts?.length
            ? analysis.classroomConflicts
                  .map(
                      (conflict) =>
                          `- ауд. ${conflict.classroom} ${conflict.date} ${conflict.time}: ${conflict.teachers.join(" / ")}`
                  )
                  .join("\n")
            : "";

        const teacherDoubleBookingsList = analysis?.teacherDoubleBookings?.length
            ? analysis.teacherDoubleBookings
                  .map(
                      (clash) =>
                          `- ${clash.teacher} ${clash.date} ${clash.time}: ${clash.rows.map((row) => `ауд. ${row.classroom} (${row.group})`).join(", ")}`
                  )
                  .join("\n")
            : "";

        const systemPrompt = `Ты — аналитик учебного расписания филиала РГСУ в Минске.

ТЕКУЩИЙ КОНТЕКСТ СИСТЕМЫ:
АКТИВНАЯ ВКЛАДКА: ${activeTabLabel}
${tabNote}

ОБЩИЕ ЦИФРЫ:
- Всего занятий: ${analysis?.total || 0}
- Групп: ${analysis?.groups || 0}
- Преподавателей: ${analysis?.teachers || 0}
- Провалено проверок: критичных — ${analysis?.criticalCount || 0}, предупреждений — ${analysis?.warningCount || 0}

РЕЗУЛЬТАТЫ ПРОВЕРОК:
${checksList}

НАГРУЗКА ПРЕПОДАВАТЕЛЕЙ (Топ-15):
${workloadList}

ОКНА В РАСПИСАНИИ ГРУПП:
- Всего окон во всей системе: ${analysis?.totalGaps || 0}
${gapsList}

КРИТИЧЕСКИЕ ОШИБКИ (записи не видны в календаре):
${invisibleList}
${classroomConflictsList ? `\nКОНФЛИКТЫ АУДИТОРИЙ (одна аудитория, разные преподаватели):\n${classroomConflictsList}` : ""}
${teacherDoubleBookingsList ? `\nПРЕПОДАВАТЕЛЬ В ДВУХ АУДИТОРИЯХ:\n${teacherDoubleBookingsList}` : ""}

ПРАВИЛА ОТВЕТА:
- Если есть критичные ошибки, ставь их первыми.
- Опирайся только на цифры из контекста выше. Если данных нет — скажи, каких именно не хватает, и не строй оценок.
- Сначала ответ, потом детали. Первый абзац отвечает на вопрос, а не пересказывает контекст.
- Не придумывай преподавателей, группы, аудитории и даты.
- Если спрашивают про окна — предлагай, какие занятия можно перенести, чтобы их сократить.
- Если у преподавателя аномально высокая нагрузка — скажи об этом прямо.
- Markdown: списки и таблицы — только когда сравниваешь три и больше объектов. Не дублируй таблицу текстом.
- Не длиннее 250 слов, если не просят подробнее.
- Без эмодзи и без вступлений вроде «Отличный вопрос».
- Отвечай по-русски.`;

        // История диалога: системный промпт идёт первым сообщением,
        // остальные — в порядке, как их прислал клиент.
        const history: ChatMessage[] = messages
            .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
            .map((m: { role: string; content: string }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            }));

        const chatMessages: ChatMessage[] = [
            { role: "system", content: systemPrompt },
            ...history,
        ];

        const result = await chat(provider, chatMessages);

        // Квота засчитывается только за состоявшийся ответ: неудачные
        // запросы (сломанный ключ, сетевая ошибка) не должны съедать лимит.
        const dailyUsage = await incrementDebugAiUsage();

        return NextResponse.json({
            content: result.content,
            dailyUsage,
            usage: {
                promptTokenCount: result.usage.promptTokens,
                candidatesTokenCount: result.usage.completionTokens,
                totalTokenCount: result.usage.totalTokens,
            },
        });
    } catch (error) {
        // Сырое исключение — только в лог: там URL, коды и JSON,
        // пользователю такое показывать незачем.
        console.error("AI API Error:", error);

        const aiError = classifyAiError(error);

        return NextResponse.json(
            { error: aiError.message, code: aiError.code },
            { status: aiError.status }
        );
    }
}
