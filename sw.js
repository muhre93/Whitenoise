// ==================================================
// BabyRo — sw.js (service worker)
// Gør appen installerbar og modtager push-beskeder.
// ==================================================

let WORKER_URL = "";
let PUSH_ID = "";

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Appen fortæller service worker'en, hvor den skal hente teksten
self.addEventListener('message', (event) => {
    if (event.data?.type === 'config') {
        WORKER_URL = event.data.workerUrl || "";
        PUSH_ID = event.data.pushId || "";
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const client of list) if ('focus' in client) return client.focus();
            if (self.clients.openWindow) return self.clients.openWindow('./');
        })
    );
});

// Push kommer uden indhold — teksten hentes fra Worker'en
self.addEventListener('push', (event) => {
    event.waitUntil((async () => {
        let besked = { title: "BabyRo 💤", body: "Det er snart sovetid. Start putterutinen nu." };
        try {
            if (event.data) {
                const d = event.data.json();
                if (d.title) besked = d;
            } else if (WORKER_URL && PUSH_ID) {
                const r = await fetch(`${WORKER_URL}/push/message/${PUSH_ID}`);
                if (r.ok) besked = await r.json();
            }
        } catch (e) { /* falder tilbage på standardteksten */ }

        await self.registration.showNotification(besked.title, {
            body: besked.body,
            icon: 'favicon.svg',
            badge: 'favicon.svg',
            tag: 'babyro-soevn',
            renotify: true,
            vibrate: [200, 100, 200]
        });
    })());
});
