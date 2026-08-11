// ==================================================
// BabyRo — sw.js (service worker)
// Gør appen installerbar og viser påmindelser.
// ==================================================

const CACHE = 'babyro-v4';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Klik på en påmindelse åbner appen igen
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const client of list) {
                if ('focus' in client) return client.focus();
            }
            if (self.clients.openWindow) return self.clients.openWindow('./');
        })
    );
});

// Klar til ægte push senere — kræver en server, der sender beskeden
self.addEventListener('push', (event) => {
    let data = { title: 'BabyRo', body: 'Det er snart sovetid.' };
    try { if (event.data) data = event.data.json(); } catch (e) {}
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: 'favicon.svg',
            badge: 'favicon.svg',
            tag: 'babyro-soevn',
            vibrate: [200, 100, 200]
        })
    );
});
