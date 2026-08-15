// ==================================================
// BabyRo — notify.js
// Påmindelse før næste sovetid.
//
// TO LAG:
// 1) ÆGTE PUSH — din Cloudflare Worker sender beskeden
//    hvert 5. minut fra sin cron. Virker med telefonen
//    lukket, når appen er installeret på hjemmeskærmen.
// 2) LOKAL RESERVE — hvis push ikke er sat op, viser
//    appen beskeden selv, mens den er åben.
// ==================================================

let notifTimer = null;
let pushKlar = false;

function notifTilladt() { return typeof Notification !== 'undefined' && Notification.permission === 'granted'; }
function notifSlaaetTil() { return localStorage.getItem('babyRoNotif') === 'ja' && notifTilladt(); }
function notifVarsel() {
    const v = parseInt(localStorage.getItem('babyRoNotifLead'));
    return isNaN(v) ? 15 : v;
}
function pushId() {
    let id = localStorage.getItem('babyRoPushId');
    if (!id) { id = 'p' + Date.now() + Math.random().toString(36).slice(2, 8); localStorage.setItem('babyRoPushId', id); }
    return id;
}
function workerKlar() {
    return typeof WORKER_URL === 'string' && WORKER_URL.startsWith('http') && !WORKER_URL.includes('dit-brugernavn');
}

// ==========================================
// TILLADELSE
// ==========================================
async function slaaNotifTil() {
    if (typeof Notification === 'undefined') {
        opdaterNotifStatus("Din browser understøtter ikke påmindelser."); return false;
    }
    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();
    if (perm !== 'granted') {
        opdaterNotifStatus("Du har afvist påmindelser. Slå dem til igen i browserens indstillinger for siden.");
        return false;
    }
    localStorage.setItem('babyRoNotif', 'ja');
    await tilmeldPush();
    planlaegNaesteSoevn();
    visNotifikation("BabyRo er klar 🔔", "Du får besked, inden det er tid til næste lur.");
    return true;
}

async function slaaNotifFra() {
    localStorage.setItem('babyRoNotif', 'nej');
    if (notifTimer) { clearTimeout(notifTimer); notifTimer = null; }
    if (workerKlar()) {
        try {
            await fetch(WORKER_URL + '/push/unregister', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pushId() })
            });
        } catch (e) {}
    }
    opdaterNotifStatus();
}

// ==========================================
// ÆGTE PUSH
// ==========================================
function base64ToUint8(base64) {
    const pad = '='.repeat((4 - base64.length % 4) % 4);
    const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
}

async function tilmeldPush() {
    if (!workerKlar() || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    try {
        const svar = await fetch(WORKER_URL + '/push/key');
        if (!svar.ok) { pushKlar = false; return false; }
        const { publicKey } = await svar.json();
        if (!publicKey) { pushKlar = false; return false; }

        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
            sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64ToUint8(publicKey)
            });
        }
        // Gem adressen i service worker'en, så den kan hente beskedteksten
        reg.active?.postMessage({ type: 'config', workerUrl: WORKER_URL, pushId: pushId() });
        pushKlar = true;
        await sendPushOpdatering(sub);
        return true;
    } catch (e) {
        console.log("Push kunne ikke sættes op:", e);
        pushKlar = false;
        return false;
    }
}

async function sendPushOpdatering(sub) {
    if (!workerKlar()) return;
    try {
        if (!sub && 'serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            sub = await reg.pushManager.getSubscription();
        }
        if (!sub) return;
        const naeste = typeof naesteSoevnTid === 'function' ? naesteSoevnTid() : null;
        await fetch(WORKER_URL + '/push/register', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: pushId(),
                subscription: sub.toJSON ? sub.toJSON() : sub,
                nextSleep: naeste ? naeste.tidligst : 0,
                leadMin: notifVarsel(),
                babyName: babyName
            })
        });
    } catch (e) { console.log("Kunne ikke opdatere push:", e); }
}

// ==========================================
// VISNING
// ==========================================
async function visNotifikation(titel, tekst) {
    if (!notifTilladt()) return;
    try {
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
                reg.showNotification(titel, {
                    body: tekst, icon: 'favicon.svg', badge: 'favicon.svg',
                    tag: 'babyro-soevn', renotify: true, vibrate: [200, 100, 200]
                });
                return;
            }
        }
        new Notification(titel, { body: tekst, icon: 'favicon.svg' });
    } catch (e) { console.log("Kunne ikke vise påmindelse:", e); }
}

