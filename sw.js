// ==================================================
// BabyBasen — sw.js (service worker)
// To opgaver: 1) appen kan åbnes uden net  2) push-beskeder
// ==================================================

// Vi låner adressen på Cloudflare-workeren fra samme fil som appen bruger,
// så du kun skal skrive den ét sted.
try { importScripts('./cloudflare-config.js'); } catch (e) { self.CLOUDFLARE_URL = ""; }

const CACHE = 'babybasen-v11';
const FILER = [
    './', './index.html', './style.css', './manifest.json', './favicon.svg',
    './i18n.js', './articles.js', './defaults.js', './growth-data.js', './charts.js',
    './ui.js', './script.js', './children.js', './lockscreen.js', './log.js',
    './care.js', './growth.js', './milestones.js', './planforklaring.js',
    './sleepedit.js', './report.js', './feedback.js', './analytics.js', './notify.js'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(c => c.addAll(FILER).catch(() => {})).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(navne => Promise.all(
            navne.filter(n => n !== CACHE).map(n => caches.delete(n))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    // Firebase, Cloudflare og alt andet udefra går direkte ud på nettet
    if (url.origin !== self.location.origin) return;

    e.respondWith(
        fetch(e.request)
            .then(svar => {
                const kopi = svar.clone();
                caches.open(CACHE).then(c => c.put(e.request, kopi)).catch(() => {});
                return svar;
            })
            .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
});

// ---------- push ----------
function swB64url(buf) {
    const b = new Uint8Array(buf);
    let s = "";
    for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

self.addEventListener('push', e => {
    e.waitUntil((async () => {
        let titel = 'BabyBasen';
        let krop = (self.SPROG_FALLBACK === 'en') ? 'Nap time is coming up.' : 'Tid til en lur snart.';
        let tag = 'babybasen';

        const base = (typeof self.CLOUDFLARE_URL === 'string' && self.CLOUDFLARE_URL)
            ? self.CLOUDFLARE_URL.replace(/\/$/, '') : "";

        try {
            // Nogle gange kommer teksten med i selve pushen
            if (e.data) {
                const raa = e.data.text();
                try {
                    const j = JSON.parse(raa);
                    if (j.title) titel = j.title;
                    if (j.body) krop = j.body;
                    if (j.tag) tag = j.tag;
                } catch (_) {}
            }
            // Ellers henter vi den hos Cloudflare. Pushen selv er tom,
            // fordi tom push slipper for kryptering.
            else if (base) {
                const sub = await self.registration.pushManager.getSubscription();
                if (sub) {
                    const id = swB64url(await crypto.subtle.digest('SHA-256',
                        new TextEncoder().encode(sub.endpoint))).slice(0, 24);
                    const svar = await fetch(base + '/push/latest/' + encodeURIComponent(id));
                    if (svar.ok) {
                        const j = await svar.json();
                        if (j.title) titel = j.title;
                        if (j.body) krop = j.body;
                        if (j.tag) tag = j.tag;
                    }
                }
            }
        } catch (_) {}

        await self.registration.showNotification(titel, {
            body: krop, tag,
            icon: './favicon.svg', badge: './favicon.svg',
            vibrate: [120, 60, 120],
            data: { url: './index.html' }
        });
    })());
});

self.addEventListener('notificationclick', e => {
    e.notification.close();
    e.waitUntil((async () => {
        const liste = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const c of liste) { if ('focus' in c) return c.focus(); }
        return self.clients.openWindow('./index.html');
    })());
});
