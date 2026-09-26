// Tæller brug op, hvis analytics.js er med. Fejler aldrig.
function spor(navn) { try { if (typeof sporHandling === 'function') sporHandling(navn); } catch (e) {} }

// ==================================================
// BabyBasen — ui.js
// Faner der huskes, underfaner, hjælpebobler,
// hjørnemenu, gæstelås, installation og feedback
// på knaptryk.
// ==================================================

// ==========================================
// TAL MED KOMMA
// ==========================================
function talFraFelt(id) {
    const el = document.getElementById(id);
    if (!el) return NaN;
    const raw = String(el.value).trim().replace(',', '.');
    return raw ? parseFloat(raw) : NaN;
}
function talTilFelt(v) {
    if (v == null || v === "") return "";
    return String(v).replace('.', ',');
}

document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.tagName !== 'INPUT' || el.getAttribute('inputmode') !== 'decimal') return;
    const renset = el.value.replace(/[^0-9,.\-]/g, '').replace('.', ',');
    if (renset !== el.value) {
        const pos = el.selectionStart;
        el.value = renset;
        try { el.setSelectionRange(pos, pos); } catch (err) {}
    }
});

// ==========================================
// KNAPFEEDBACK
// ==========================================
document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.disabled) return;
    btn.classList.add('pressed');
    const fjern = () => btn.classList.remove('pressed');
    setTimeout(fjern, 220);
    btn.addEventListener('pointerup', fjern, { once: true });
    btn.addEventListener('pointerleave', fjern, { once: true });
});

// ==========================================
// HJÆLPEBOBLER
// ==========================================
function opsaetHjaelp() {
    const tip = document.getElementById('tooltip');
    if (!tip) return;

    function vis(el) {
        const tekst = el.getAttribute('data-tip');
        if (!tekst) return;
        tip.textContent = tekst;
        tip.classList.add('vis');
        const r = el.getBoundingClientRect();
        const bredde = Math.min(300, window.innerWidth - 30);
        tip.style.width = bredde + 'px';
        let venstre = r.left + r.width / 2 - bredde / 2;
        venstre = Math.max(12, Math.min(venstre, window.innerWidth - bredde - 12));
        tip.style.left = venstre + 'px';
        const under = r.bottom + 10;
        if (under + tip.offsetHeight > window.innerHeight - 10) {
            tip.style.top = (r.top - tip.offsetHeight - 10 + window.scrollY) + 'px';
        } else {
            tip.style.top = (under + window.scrollY) + 'px';
        }
    }
    function skjul() { tip.classList.remove('vis'); }

    document.addEventListener('mouseover', (e) => { const h = e.target.closest('.hint'); if (h) vis(h); });
    document.addEventListener('mouseout', (e) => { if (e.target.closest('.hint')) skjul(); });
    document.addEventListener('click', (e) => {
        const h = e.target.closest('.hint');
        if (h) { e.preventDefault(); tip.classList.contains('vis') ? skjul() : vis(h); }
        else skjul();
    });
    window.addEventListener('scroll', skjul, { passive: true });
}

// ==========================================
// FANER DER HUSKES
// ==========================================
function huskFane(gruppe, id) {
    try {
        const gemt = JSON.parse(localStorage.getItem('babyRoTabs') || '{}');
        gemt[gruppe] = id;
        localStorage.setItem('babyRoTabs', JSON.stringify(gemt));
    } catch (e) {}
}
function huskedeFaner() {
    try { return JSON.parse(localStorage.getItem('babyRoTabs') || '{}'); }
    catch (e) { return {}; }
}

function opsaetUnderfaner() {
    document.querySelectorAll('.sub-tabs').forEach(gruppeEl => {
        const gruppe = gruppeEl.dataset.group;
        gruppeEl.querySelectorAll('.sub-tab').forEach(btn => {
            btn.addEventListener('click', () => vaelgUnderfane(gruppe, btn.dataset.sub));
        });
    });
}