// ==========================================
// PLANLÆGNING
// ==========================================
function planlaegNaesteSoevn() {
    if (notifTimer) { clearTimeout(notifTimer); notifTimer = null; }
    if (!notifSlaaetTil()) { opdaterKnap(); return; }

    const naeste = typeof naesteSoevnTid === 'function' ? naesteSoevnTid() : null;
    sendPushOpdatering();
    if (!naeste) { opdaterKnap(); return; }

    localStorage.setItem('babyRoNextSleep', String(naeste.tidligst));
    const om = naeste.tidligst - notifVarsel() * 60000 - Date.now();

    // Lokal reserve — kun nødvendig hvis ægte push ikke kører
    if (!pushKlar) {
        if (om > 30 * 60000) notifTimer = setTimeout(planlaegNaesteSoevn, 30 * 60000);
        else if (om > 0) {
            notifTimer = setTimeout(() => {
                visNotifikation(`Snart sovetid for ${babyName} 💤`,
                    `Søvnvinduet åbner kl. ${clockFromMs(naeste.tidligst)}. Start putterutinen nu.`);
                localStorage.setItem('babyRoNotifVist', String(naeste.tidligst));
                setTimeout(planlaegNaesteSoevn, 60000);
            }, om);
        }
    }
    opdaterKnap();
}

function tjekMissetPaamindelse() {
    if (!notifSlaaetTil() || pushKlar) return;
    const naeste = Number(localStorage.getItem('babyRoNextSleep') || 0);
    const vist = Number(localStorage.getItem('babyRoNotifVist') || 0);
    if (!naeste || vist === naeste) return;
    const nu = Date.now();
    if (nu >= naeste - notifVarsel() * 60000 && nu < naeste + 2 * 3600000) {
        visNotifikation(`Det er sovetid for ${babyName} 💤`, `Søvnvinduet åbnede kl. ${clockFromMs(naeste)}.`);
        localStorage.setItem('babyRoNotifVist', String(naeste));
    }
}

// ==========================================
// UI
// ==========================================
function opdaterNotifStatus(fejl) {
    const el = document.getElementById('notif-status');
    if (!el) return;
    if (fejl) { el.textContent = fejl; el.classList.add('notif-error'); return; }
    el.classList.remove('notif-error');

    if (!notifSlaaetTil()) { el.textContent = T('notifOff'); return; }
    const naeste = typeof naesteSoevnTid === 'function' ? naesteSoevnTid() : null;
    const lag = pushKlar
        ? "Ægte push er aktiv — beskeden kommer, også når telefonen er lukket."
        : "Kører lokalt — beskeden kommer, når appen er åben eller i baggrunden.";
    el.textContent = (naeste
        ? `Aktiv. Næste påmindelse ca. kl. ${clockFromMs(naeste.tidligst - notifVarsel() * 60000)}. `
        : "Aktiv. Gem en lur, så planlægges den første påmindelse. ") + lag;
}

function opdaterKnap() {
    const btn = document.getElementById('btn-notif-toggle');
    const kort = document.getElementById('btn-enable-notif');
    const test = document.getElementById('btn-notif-test');
    const til = notifSlaaetTil();
    if (btn) btn.textContent = til ? T('disableNotif') : T('enableNotif');
    if (kort) kort.style.display = til ? 'none' : 'block';
    if (test) test.style.display = (til && pushKlar) ? 'block' : 'none';
    opdaterNotifStatus();
}

document.getElementById('btn-notif-toggle')?.addEventListener('click', async () => {
    if (notifSlaaetTil()) await slaaNotifFra(); else await slaaNotifTil();
    opdaterKnap();
});
document.getElementById('btn-enable-notif')?.addEventListener('click', async () => {
    await slaaNotifTil(); opdaterKnap();
});
document.getElementById('notif-lead')?.addEventListener('change', (e) => {
    const v = Math.max(0, Math.min(60, parseInt(e.target.value) || 15));
    e.target.value = v;
    localStorage.setItem('babyRoNotifLead', String(v));
    planlaegNaesteSoevn();
});
document.getElementById('btn-notif-test')?.addEventListener('click', async () => {
    if (!workerKlar()) { alert("Worker-adressen mangler i cloudflare-config.js."); return; }
    try {
        const r = await fetch(WORKER_URL + '/push/test/' + pushId());
        const d = await r.json();
        alert(d.ok ? "Testbesked sendt. Den bør komme om få sekunder." : "Kunne ikke sende (status " + d.status + ").");
    } catch (e) { alert("Fejl: " + e.message); }
});

// ==========================================
// OPSTART
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const lead = document.getElementById('notif-lead');
    if (lead) lead.value = notifVarsel();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(async () => {
            if (notifSlaaetTil()) await tilmeldPush();
            tjekMissetPaamindelse();
            planlaegNaesteSoevn();
            opdaterKnap();
        }).catch(e => { console.log("Service worker fejl:", e); planlaegNaesteSoevn(); });
    } else {
        planlaegNaesteSoevn();
    }
    opdaterKnap();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        tjekMissetPaamindelse();
        planlaegNaesteSoevn();
        if (typeof renderPlanCard === 'function') renderPlanCard();
    }
});
