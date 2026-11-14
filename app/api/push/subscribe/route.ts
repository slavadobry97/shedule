import { NextRequest, NextResponse } from 'next/server';
import {
    saveSubscription,
    removeSubscription,
    isValidPushEndpoint,
    isValidPushKeys,
    PushSubscription,
    SubscriptionRecord,
} from '@/utils/push-utils';

// POST: Подписка на уведомления
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { subscription, filters } = body as {
            subscription: PushSubscription;
            filters: SubscriptionRecord['filters'];
        };

        if (!subscription?.endpoint || !subscription?.keys) {
            return NextResponse.json(
                { error: 'Invalid subscription object' },
                { status: 400 }
            );
        }

        // Подписка без выбора группы/преподавателя — мёртвая запись: она никогда
        // не получит уведомлений (см. matchesFilters), но будет жить в Redis и
        // участвовать в каждой рассылке. Отклоняем вместо сохранения.
        if (!filters || (filters.groups?.length ?? 0) === 0 && (filters.teachers?.length ?? 0) === 0) {
            return NextResponse.json(
                { error: 'Укажите группу или преподавателя для подписки' },
                { status: 400 }
            );
        }

        // endpoint и ключи проверяются строго: сервер не должен отправлять
        // уведомления на произвольные адреса, подсунутые в подписке
        if (!isValidPushEndpoint(subscription.endpoint) || !isValidPushKeys(subscription.keys)) {
            return NextResponse.json(
                { error: 'Invalid subscription endpoint or keys' },
                { status: 400 }
            );
        }

        await saveSubscription(subscription, filters);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Subscribe error:', error);
        return NextResponse.json(
            { error: 'Failed to save subscription' },
            { status: 500 }
        );
    }
}

// DELETE: Отписка от уведомлений
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { endpoint } = body as { endpoint: string };

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Endpoint is required' },
                { status: 400 }
            );
        }

        await removeSubscription(endpoint);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        return NextResponse.json(
            { error: 'Failed to remove subscription' },
            { status: 500 }
        );
    }
}
