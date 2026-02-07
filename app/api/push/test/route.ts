import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { getAllSubscriptions } from '@/lib/push-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Настраиваем VAPID
        webpush.setVapidDetails(
            'mailto:test@example.com',
            process.env.VAPID_PUBLIC_KEY!,
            process.env.VAPID_PRIVATE_KEY!
        );

        // Получаем все подписки
        const subscriptions = await getAllSubscriptions();

        if (subscriptions.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No subscriptions found'
            });
        }

        // Формируем тестовое уведомление
        const payload = JSON.stringify({
            title: '🔔 Тестовое уведомление',
            body: 'Если вы видите это — push-уведомления работают!',
            icon: '/favicon.png',
            badge: '/favicon.png',
            tag: 'test-notification',
            data: {
                url: '/',
                test: true
            }
        });

        // Отправляем всем подписчикам
        let sent = 0;
        let errors: string[] = [];

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(sub.subscription, payload);
                sent++;
                console.log(`[Test Push] Sent to ${sub.subscription.endpoint.slice(-20)}`);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[Test Push] Failed:`, errorMessage);
                errors.push(errorMessage);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Test notifications sent`,
            total: subscriptions.length,
            sent,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('[Test Push] Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
