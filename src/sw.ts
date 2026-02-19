/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare let self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
clientsClaim()

self.addEventListener('push', (event) => {
    let data;
    try {
        data = event.data?.json();
    } catch (e) {
        data = { title: 'New Notification', body: event.data?.text() || 'You have a new message' };
    }

    const title = data.title || 'New Notification';
    const options = {
        body: data.body || 'You have a new message',
        icon: '/logo.png',
        badge: '/logo.png',
        data: data.url || '/',
        vibrate: [100, 50, 100],
        tag: data.tag || 'fitness-app-notification',
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

