import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Используем самую продвинутую стабильную модель для анализа данных
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(req: Request) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY не настроен в .env файле" },
            { status: 500 }
        );
    }

    try {
        const { messages, context } = await req.json();

        // Формируем системный промпт с контекстом
        const systemPrompt = `Ты — экспертный ИИ-аналитик и оптимизатор учебного расписания по имени Игорь 2.0.
Твоя цель: не просто находить ошибки, но и помогать оптимизировать учебный процесс.

ТЕКУЩИЙ КОНТЕКСТ СИСТЕМЫ:
📊 ОБЩИЕ ЦИФРЫ:
- Всего занятий: ${context?.total || 0}
- Групп: ${context?.groups || 0}
- Преподавателей: ${context?.teachers || 0}
- Критических ошибок: ${context?.invisibleRecords?.length || 0}

🎓 НАГРУЗКА ПРЕПОДАВАТЕЛЕЙ (Топ-15):
${context?.teacherWorkload ? context.teacherWorkload.map((t: any) => `- ${t[0]}: ${t[1]} пар`).join("\n") : "Нет данных"}

🪟 ОКНА В РАСПИСАНИИ ГРУПП:
- Всего окон во всей системе: ${context?.totalGaps || 0}
${context?.gaps ? `ПРИМЕРЫ ОКОН:
${context.gaps.map((g: any) => `- Группа ${g.group} (${g.date}): окно на ${g.gapTime}`).join("\n")}` : "Окон не обнаружено"}

${context?.hasInvisibleRecords ? `❌ КРИТИЧЕСКИЕ ОШИБКИ:
${context.invisibleRecords.map((r: any) => `- #${r.index} Группа ${r.item.group}: ${r.reasons.join(", ")}`).join("\n")}` : "✅ Критических ошибок в данных не обнаружено."}

ТВОИ ЗАДАЧИ:
1. АНАЛИЗ ОШИБОК: Если есть критические ошибки, всегда ставь их в приоритет.
2. ОПТИМИЗАЦИЯ ОКОН: Если пользователь спрашивает об оптимизации или "окнах", анализируй данные выше. Предлагай, как можно переместить занятия, чтобы сократить разрывы у студентов.
3. НАГРУЗКА ПРЕПОДАВАТЕЛЕЙ: Если кто-то из преподавателей имеет аномально высокую нагрузку, указывай на это.
4. СТИЛЬ: Отвечай вежливо, профессионально, профессиональным языком диспетчера расписания. Используй Markdown.`;

        // Подготовка истории для Gemini
        const chat = model.startChat({
            history: messages.slice(0, -1).map((m: any) => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.content }],
            })),
            generationConfig: {
                maxOutputTokens: 2048,
            },
        });

        const lastMessage = messages[messages.length - 1].content;

        // Добавляем системный контекст к первому сообщению или в начало диалога
        const promptWithContext = messages.length <= 1
            ? `${systemPrompt}\n\nВопрос пользователя: ${lastMessage}`
            : lastMessage;

        const result = await chat.sendMessage(promptWithContext);
        const response = await result.response;
        const text = response.text();
        const usage = response.usageMetadata;

        return NextResponse.json({
            content: text,
            usage: {
                promptTokenCount: usage?.promptTokenCount || 0,
                candidatesTokenCount: usage?.candidatesTokenCount || 0,
                totalTokenCount: usage?.totalTokenCount || 0
            }
        });
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: "Ошибка при обращении к ИИ: " + error.message },
            { status: 500 }
        );
    }
}
