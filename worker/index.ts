/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Обработчик push-уведомлений
self.addEventListener('push', (event) => {
    if (!event.data) {
        console.log('[SW] Push received but no data');
        return;
    }

    try {
        const payload = event.data.json();

        const options: NotificationOptions = {
            body: payload.body || 'Расписание было обновлено',
            icon: payload.icon || '/favicon.png',
            badge: payload.badge || '/favicon.png',
            tag: payload.tag || 'schedule-update',
            data: payload.data || {},
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

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    (client as WindowClient).focus();
                    client.postMessage({
                        type: 'SCHEDULE_UPDATE',
                        data: event.notification.data,
                    });
                    return;
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// Обработчик закрытия уведомления
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event.notification.tag);
});

export { };
