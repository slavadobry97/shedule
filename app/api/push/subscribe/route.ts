import { NextRequest, NextResponse } from 'next/server';
import {
    saveSubscription,
    removeSubscription,
    PushSubscription,
    SubscriptionRecord,
} from '@/lib/push-utils';

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

        await saveSubscription(subscription, filters || { groups: [], teachers: [] });

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
