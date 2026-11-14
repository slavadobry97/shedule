import webPush from 'web-push';
import { Redis } from '@upstash/redis';
import { ScheduleItem } from '@/types/schedule';

// Инициализация Redis
export const redis = new Redis({
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Конфигурация Web Push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(
        'mailto:admin@rgsu.by', // Замените на реальный email
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// --- Types ---

export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export interface SubscriptionRecord {
    subscription: PushSubscription;
    filters: {
        groups: string[];    // Группы для отслеживания
        teachers: string[];  // Преподаватели для отслеживания
    };
    createdAt: number;
    lastNotified?: number;
}

export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: {
        url?: string;
        changes?: {
            added: number;
            removed: number;
            modified: number;
        };
    };
}

// --- Redis Keys ---

const KEYS = {
    SUBSCRIPTIONS: 'push:subscriptions',
    SCHEDULE_SNAPSHOT: 'push:schedule_snapshot',
    LAST_CHECK: 'push:last_check',
} as const;

// --- Subscription Management ---

/**
 * Сохраняет подписку пользователя
 */
export async function saveSubscription(
    subscription: PushSubscription,
    filters: SubscriptionRecord['filters']
): Promise<void> {
    const record: SubscriptionRecord = {
        subscription,
        filters,
        createdAt: Date.now(),
    };

    // Используем endpoint как уникальный ключ
    const key = Buffer.from(subscription.endpoint).toString('base64');
    await redis.hset(KEYS.SUBSCRIPTIONS, { [key]: JSON.stringify(record) });
}

/**
 * Удаляет подписку пользователя
 */
export async function removeSubscription(endpoint: string): Promise<void> {
    const key = Buffer.from(endpoint).toString('base64');
    await redis.hdel(KEYS.SUBSCRIPTIONS, key);
}

/**
 * Получает все подписки
 */
export async function getAllSubscriptions(): Promise<SubscriptionRecord[]> {
    const data = await redis.hgetall(KEYS.SUBSCRIPTIONS);
    if (!data) return [];

    return Object.values(data).map((value) => {
        if (typeof value === 'string') {
            return JSON.parse(value) as SubscriptionRecord;
        }
        return value as SubscriptionRecord;
    });
}

/**
 * Проверяет, подходит ли изменение под фильтры подписки
 */
export function matchesFilters(
    item: ScheduleItem,
    filters: SubscriptionRecord['filters']
): boolean {
    // Если фильтры пустые — подходит всё
    const hasGroupFilter = filters.groups.length > 0;
    const hasTeacherFilter = filters.teachers.length > 0;

    if (!hasGroupFilter && !hasTeacherFilter) {
        return false;
    }

    const groupMatch = hasGroupFilter && filters.groups.includes(item.group);
    const teacherMatch = hasTeacherFilter && filters.teachers.includes(item.teacher);

    return groupMatch || teacherMatch;
}

// --- Schedule Snapshot ---

/**
 * Сохраняет snapshot расписания
 */
export async function saveScheduleSnapshot(schedule: ScheduleItem[]): Promise<void> {
    await redis.set(KEYS.SCHEDULE_SNAPSHOT, JSON.stringify(schedule));
}

/**
 * Получает предыдущий snapshot расписания
 */
export async function getScheduleSnapshot(): Promise<ScheduleItem[] | null> {
    const data = await redis.get<string>(KEYS.SCHEDULE_SNAPSHOT);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
}

/**
 * Обновляет время последней проверки
 */
export async function updateLastCheck(): Promise<void> {
    await redis.set(KEYS.LAST_CHECK, Date.now());
}

// --- Push Sending ---

/**
 * Отправляет push-уведомление
 */
export async function sendPushNotification(
    subscription: PushSubscription,
    payload: PushPayload
): Promise<boolean> {
    try {
        await webPush.sendNotification(
            {
                endpoint: subscription.endpoint,
                keys: subscription.keys,
            },
            JSON.stringify(payload)
        );
        return true;
    } catch (error) {
        const err = error as { statusCode?: number };
        // 410 Gone или 404 — подписка больше не действительна
        if (err.statusCode === 410 || err.statusCode === 404) {
            await removeSubscription(subscription.endpoint);
        }
        console.error('Push notification failed:', error);
        return false;
    }
}

/**
 * Отправляет уведомления всем подходящим подписчикам
 */
export async function notifySubscribers(
    changedItems: ScheduleItem[],
    changeType: 'added' | 'removed' | 'modified',
    totalChanges: { added: number; removed: number; modified: number }
): Promise<number> {
    const subscriptions = await getAllSubscriptions();
    let sentCount = 0;

    for (const record of subscriptions) {
        // Проверяем, есть ли релевантные изменения для этого подписчика
        const relevantChanges = changedItems.filter((item) =>
            matchesFilters(item, record.filters)
        );

        if (relevantChanges.length === 0) continue;

        // Формируем сообщение
        const payload: PushPayload = {
            title: 'Расписание обновлено',
            body: formatNotificationBody(relevantChanges, changeType),
            icon: '/favicon.png',
            badge: '/favicon.png',
            tag: 'schedule-update',
            data: {
                url: '/',
                changes: totalChanges,
            },
        };

        const success = await sendPushNotification(record.subscription, payload);
        if (success) {
            sentCount++;
            // Обновляем время последнего уведомления
            record.lastNotified = Date.now();
            const key = Buffer.from(record.subscription.endpoint).toString('base64');
            await redis.hset(KEYS.SUBSCRIPTIONS, { [key]: JSON.stringify(record) });
        }
    }

    return sentCount;
}

/**
 * Форматирует текст уведомления
 */
function formatNotificationBody(
    items: ScheduleItem[],
    changeType: 'added' | 'removed' | 'modified'
): string {
    const typeText = {
        added: 'Добавлено',
        removed: 'Удалено',
        modified: 'Изменено',
    }[changeType];

    if (items.length === 1) {
        const item = items[0];
        return `${typeText}: ${item.subject} (${item.date}, ${item.time})`;
    }

    // Группируем по уникальным названиям предметов затронутых пар
    const subjectNames = [...new Set(items.map((i) => i.subject))];
    const details = subjectNames.slice(0, 3).join(', ');
    const moreCount = subjectNames.length > 3 ? ` и ещё ${subjectNames.length - 3}` : '';

    const groups = [...new Set(items.map((i) => i.group))];
    const groupSuffix = groups.length === 1 ? ` для ${groups[0]}` : '';

    return `${typeText}${groupSuffix}: ${details}${moreCount}`;
}
