/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

try {
  const handler = createHandlerBoundToURL('index.html')
  const navigationRoute = new NavigationRoute(handler, {
    denylist: [
      /^\/_/,
      new RegExp('/[^/?]+\\\\.[^/]+$') 
    ],
  })
  registerRoute(navigationRoute)
} catch (error) {
  console.warn('Error setting up nav route', error)
}

self.skipWaiting();

clientsClaim();


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
        icon: '/logo_192.png',
        badge: '/logo_192.png',
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
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