function vaelgUnderfane(gruppe, subId, husk) {
    const gruppeEl = document.querySelector(`.sub-tabs[data-group="${gruppe}"]`);
    if (!gruppeEl) return;
    const alle = [...gruppeEl.querySelectorAll('.sub-tab')].map(b => b.dataset.sub);
    if (!alle.includes(subId)) subId = alle[0];

    alle.forEach(id => {
        const p = document.getElementById(id);
        if (p) { p.classList.remove('active'); p.style.display = 'none'; }
    });
    gruppeEl.querySelectorAll('.sub-tab').forEach(b => b.classList.toggle('active', b.dataset.sub === subId));

    const valgt = document.getElementById(subId);
    if (valgt) { valgt.classList.add('active'); valgt.style.display = 'block'; }
    if (husk !== false) huskFane(gruppe, subId);

    if (subId === 'sub-carestats' && typeof tegnCareChart === 'function') tegnCareChart();
    if (subId === 'sub-overview' && typeof tegnChart === 'function') tegnChart();
    if (subId === 'sub-curves' && typeof tegnVaekstChart === 'function') tegnVaekstChart();
    if (subId === 'sub-quick' && typeof renderCare === 'function') renderCare();
    if (subId === 'sub-report' && typeof opdaterRapportInfo === 'function') opdaterRapportInfo();
    if (subId === 'sub-plan-explain' && typeof renderPlanForklaring === 'function') renderPlanForklaring();
}

function gendanFaner() {
    const gemt = huskedeFaner();
    document.querySelectorAll('.sub-tabs').forEach(g => vaelgUnderfane(g.dataset.group, gemt[g.dataset.group], false));
}

// ==========================================
// GÆSTELÅS
// Uden login virker kun søvnuret og lydene.
// ==========================================
const LAAS_NAVNE = {
    care:   { key: 'careTitle' },
    sleep:  { key: 'historyTitle' },
    growth: { key: 'growthTitle' },
    ms:     { key: 'msTitle' }
};

function opdaterLaase() {
    const gaest = (typeof isGuest === 'undefined') ? true : isGuest;
    document.querySelectorAll('.laas').forEach(el => {
        const omraade = el.dataset.laas;
        if (!gaest) { el.innerHTML = ''; el.style.display = 'none'; return; }
        el.style.display = 'block';
        const navn = T(LAAS_NAVNE[omraade] ? LAAS_NAVNE[omraade].key : 'appTitle');
        el.innerHTML = `
            <div class="laas-kort">
                <div class="laas-ikon">🔒</div>
                <h3>${T('guestLockTitle', { hvad: navn.toLowerCase() })}</h3>
                <p>${T('guestLockBody')}</p>
                <button class="google-btn laas-login"><span class="btn-icon">G</span> ${T('guestLockBtn')}</button>
            </div>`;
    });
    document.querySelectorAll('.laas-indhold').forEach(el => {
        el.style.display = gaest ? 'none' : 'block';
    });
    const banner = document.getElementById('guest-banner');
    if (banner) banner.style.display = gaest ? 'flex' : 'none';
}

// ==========================================
// SOVER EN SØSKENDE SAMTIDIG?
//
// Hvert barn har sit eget ur i localStorage. De kører alle videre,
// uanset hvilket barn der er valgt — men man kunne ikke se det.
// Denne bjælke viser de andre børn, der sover lige nu.
// ==========================================
function andreSovendeBoern() {
    if (typeof childList === 'undefined' || typeof childId === 'undefined') return [];
    const ud = [];
    childList.filter(c => !c.archived && c.id !== childId).forEach(c => {
        let d = null;
        try { d = JSON.parse(localStorage.getItem('babyRoUr_' + c.id)); } catch (e) {}
        if (!d || !d.urKoerer || !d.urStart) return;
        const sek = Math.floor((d.urOpsparet || 0) + (Date.now() - d.urStart) / 1000);
        if (sek <= 0 || sek > 86400) return;      // glemt at blive stoppet
        ud.push({ id: c.id, navn: c.name || T('childNoName'), sek });
    });
    return ud;
}

function opdaterSoeskendeBjaelke() {
    const el = document.getElementById('soeskende-bjaelke');
    if (!el) return;
    const sovende = andreSovendeBoern();
    if (!sovende.length) { el.style.display = 'none'; el.innerHTML = ''; return; }
    el.style.display = 'flex';
    el.innerHTML = sovende.map(b => `
        <button class="soesken" data-soesken="${b.id}">
            <span class="zz">💤</span>
            <span><span class="navn">${esc(b.navn)}</span> ${T('sleepsToo')}<br>
            <span class="tid">${formatShort(b.sek)}</span></span>
            <span class="skift">${T('tapToSwitch')}</span>
        </button>`).join('');
}

document.addEventListener('click', (e) => {
    const knap = e.target.closest('[data-soesken]');
    if (!knap) return;
    if (typeof skiftBarn === 'function') skiftBarn(knap.dataset.soesken);
});

// Tiden på bjælken skal være levende, ellers tror man den står stille
setInterval(() => {
    if (document.visibilityState === 'visible') opdaterSoeskendeBjaelke();
}, 20000);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') opdaterSoeskendeBjaelke();
});

