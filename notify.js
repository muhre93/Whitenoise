// ==================================================
// BabyRo — notify.js
// Påmindelse før næste sovetid + installation som app
//
// SÅDAN VIRKER DET:
// Browseren har ingen indbygget "vækkeur". BabyRo lægger
// derfor en påmindelse i kø og viser den, når tiden er
// inde — så længe appen er åben eller ligger i baggrunden.
// Er telefonen helt lukket ned, kommer beskeden, første
// gang du åbner appen igen ("Det er tid til lur").
//
// Vil du have besked med telefonen helt lukket, kræver det
// ægte push fra en server. Det kan din Cloudflare Worker
// klare — se afsnittet i OPDATERING.md.
// ==================================================

let notifTimer = null;

function notifTilladt() {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}
function notifSlaaetTil() {
    return localStorage.getItem('babyRoNotif') === 'ja' && notifTilladt();
}
function notifVarsel() {
    const v = parseInt(localStorage.getItem('babyRoNotifLead'));
    return isNaN(v) ? 15 : v;
}

// ==========================================
// TILLADELSE
// ==========================================
async function slaaNotifTil() {
    if (typeof Notification === 'undefined') {
        opdaterNotifStatus("Din browser understøtter ikke påmindelser. Prøv Chrome eller Safari.");
        return false;
    }
    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();

    if (perm !== 'granted') {
        opdaterNotifStatus("Du har afvist påmindelser. Slå dem til igen i browserens indstillinger for siden.");
        return false;
    }
    localStorage.setItem('babyRoNotif', 'ja');
    opdaterNotifStatus("");
    planlaegNaesteSoevn();
    visNotifikation("BabyRo er klar 🔔", "Du får besked, inden det er tid til næste lur.");
    return true;
}

function slaaNotifFra() {
    localStorage.setItem('babyRoNotif', 'nej');
    if (notifTimer) { clearTimeout(notifTimer); notifTimer = null; }
    opdaterNotifStatus("");
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
                    body: tekst,
                    icon: 'favicon.svg',
                    badge: 'favicon.svg',
                    tag: 'babyro-soevn',
                    renotify: true,
                    vibrate: [200, 100, 200]
                });
                return;
            }
        }
        new Notification(titel, { body: tekst, icon: 'favicon.svg' });
    } catch (e) {
        console.log("Kunne ikke vise påmindelse:", e);
    }
}

// ==========================================
// PLANLÆGNING
// ==========================================
function planlaegNaesteSoevn() {
    if (notifTimer) { clearTimeout(notifTimer); notifTimer = null; }
    if (!notifSlaaetTil()) { opdaterKnap(); return; }

    const naeste = typeof naesteSoevnTid === 'function' ? naesteSoevnTid() : null;
    if (!naeste) { opdaterKnap(); return; }

    const varselMs = notifVarsel() * 60000;
    const tidspunkt = naeste.tidligst - varselMs;
    localStorage.setItem('babyRoNextSleep', String(naeste.tidligst));

    const om = tidspunkt - Date.now();

    // setTimeout er upålideligt over meget lange perioder,
    // så vi tjekker igen om en halv time, hvis der er langt.
    if (om > 30 * 60000) {
        notifTimer = setTimeout(planlaegNaesteSoevn, 30 * 60000);
    } else if (om > 0) {
        notifTimer = setTimeout(() => {
            visNotifikation(
                `Snart sovetid for ${babyName} 💤`,
                `Søvnvinduet åbner kl. ${clockFromMs(naeste.tidligst)}. Start putterutinen nu, så nås der at falde til ro.`
            );
            localStorage.setItem('babyRoNotifVist', String(naeste.tidligst));
            setTimeout(planlaegNaesteSoevn, 60000);
        }, om);
    }
    opdaterKnap();
}

// Er tidspunktet passeret, mens appen var lukket? Så sig det nu.
function tjekMissetPaamindelse() {
    if (!notifSlaaetTil()) return;
    const naeste = Number(localStorage.getItem('babyRoNextSleep') || 0);
    const vist = Number(localStorage.getItem('babyRoNotifVist') || 0);
    if (!naeste || vist === naeste) return;

    const nu = Date.now();
    // Kun relevant inden for to timer — ellers er toget kørt
    if (nu >= naeste - notifVarsel() * 60000 && nu < naeste + 2 * 3600000) {
        visNotifikation(
            `Det er sovetid for ${babyName} 💤`,
            `Søvnvinduet åbnede kl. ${clockFromMs(naeste)}.`
        );
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

    if (!notifSlaaetTil()) {
        el.textContent = "Påmindelser er slået fra.";
        return;
    }
    const naeste = typeof naesteSoevnTid === 'function' ? naesteSoevnTid() : null;
    el.textContent = naeste
        ? `Aktiv. Næste påmindelse ca. kl. ${clockFromMs(naeste.tidligst - notifVarsel() * 60000)}.`
        : "Aktiv. Gem en lur, så planlægges den første påmindelse.";
}

function opdaterKnap() {
    const btn = document.getElementById('btn-notif-toggle');
    const kort = document.getElementById('btn-enable-notif');
    const til = notifSlaaetTil();
    if (btn) btn.textContent = til ? "🔕 Slå påmindelser fra" : "🔔 Slå påmindelser til";
    if (kort) kort.style.display = til ? 'none' : 'block';
    opdaterNotifStatus();
}

document.getElementById('btn-notif-toggle')?.addEventListener('click', async () => {
    if (notifSlaaetTil()) slaaNotifFra(); else await slaaNotifTil();
    opdaterKnap();
});
document.getElementById('btn-enable-notif')?.addEventListener('click', async () => {
    await slaaNotifTil();
    opdaterKnap();
});
document.getElementById('notif-lead')?.addEventListener('change', (e) => {
    const v = Math.max(0, Math.min(60, parseInt(e.target.value) || 15));
    e.target.value = v;
    localStorage.setItem('babyRoNotifLead', String(v));
    planlaegNaesteSoevn();
});

// ==========================================
// OPSTART
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const lead = document.getElementById('notif-lead');
    if (lead) lead.value = notifVarsel();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => { tjekMissetPaamindelse(); planlaegNaesteSoevn(); })
            .catch(e => console.log("Service worker kunne ikke starte:", e));
    } else {
        planlaegNaesteSoevn();
    }
    opdaterKnap();
});

// Når appen kommer frem igen, tjekkes alt forfra
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        tjekMissetPaamindelse();
        planlaegNaesteSoevn();
        if (typeof renderPlanCard === 'function') renderPlanCard();
    }
});
