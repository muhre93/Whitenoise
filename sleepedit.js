// ==================================================
// BabyBasen — sleepedit.js
// Tilføj søvn manuelt + ret en gemt lur
// Dato og tid er delt op i to felter, fordi datetime-local
// opfører sig forskelligt fra telefon til telefon.
// ==================================================

let seRedigerer = null;   // { dagKey, index } eller null når vi tilføjer

function toTal(n) { return String(n).padStart(2, '0'); }

function saetSeFelter(startMs, slutMs) {
    const s = new Date(startMs), e = new Date(slutMs);
    document.getElementById('se-start-date').value = isoKey(s);
    document.getElementById('se-start-time').value = toTal(s.getHours()) + ':' + toTal(s.getMinutes());
    document.getElementById('se-end-date').value = isoKey(e);
    document.getElementById('se-end-time').value = toTal(e.getHours()) + ':' + toTal(e.getMinutes());
    opdaterSeVarighed();
}

function seLaes(hvilken) {
    const d = document.getElementById('se-' + hvilken + '-date').value;
    const t = document.getElementById('se-' + hvilken + '-time').value;
    if (!d || !t) return null;
    const [y, m, dag] = d.split('-').map(Number);
    const [ti, mi] = t.split(':').map(Number);
    const dt = new Date(y, m - 1, dag, ti, mi, 0, 0);
    return isNaN(dt.getTime()) ? null : dt.getTime();
}

function opdaterSeVarighed() {
    const el = document.getElementById('se-duration');
    if (!el) return;
    const s = seLaes('start'), e = seLaes('end');
    if (s == null || e == null) { el.textContent = "–"; el.classList.remove('se-fejl'); return; }
    const sek = Math.round((e - s) / 1000);
    if (sek <= 0) { el.textContent = T('endBeforeStart'); el.classList.add('se-fejl'); return; }
    el.classList.remove('se-fejl');
    el.textContent = formatTimeText(sek);
}

['se-start-date', 'se-start-time', 'se-end-date', 'se-end-time'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', opdaterSeVarighed);
    document.getElementById(id)?.addEventListener('input', opdaterSeVarighed);
});

document.querySelectorAll('[data-nudge]').forEach(btn => {
    btn.addEventListener('click', () => {
        const [hvilken, min] = btn.dataset.nudge.split(':');
        const nu = seLaes(hvilken);
        if (nu == null) return;
        const ny = new Date(nu + Number(min) * 60000);
        document.getElementById('se-' + hvilken + '-date').value = isoKey(ny);
        document.getElementById('se-' + hvilken + '-time').value = toTal(ny.getHours()) + ':' + toTal(ny.getMinutes());
        opdaterSeVarighed();
    });
});

function aabnSoevnTilfoej() {
    seRedigerer = null;
    document.getElementById('se-title').textContent = T('addSleep');
    document.getElementById('se-delete').style.display = 'none';
    const nu = Date.now();
    saetSeFelter(nu - 45 * 60000, nu);
    document.getElementById('sleep-edit').classList.add('vis');
}

function aabnSoevnRet(dagKey, index) {
    const dag = localSleepLogs[dagKey];
    if (!dag || !dag.sessions[index]) return;
    const s = dag.sessions[index];
    seRedigerer = { dagKey, index };
    document.getElementById('se-title').textContent = T('editSleep');
    document.getElementById('se-delete').style.display = '';

    let start = s.startMs;
    if (!start) {
        // Gamle poster har kun "14.05 - 14.50". Vi læser starttiden ud af teksten.
        const m = /(\d{1,2})[.:](\d{2})/.exec(s.timeDisplay || "");
        const d = keyToDate(dagKey);
        if (m) d.setHours(Number(m[1]), Number(m[2]), 0, 0);
        start = d.getTime();
    }
    const slut = s.endMs || (start + (s.durationSec || 0) * 1000);
    saetSeFelter(start, slut);
    document.getElementById('sleep-edit').classList.add('vis');
}

function lukSoevnRet() {
    document.getElementById('sleep-edit').classList.remove('vis');
    seRedigerer = null;
}

document.getElementById('btn-add-sleep')?.addEventListener('click', aabnSoevnTilfoej);
document.getElementById('se-cancel')?.addEventListener('click', lukSoevnRet);
document.getElementById('sleep-edit')?.addEventListener('click', e => {
    if (e.target.id === 'sleep-edit') lukSoevnRet();
});

document.getElementById('se-save')?.addEventListener('click', async () => {
    const start = seLaes('start'), slut = seLaes('end');
    if (start == null || slut == null) { alert(T('pickTime')); return; }
    if (slut <= start) { alert(T('endBeforeStart')); return; }

    const sek = Math.round((slut - start) / 1000);
    const post = {
        startMs: start, endMs: slut,
        timeDisplay: clockFromMs(start) + " - " + clockFromMs(slut),
        durationSec: sek,
        durationText: formatTimeText(sek)
    };
    const nyDag = isoKey(new Date(start));

    if (seRedigerer) {
        const { dagKey, index } = seRedigerer;
        localSleepLogs[dagKey].sessions.splice(index, 1);
        localSleepLogs[dagKey].total = localSleepLogs[dagKey].sessions.reduce((s, x) => s + (x.durationSec || 0), 0);
        if (!localSleepLogs[dagKey].sessions.length) delete localSleepLogs[dagKey];
        await gemSoevnMaaned(monthKey(dagKey));
    }

    if (!localSleepLogs[nyDag]) localSleepLogs[nyDag] = { sessions: [], total: 0 };
    localSleepLogs[nyDag].sessions.push(post);
    localSleepLogs[nyDag].sessions.sort((a, b) => (a.startMs || 0) - (b.startMs || 0));
    localSleepLogs[nyDag].total = localSleepLogs[nyDag].sessions.reduce((s, x) => s + (x.durationSec || 0), 0);
    await gemSoevnMaaned(monthKey(nyDag));

    if (isGuest) gaestSkriv('logs', localSleepLogs);
    spor(seRedigerer ? 'soevnRettet' : 'soevnTilfoejet');
    lukSoevnRet();
    opdaterAlt();
});

document.getElementById('se-delete')?.addEventListener('click', async () => {
    if (!seRedigerer) return;
    if (!confirm(T('deleteSleepSure'))) return;
    const { dagKey, index } = seRedigerer;
    await deleteLogEntry(dagKey, index, true);
    lukSoevnRet();
});
