import { NextResponse } from 'next/server';
import { loadSchedule } from '@/utils/loadSchedule';
import { compareScheduleData } from '@/lib/schedule-utils';
import {
    getScheduleSnapshot,
    saveScheduleSnapshot,
    updateLastCheck,
    notifySubscribers,
    getAllSubscriptions,
} from '@/lib/push-utils';

// Этот endpoint вызывается Vercel Cron каждые 5 минут
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Максимум 60 секунд для Hobby плана

export async function GET() {
    try {
        console.log('[Push Check] Starting schedule check...');

        // Получаем текущее расписание
        const currentSchedule = await loadSchedule();

        if (!currentSchedule || currentSchedule.length === 0) {
            console.log('[Push Check] No schedule data available');
            return NextResponse.json({
                success: false,
                message: 'No schedule data'
            });
        }

        // Получаем предыдущий snapshot
        const previousSchedule = await getScheduleSnapshot();

        // Если нет предыдущего snapshot — просто сохраняем текущий
        if (!previousSchedule) {
            console.log('[Push Check] No previous snapshot, saving current...');
            await saveScheduleSnapshot(currentSchedule);
            await updateLastCheck();
            return NextResponse.json({
                success: true,
                message: 'Initial snapshot saved',
                itemCount: currentSchedule.length
            });
        }

        // Сравниваем расписания
        const changes = compareScheduleData(previousSchedule, currentSchedule);
        const totalChanges = {
            added: changes.added.length,
            removed: changes.removed.length,
            modified: changes.modified.length,
        };
        const hasChanges = totalChanges.added > 0 || totalChanges.removed > 0 || totalChanges.modified > 0;

        if (!hasChanges) {
            console.log('[Push Check] No changes detected');
            await updateLastCheck();
            return NextResponse.json({
                success: true,
                message: 'No changes',
                itemCount: currentSchedule.length
            });
        }

        console.log(`[Push Check] Changes detected:`, totalChanges);

        // Получаем количество подписчиков
        const subscriptions = await getAllSubscriptions();
        console.log(`[Push Check] Active subscriptions: ${subscriptions.length}`);

        // Отправляем уведомления
        let sentCount = 0;

        if (changes.added.length > 0) {
            sentCount += await notifySubscribers(changes.added, 'added', totalChanges);
        }

        if (changes.removed.length > 0) {
            sentCount += await notifySubscribers(changes.removed, 'removed', totalChanges);
        }

        if (changes.modified.length > 0) {
            const modifiedItems = changes.modified.map(m => m.new);
            sentCount += await notifySubscribers(modifiedItems, 'modified', totalChanges);
        }

        // Сохраняем новый snapshot
        await saveScheduleSnapshot(currentSchedule);
        await updateLastCheck();

        console.log(`[Push Check] Notifications sent: ${sentCount}`);

        return NextResponse.json({
            success: true,
            changes: totalChanges,
            notificationsSent: sentCount,
            subscribersCount: subscriptions.length,
        });

    } catch (error) {
        console.error('[Push Check] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
