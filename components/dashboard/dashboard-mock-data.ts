/**
 * Мок-данные операционной панели (прототип).
 *
 * Все числа — иллюстративные, как week-preview на /landing. Формы полей
 * совпадают с тем, что реально доступно сервису (снапшот Redis, checks,
 * подписки пуша, лимиты AI), чтобы после выбора варианта подключить
 * настоящие источники без переверстки.
 */

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export interface DashboardMock {
    updatedAt: string;
    version: string;
    uptime: string;
    cron: {
        status: Tone;
        lastRun: string;
        lastRunAgo: string;
        nextRunIn: string;
        rows: number;
        changes: { added: number; removed: number; modified: number };
    };
    sheets: {
        status: Tone;
        quotaUsed: number;
        quotaLimit: number;
        badDates: number;
        outOfSlot: number;
        lastSync: string;
    };
    push: {
        status: Tone;
        subscriptions: number;
        dead: number;
        deliveryErrors: number;
        lastDelivery: string;
    };
    ai: {
        status: Tone;
        usedToday: number;
        limit: number;
        provider: string;
        model: string;
    };
    events: Array<{
        time: string;
        tone: Tone;
        icon: "cron" | "changes" | "push" | "ai" | "auth";
        text: string;
    }>;
}

export const MOCK_DASHBOARD: DashboardMock = {
    updatedAt: "14:07:32",
    version: "0.1.9",
    uptime: "3 д 14 ч",
    cron: {
        status: "success",
        lastRun: "14:05:12",
        lastRunAgo: "2 мин назад",
        nextRunIn: "через 3 мин",
        rows: 12371,
        changes: { added: 3, removed: 1, modified: 2 },
    },
    sheets: {
        status: "warning",
        quotaUsed: 43,
        quotaLimit: 60,
        badDates: 2,
        outOfSlot: 1,
        lastSync: "14:05:14",
    },
    push: {
        status: "warning",
        subscriptions: 8,
        dead: 1,
        deliveryErrors: 1,
        lastDelivery: "14:02:44",
    },
    ai: {
        status: "success",
        usedToday: 37,
        limit: 250,
        provider: "OpenRouter",
        model: "gpt-4o-mini",
    },
    events: [
        { time: "14:05:12", tone: "success", icon: "cron", text: "Крон: снапшот обновлён, 12 371 запись, изменений нет" },
        { time: "14:02:44", tone: "danger", icon: "push", text: "Пуш: ошибка доставки — подписка fcm…9f21 вернула 410 Gone" },
        { time: "13:57:03", tone: "info", icon: "changes", text: "Расписание: +3 добавлены, −1 удалена, 2 изменены (ИТ-21-2)" },
        { time: "13:55:41", tone: "neutral", icon: "ai", text: "AI-чат: запрос, модель gpt-4o-mini, 37/250 за сутки" },
        { time: "13:50:19", tone: "neutral", icon: "auth", text: "Debug: вход выполнен (cookie на 24 ч)" },
        { time: "13:45:00", tone: "success", icon: "cron", text: "Крон: снапшот обновлён, изменений нет" },
    ],
};