document.addEventListener('click', (e) => {
    if (e.target.closest('.laas-login') || e.target.closest('#guest-banner-login')) {
        document.getElementById('btn-google-login')?.click();
    }
});

// ==========================================
// HJØRNEMENU
// ==========================================
function aabnProfilMenu() {
    const sheet = document.getElementById('profile-sheet');
    if (!sheet) return;
    opdaterProfilMenu();
    sheet.classList.add('vis');
    document.body.style.overflow = 'hidden';
}
function lukProfilMenu() {
    document.getElementById('profile-sheet')?.classList.remove('vis');
    document.body.style.overflow = '';
}

function opdaterProfilMenu() {
    const gaest = (typeof isGuest === 'undefined') ? true : isGuest;
    const navnEl = document.getElementById('sheet-name');
    const subEl = document.getElementById('sheet-sub');
    const authBtn = document.getElementById('sheet-auth');
    const avatar = document.getElementById('avatar-initial');

    const navn = (typeof babyName !== 'undefined' && babyName) ? babyName : T('guestBadge');
    if (navnEl) navnEl.textContent = gaest ? T('guestBadge') : navn;
    if (subEl) subEl.textContent = gaest ? T('guestHint') : (typeof currentEmail !== 'undefined' ? currentEmail : '');
    if (avatar) avatar.textContent = gaest ? '?' : (navn.trim()[0] || '👶').toUpperCase();

    if (authBtn) {
        authBtn.textContent = gaest ? T('menuLogin') : T('menuLogout');
        authBtn.className = gaest ? 'action-btn save-btn full-btn' : 'action-btn reset-btn full-btn';
    }

    // Skift barn direkte fra menuen
    const sw = document.getElementById('child-switcher');
    if (sw) {
        const liste = (typeof aktiveBoern === 'function') ? aktiveBoern() : [];
        sw.innerHTML = (!gaest && liste.length > 1)
            ? liste.map(c => `<button class="chip ${c.id === childId ? 'active' : ''}" data-child="${c.id}">${esc(c.name || 'Baby')}</button>`).join('')
            : '';
        sw.style.display = sw.innerHTML ? 'flex' : 'none';
        sw.querySelectorAll('[data-child]').forEach(b => {
            b.addEventListener('click', () => {
                if (b.dataset.child !== childId && typeof skiftBarn === 'function') skiftBarn(b.dataset.child);
                lukProfilMenu();
            });
        });
    }
}

document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-profile-menu')) { aabnProfilMenu(); return; }
    if (e.target.closest('#sheet-close') || e.target.id === 'profile-sheet') { lukProfilMenu(); return; }

    const go = e.target.closest('[data-go]');
    if (go) {
        const [fane, under] = go.dataset.go.split(':');
        lukProfilMenu();
        if (typeof visFane === 'function') visFane(fane);
        if (under) vaelgUnderfane('profile', under);
        window.scrollTo(0, 0);
        return;
    }
    if (e.target.closest('#sheet-overview')) {
        lukProfilMenu();
        document.getElementById('btn-open-summary')?.click();
        return;
    }
    if (e.target.closest('#sheet-auth')) {
        lukProfilMenu();
        const gaest = (typeof isGuest === 'undefined') ? true : isGuest;
        document.getElementById(gaest ? 'btn-google-login' : 'btn-logout')?.click();
        return;
    }
    // Genvej til rapporten fra Søvn-siden
    if (e.target.closest('.genvej-rapport')) {
        if (typeof visFane === 'function') visFane('nav-profile');
        vaelgUnderfane('profile', 'sub-report');
        window.scrollTo(0, 0);
    }
});

// ==========================================
// INSTALLATION
// ==========================================
let installEvent = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; opdaterInstall(); });
window.addEventListener('appinstalled', () => { installEvent = null; opdaterInstall(); });

function erInstalleret() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function opdaterInstall() {
    const knap = document.getElementById('btn-install');
    const trin = document.getElementById('install-steps');
    const tekst = document.getElementById('install-text');
    if (!trin) return;

    if (erInstalleret()) {
        if (knap) knap.style.display = 'none';
        if (tekst) tekst.textContent = T('installed');
        trin.innerHTML = "";
        return;
    }
    if (installEvent) { if (knap) knap.style.display = 'block'; trin.innerHTML = ""; return; }

    if (knap) knap.style.display = 'none';
    const erIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    trin.innerHTML = erIOS ? T('installIOS') : T('installAndroid');
}

document.getElementById('btn-install')?.addEventListener('click', async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    installEvent = null;
    opdaterInstall();
});

// ==========================================
// OPSTART
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    opsaetHjaelp();
    opsaetUnderfaner();
    opdaterInstall();
});
