// ==================================================
// BabyRo — sleepedit.js
// Ret og tilføj sovetider. Vigtigt, fordi tallene
// ender hos sundhedsplejersken — de skal være rigtige.
//
// Alt er koblet op med delegerede klik på document,
// så det også virker for knapper, der først bliver
// tegnet senere.
// ==================================================

let redigerNoegle = null;   // dato-nøgle
let redigerIndex = null;    // -1 = ny lur

function toCifre(n) { return String(n).padStart(2, '0'); }

function msTilDato(ms) {
    const d = new Date(ms);
    return d.getFullYear() + '-' + toCifre(d.getMonth() + 1) + '-' + toCifre(d.getDate());
}
function msTilKlokke(ms) {
    const d = new Date(ms);
    return toCifre(d.getHours()) + ':' + toCifre(d.getMinutes());
}
function feltTilMs(datoId, tidId) {
    const dato = document.getElementById(datoId)?.value;
    const tid = document.getElementById(tidId)?.value;
    if (!dato || !tid) return null;
    const [y, m, d] = dato.split('-').map(Number);
    const [t, min] = tid.split(':').map(Number);
    const dt = new Date(y, m - 1, d, t, min, 0, 0);
    return isNaN(dt.getTime()) ? null : dt.getTime();
}

// ==========================================
// ÅBN
// ==========================================
window.aabnSoevnRet = function (key, index) {
    const boks = document.getElementById('sleep-edit');
    if (!boks) return;

    redigerNoegle = key;
    redigerIndex = index;

    let start, slut;
    if (index === -1) {
        const nu = Date.now();
        start = nu - 3600000;
        slut = nu;
        document.getElementById('se-title').textContent = T('addSleepTitle');
        document.getElementById('se-delete').style.display = 'none';
    } else {
        const s = (localSleepLogs[key] && localSleepLogs[key].sessions[index]) || {};
        slut = s.endMs || Date.now();
        start = s.startMs || (slut - (s.durationSec || 0) * 1000);
        document.getElementById('se-title').textContent = T('editSleep');
        document.getElementById('se-delete').style.display = 'block';
    }

    document.getElementById('se-start-date').value = msTilDato(start);
    document.getElementById('se-start-time').value = msTilKlokke(start);
    document.getElementById('se-end-date').value = msTilDato(slut);
    document.getElementById('se-end-time').value = msTilKlokke(slut);

    boks.classList.add('vis');
    document.body.style.overflow = 'hidden';
    opdaterVarighed();
};

function lukSoevnRet() {
    document.getElementById('sleep-edit')?.classList.remove('vis');
    document.body.style.overflow = '';
    redigerNoegle = null;
    redigerIndex = null;
}

// ==========================================
// VARIGHED VISES, MENS MAN RETTER
// ==========================================
function opdaterVarighed() {
    const el = document.getElementById('se-duration');
    if (!el) return;
    const a = feltTilMs('se-start-date', 'se-start-time');
    const b = feltTilMs('se-end-date', 'se-end-time');
    if (a === null || b === null) { el.textContent = '–'; el.className = 'se-duration'; return; }
    const sek = Math.round((b - a) / 1000);
    if (sek <= 0) { el.textContent = '⚠️ ' + T('endBeforeStart'); el.className = 'se-duration fejl'; return; }
    if (sek > 86400) { el.textContent = '⚠️ ' + T('tooLong'); el.className = 'se-duration fejl'; return; }
    el.textContent = formatTimeText(sek);
    el.className = 'se-duration';
}

// ==========================================
// DELEGEREDE KLIK — virker uanset hvornår
// knapperne er blevet tegnet
// ==========================================
document.addEventListener('click', async (e) => {
    // Åbn tomt skema
    if (e.target.closest('#btn-add-sleep')) {
        e.preventDefault();
        aabnSoevnRet(todayKey(), -1);
        return;
    }

    // Flyt et tidspunkt et par minutter
    const nudge = e.target.closest('[data-nudge]');
    if (nudge) {
        e.preventDefault();
        const [hvilken, min] = nudge.dataset.nudge.split(':');
        const ms = feltTilMs(`se-${hvilken}-date`, `se-${hvilken}-time`);
        if (ms === null) return;
        const ny = ms + Number(min) * 60000;
        document.getElementById(`se-${hvilken}-date`).value = msTilDato(ny);
        document.getElementById(`se-${hvilken}-time`).value = msTilKlokke(ny);
        opdaterVarighed();
        return;
    }

    if (e.target.closest('#se-cancel') || e.target.id === 'sleep-edit') { lukSoevnRet(); return; }

    // Slet
    if (e.target.closest('#se-delete')) {
        if (redigerIndex === null || redigerIndex < 0) return;
        if (!confirm(T('deleteNap') + '?')) return;
        const key = redigerNoegle, i = redigerIndex;
        lukSoevnRet();
        await window.deleteLogEntry(key, i, true);
        return;
    }

    // Gem
    if (e.target.closest('#se-save')) {
        const start = feltTilMs('se-start-date', 'se-start-time');
        const slut = feltTilMs('se-end-date', 'se-end-time');
        if (start === null || slut === null) { alert(T('fillBothTimes')); return; }
        if (slut <= start) { alert(T('endBeforeStart')); return; }
        const sek = Math.round((slut - start) / 1000);
        if (sek > 86400) { alert(T('tooLong')); return; }

        const nyNoegle = isoKey(new Date(start));
        const post = {
            timeDisplay: `${T('atClock')} ${clockFromMs(start)} - ${clockFromMs(slut)}`,
            durationText: formatTimeText(sek),
            durationSec: sek,
            startMs: start,
            endMs: slut
        };

        const paavirkede = new Set();

        // Fjern den gamle post, hvis vi retter en eksisterende
        if (redigerIndex !== null && redigerIndex >= 0 && localSleepLogs[redigerNoegle]) {
            const gammel = localSleepLogs[redigerNoegle].sessions[redigerIndex];
            localSleepLogs[redigerNoegle].total = Math.max(0, localSleepLogs[redigerNoegle].total - (gammel.durationSec || 0));
            localSleepLogs[redigerNoegle].sessions.splice(redigerIndex, 1);
            if (!localSleepLogs[redigerNoegle].sessions.length) delete localSleepLogs[redigerNoegle];
            paavirkede.add(monthKey(redigerNoegle));
        }

        if (!localSleepLogs[nyNoegle]) localSleepLogs[nyNoegle] = { sessions: [], total: 0 };
        localSleepLogs[nyNoegle].sessions.push(post);
        localSleepLogs[nyNoegle].sessions.sort((x, y) => (x.startMs || 0) - (y.startMs || 0));
        localSleepLogs[nyNoegle].total += sek;
        paavirkede.add(monthKey(nyNoegle));

        lukSoevnRet();
        for (const ym of paavirkede) await gemSoevnMaaned(ym);

        renderTodayLog();
        renderPlanCard();
        if (typeof renderLogPage === 'function') renderLogPage();
        if (typeof planlaegNaesteSoevn === 'function') planlaegNaesteSoevn();
    }
});

document.addEventListener('input', (e) => {
    if (e.target.id && e.target.id.startsWith('se-')) opdaterVarighed();
});
