/**
 * Custom Service Worker для РГСУ Расписание
 * Включает обработку Push-уведомлений
 */

// Обработчик push-уведомлений
self.addEventListener('push', (event) => {
    if (!event.data) {
        console.log('[SW] Push received but no data');
        return;
    }

    try {
        const payload = event.data.json();

        const options = {
            body: payload.body || 'Расписание было обновлено',
            icon: payload.icon || '/favicon.png',
            badge: payload.badge || '/favicon.png',
            tag: payload.tag || 'schedule-update',
            vibrate: [100, 50, 100],
            data: payload.data || {},
            actions: [
                {
                    action: 'open',
                    title: 'Открыть',
                },
                {
                    action: 'dismiss',
                    title: 'Закрыть',
                },
            ],
            // Для iOS Safari важно указать requireInteraction: false
            requireInteraction: false,
        };

        event.waitUntil(
            self.registration.showNotification(
                payload.title || 'Расписание РГСУ',
                options
            )
        );
    } catch (error) {
        console.error('[SW] Error processing push:', error);
    }
});

// Обработчик клика по уведомлению
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Открываем приложение или фокусируемся на уже открытой вкладке
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Ищем уже открытую вкладку с нашим приложением
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    // Отправляем сообщение клиенту для обновления данных
                    client.postMessage({
                        type: 'SCHEDULE_UPDATE',
                        data: event.notification.data,
                    });
                    return;
                }
            }
            // Если вкладка не найдена — открываем новую
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Обработчик закрытия уведомления
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event.notification.tag);
});

// Обработчик сообщений от клиента (для обновления подписки и т.д.)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// --- Workbox / PWA код ниже (генерируется next-pwa) ---
