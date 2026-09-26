// ==================================================
// BabyBasen — notify.js
// Push-påmindelser: browseren spørger om lov, Cloudflare sender.
// ==================================================

let pushAbonnement = null;

function pushMuligt() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function cfBase() {
    return (typeof CLOUDFLARE_URL !== 'undefined' && CLOUDFLARE_URL) ? CLOUDFLARE_URL.replace(/\/$/, '') : "";
}

function notifStatus(tekst) {
    const el = document.getElementById('notif-status');
    if (el) el.textContent = tekst;
}

function base64TilUint8(base64) {
    const pad = '='.repeat((4 - base64.length % 4) % 4);
    const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raa = atob(b64);
    const ud = new Uint8Array(raa.length);
    for (let i = 0; i < raa.length; i++) ud[i] = raa.charCodeAt(i);
    return ud;
}

async function hentVapidNoegle() {
    if (!cfBase()) return "";
    try {
        const svar = await fetch(cfBase() + '/push/key');
        if (!svar.ok) return "";
        const j = await svar.json();
        return j.key || "";
    } catch (e) { return ""; }
}

async function slaaPushTil() {
    if (!pushMuligt()) { notifStatus(T('notifNotSupported')); return; }
    if (!cfBase()) { notifStatus(T('notifNoServer')); return; }

    notifStatus(T('notifWorking'));
    try {
        const lov = await Notification.requestPermission();
        if (lov !== 'granted') { notifStatus(T('notifDenied')); return; }

        const reg = await navigator.serviceWorker.register('sw.js');
        await navigator.serviceWorker.ready;

        const noegle = await hentVapidNoegle();
        if (!noegle) { notifStatus(T('notifNoKey')); return; }

        pushAbonnement = await reg.pushManager.getSubscription();
        if (!pushAbonnement) {
            pushAbonnement = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64TilUint8(noegle)
            });
        }

        const lead = Math.max(0, Math.min(120, Number(document.getElementById('notif-lead')?.value) || 15));
        const svar = await fetch(cfBase() + '/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscription: pushAbonnement.toJSON(),
                barn: babyName,
                childId: childId || 'lokal',
                sprog: SPROG,
                varsel: lead,
                foedselsdato: babyBirthDate || ""
            })
        });
        if (!svar.ok) { notifStatus(T('notifServerFail')); return; }

        localStorage.setItem('babyRoNotif', '1');
        spor('notifTil');
        localStorage.setItem('babyRoNotifLead', String(lead));
        notifStatus(T('notifOn', { min: lead }));
        opdaterNotifKnap(true);
    } catch (e) {
        notifStatus(T('notifError') + " " + (e.message || ""));
    }
}

async function slaaPushFra() {
    try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg && await reg.pushManager.getSubscription();
        if (sub) {
            if (cfBase()) {
                await fetch(cfBase() + '/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: sub.endpoint })
                }).catch(() => {});
            }
            await sub.unsubscribe();
        }
    } catch (e) {}
    localStorage.removeItem('babyRoNotif');
    notifStatus(T('notifOff'));
    opdaterNotifKnap(false);
}

function opdaterNotifKnap(til) {
    const btn = document.getElementById('btn-notif-toggle');
    const test = document.getElementById('btn-notif-test');
    if (btn) {
        btn.textContent = til ? T('disableNotif') : T('enableNotif');
        btn.classList.toggle('reset-btn', !!til);
        btn.classList.toggle('save-btn', !til);
    }
    if (test) test.style.display = til ? '' : 'none';
}

document.getElementById('btn-notif-toggle')?.addEventListener('click', () => {
    if (localStorage.getItem('babyRoNotif') === '1') slaaPushFra();
    else slaaPushTil();
});

document.getElementById('btn-notif-test')?.addEventListener('click', async () => {
    if (!cfBase() || !pushAbonnement) {
        // Uden server kan vi stadig vise en lokal besked
        if (Notification.permission === 'granted') {
            new Notification(T('notifTestTitle'), { body: T('notifTestBody', { navn: babyName }), icon: 'favicon.svg' });
            notifStatus(T('notifTestSentLocal'));
        }
        return;
    }
    try {
        await fetch(cfBase() + '/push/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: pushAbonnement.endpoint, sprog: SPROG, barn: babyName })
        });
        notifStatus(T('notifTestSent'));
    } catch (e) { notifStatus(T('notifServerFail')); }
});

document.getElementById('notif-lead')?.addEventListener('change', () => {
    if (localStorage.getItem('babyRoNotif') === '1') slaaPushTil();
});

// Knappen på Ur-siden peger ind på påmindelses-fanen
document.getElementById('btn-enable-notif')?.addEventListener('click', () => {
    if (typeof visFane === 'function') {
        const nav = document.getElementById('nav-profile');
        if (nav) visFane(nav);
    }
    if (typeof vaelgUnderfane === 'function') vaelgUnderfane('profile', 'sub-notif');
});

document.addEventListener('DOMContentLoaded', async () => {
    const lead = localStorage.getItem('babyRoNotifLead');
    const felt = document.getElementById('notif-lead');
    if (lead && felt) felt.value = lead;

    if (!pushMuligt()) { notifStatus(T('notifNotSupported')); return; }
    const til = localStorage.getItem('babyRoNotif') === '1' && Notification.permission === 'granted';
    opdaterNotifKnap(til);
    if (til) {
        notifStatus(T('notifOn', { min: lead || 15 }));
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) pushAbonnement = await reg.pushManager.getSubscription();
        } catch (e) {}
    }
});
