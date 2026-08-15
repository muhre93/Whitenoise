// ==================================================
// BabyRo — ui.js
// Faner der huskes, underfaner, hjælpebobler,
// installation, komma-tal og knapfeedback.
// ==================================================

// ==========================================
// TAL MED KOMMA
// Danskere skriver 7,45 — ikke 7.45. Felterne er
// tekstfelter med talttastatur, og vi oversætter selv.
// ==========================================
function talFraFelt(id) {
    const el = document.getElementById(id);
    if (!el) return NaN;
    const raw = String(el.value).trim().replace(',', '.');
    if (!raw) return NaN;
    return parseFloat(raw);
}

function talTilFelt(v) {
    if (v == null || v === "") return "";
    return String(v).replace('.', ',');
}

// Kun tal, komma og minus må tastes i decimalfelter
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
// Alle knapper blinker kort, når de trykkes,
// så man kan se at trykket blev registreret.
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
        // Under mærket, eller over hvis der ikke er plads
        const under = r.bottom + 10;
        if (under + tip.offsetHeight > window.innerHeight - 10) {
            tip.style.top = (r.top - tip.offsetHeight - 10 + window.scrollY) + 'px';
        } else {
            tip.style.top = (under + window.scrollY) + 'px';
        }
    }
    function skjul() { tip.classList.remove('vis'); }

    document.addEventListener('mouseover', (e) => {
        const h = e.target.closest('.hint');
        if (h) vis(h);
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('.hint')) skjul();
    });
    // På mobil: tryk for at vise, tryk igen eller andet sted for at lukke
    document.addEventListener('click', (e) => {
        const h = e.target.closest('.hint');
        if (h) {
            e.preventDefault();
            tip.classList.contains('vis') ? skjul() : vis(h);
        } else skjul();
    });
    window.addEventListener('scroll', skjul, { passive: true });
}

// ==========================================
// FANER DER HUSKES
// Genindlæser man siden, bliver man hvor man var.
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
        const knapper = gruppeEl.querySelectorAll('.sub-tab');
        knapper.forEach(btn => {
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
    gruppeEl.querySelectorAll('.sub-tab').forEach(b =>
        b.classList.toggle('active', b.dataset.sub === subId));

    const valgt = document.getElementById(subId);
    if (valgt) { valgt.classList.add('active'); valgt.style.display = 'block'; }
    if (husk !== false) huskFane(gruppe, subId);

    // Nogle paneler skal tegnes, når de bliver synlige
    if (subId === 'sub-carestats' && typeof tegnCareChart === 'function') tegnCareChart();
    if (subId === 'sub-overview' && typeof tegnChart === 'function') tegnChart();
    if (subId === 'sub-curves' && typeof tegnVaekstChart === 'function') tegnVaekstChart();
    if (subId === 'sub-report' && typeof opdaterRapportInfo === 'function') opdaterRapportInfo();
}

function gendanFaner() {
    const gemt = huskedeFaner();
    document.querySelectorAll('.sub-tabs').forEach(g => {
        vaelgUnderfane(g.dataset.group, gemt[g.dataset.group], false);
    });
}

// ==========================================
// INSTALLATION PÅ TELEFON
// ==========================================
let installEvent = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e;
    opdaterInstall();
});
window.addEventListener('appinstalled', () => {
    installEvent = null;
    opdaterInstall();
});

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
        if (tekst) tekst.textContent = "BabyRo er installeret på denne enhed. ✅";
        trin.innerHTML = "";
        return;
    }

    if (installEvent) {
        if (knap) knap.style.display = 'block';
        trin.innerHTML = "";
        return;
    }

    if (knap) knap.style.display = 'none';
    const erIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    trin.innerHTML = erIOS
        ? `<ol class="steps">
             <li>Åbn denne side i <strong>Safari</strong> (ikke Chrome).</li>
             <li>Tryk på <strong>Del</strong>-knappen nederst — firkanten med pilen op.</li>
             <li>Rul ned og vælg <strong>Føj til hjemmeskærm</strong>.</li>
             <li>Tryk <strong>Tilføj</strong>, og åbn BabyRo fra ikonet.</li>
           </ol>
           <p class="mini-help">På iPhone virker påmindelser kun, når appen åbnes fra hjemmeskærmen. Det er Apples krav.</p>`
        : `<ol class="steps">
             <li>Tryk på <strong>menuen</strong> i browseren (de tre prikker).</li>
             <li>Vælg <strong>Installer app</strong> eller <strong>Føj til startskærm</strong>.</li>
             <li>Bekræft, og åbn BabyRo fra ikonet.</li>
           </ol>`;
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
