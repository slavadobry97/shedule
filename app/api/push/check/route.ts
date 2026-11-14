import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { loadSchedule } from '@/utils/loadSchedule';
import { compareScheduleData } from '@/lib/schedule-utils';
import {
    getScheduleSnapshot,
    saveScheduleSnapshot,
    updateLastCheck,
    notifySubscribers,
    getAllSubscriptions,
} from '@/utils/push-utils';

// Этот endpoint вызывает внешний cron (cron-job.org и т.п.) каждые 5 минут.
// Защита: cron передаёт секрет в заголовке Authorization: Bearer <CRON_SECRET>.
// Если CRON_SECRET не задан — маршрут закрыт (fail closed): без секрета любой
// человек из сети мог бы выжечь квоту Google Sheets бесконечными запросами.
export const dynamic = 'force-dynamic';

function isAuthorizedCron(request: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;

    const header = request.headers.get('authorization') ?? '';
    const expected = `Bearer ${secret}`;
    if (header.length !== expected.length) return false;

    return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

export async function GET(request: NextRequest) {
    if (!isAuthorizedCron(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {

        // Получаем текущее расписание
        const currentSchedule = await loadSchedule();

        if (!currentSchedule || currentSchedule.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No schedule data'
            });
        }

        // Получаем предыдущий snapshot
        const previousSchedule = await getScheduleSnapshot();

        // Если нет предыдущего snapshot — просто сохраняем текущий
        if (!previousSchedule) {
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
            await updateLastCheck();
            return NextResponse.json({
                success: true,
                message: 'No changes',
                itemCount: currentSchedule.length
            });
        }


        // Получаем количество подписчиков
        const subscriptions = await getAllSubscriptions();

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
