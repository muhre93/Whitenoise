// ==================================================
// BabyBasen — care.js
// Pleje: amning, flaske, mad og bleer. Dagbog + overblik.
// ==================================================

let plejeDag = todayKey();
let cLogFra = dateKeyOffset(6);
let cLogTil = todayKey();
let aktivtCareChart = 'feeds';

const CARE_IKON = { amning: '🤱', flaske: '🍼', mad: '🥣', ble: '👶' };

function careTypeNavn(t) {
    return T({ amning: 'careBreast', flaske: 'careBottle', mad: 'careFood', ble: 'careNappy' }[t] || 'careFood');
}

// ---------- læs/skriv ----------
function plejeListe(dagKey) {
    const ym = monthKey(dagKey);
    return (careData[ym] || []).filter(e => e.dato === dagKey)
        .sort((a, b) => (a.tid || 0) - (b.tid || 0));
}

function plejeAlle() {
    const ud = [];
    Object.values(careData).forEach(arr => (arr || []).forEach(e => ud.push(e)));
    return ud;
}

async function tilfoejPleje(entry) {
    const ym = monthKey(entry.dato);
    if (!careData[ym]) careData[ym] = [];
    careData[ym].push(entry);
    await gemPlejeMaaned(ym);
    spor('plejeGemt');
    renderCare();
    opdaterPlan();
}

async function sletPleje(id, dagKey) {
    const ym = monthKey(dagKey);
    careData[ym] = (careData[ym] || []).filter(e => e.id !== id);
    await gemPlejeMaaned(ym);
    renderCare();
    opdaterPlan();
}

// ---------- seneste ----------
function senestePleje(typer) {
    const alle = plejeAlle().filter(e => typer.includes(e.type) && e.tid);
    if (!alle.length) return null;
    return alle.sort((a, b) => b.tid - a.tid)[0];
}

function sidenTekst(ms) {
    if (!ms) return "–";
    const min = Math.floor((Date.now() - ms) / 60000);
    if (min < 1) return T('justNow');
    return minTekst(min) + " " + T('ago');
}

// ---------- hero-tal på Ur-siden ----------
function opdaterPlejeHero() {
    const iDag = plejeListe(todayKey());
    const maal = iDag.filter(e => e.type !== 'ble');
    const bleer = iDag.filter(e => e.type === 'ble');
    const sf = senestePleje(['amning', 'flaske', 'mad']);
    const sb = senestePleje(['ble']);

    const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    s('che-feeds', maal.length);
    s('che-diapers', bleer.length);
    s('che-feed-since', sf ? sidenTekst(sf.tid) : T('noneToday'));
    s('che-diaper-since', sb ? sidenTekst(sb.tid) : T('noneToday'));
    s('che-label-feeds', T('feedsToday'));
    s('che-label-diapers', T('nappiesToday'));

    const note = document.getElementById('care-hero-note');
    if (note) {
        if (!sf) note.textContent = T('careHeroNone');
        else note.textContent = T('careHeroLast', { type: careTypeNavn(sf.type).toLowerCase(), siden: sidenTekst(sf.tid) });
    }
}

// ---------- dagbog ----------
function renderPlejeDag() {
    const titel = document.getElementById('care-list-title');
    if (titel) titel.textContent = plejeDag === todayKey() ? T('today') : formatDateDK(plejeDag);
    const naeste = document.getElementById('care-next');
    if (naeste) naeste.disabled = plejeDag >= todayKey();

    const box = document.getElementById('care-today');
    if (!box) return;
    const liste = plejeListe(plejeDag);
    if (!liste.length) { box.innerHTML = `<div class="empty-state">${T('careNoEntries')}</div>`; return; }

    box.innerHTML = `<ul class="care-list">` + liste.map(e => {
        const dele = [];
        if (e.side) dele.push(T({ venstre: 'sideLeft', hoejre: 'sideRight', begge: 'sideBoth' }[e.side]));
        if (e.min) dele.push(e.min + " " + T('minShort'));
        if (e.ml) dele.push(e.ml + " ml");
        if (e.ble) dele.push(T({ vaad: 'nappyWet', afforing: 'nappyDirty', begge: 'nappyBoth' }[e.ble]));
        if (e.note) dele.push(esc(e.note));
        return `<li>
            <span class="care-ikon">${CARE_IKON[e.type] || '•'}</span>
            <div class="care-tekst">
                <strong>${careTypeNavn(e.type)}</strong>
                <span class="care-meta">${e.tid ? clockFromMs(e.tid) : ''}${dele.length ? ' · ' + dele.join(' · ') : ''}</span>
            </div>
            <button class="delete-btn" onclick="sletPleje('${e.id}','${e.dato}')">❌</button>
        </li>`;
    }).join('') + `</ul>`;
}

// ---------- hurtige knapper ----------
function hurtigPleje(type, ekstra) {
    const nu = new Date();
    const entry = Object.assign({
        id: 'c' + Date.now() + Math.random().toString(36).slice(2, 6),
        type, dato: todayKey(), tid: nu.getTime()
    }, ekstra || {});
    tilfoejPleje(entry);
}

document.querySelectorAll('[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => {
        const t = btn.dataset.quick;
        spor('plejeHurtig');
        if (t === 'ble-vaad') hurtigPleje('ble', { ble: 'vaad' });
        else if (t === 'ble-afforing') hurtigPleje('ble', { ble: 'afforing' });
        else if (t === 'ble-begge') hurtigPleje('ble', { ble: 'begge' });
        else hurtigPleje(t);
    });
});

document.getElementById('care-prev')?.addEventListener('click', () => {
    const d = keyToDate(plejeDag); d.setDate(d.getDate() - 1);
    plejeDag = isoKey(d); renderPlejeDag();
});
document.getElementById('care-next')?.addEventListener('click', () => {
    if (plejeDag >= todayKey()) return;
    const d = keyToDate(plejeDag); d.setDate(d.getDate() + 1);
    plejeDag = isoKey(d); renderPlejeDag();
});

// ---------- detaljeret formular ----------
function opdaterCareFelter() {
    const t = document.getElementById('care-type')?.value;
    const vis = (id, on) => { const el = document.getElementById(id); if (el) el.style.display = on ? '' : 'none'; };
    vis('wrap-care-side', t === 'amning');
    vis('wrap-care-min', t === 'amning');
    vis('wrap-care-ml', t === 'flaske' || t === 'mad');
    vis('wrap-care-diaper', t === 'ble');
}
document.getElementById('care-type')?.addEventListener('change', opdaterCareFelter);

document.getElementById('btn-toggle-detail')?.addEventListener('click', () => {
    const d = document.getElementById('care-detail');
    if (!d) return;
    const aaben = d.style.display !== 'none';
    d.style.display = aaben ? 'none' : 'block';
    if (!aaben) {
        const nu = new Date();
        const felt = document.getElementById('care-time');
        if (felt) felt.value = nu.toISOString().slice(0, 10) + 'T' + String(nu.getHours()).padStart(2, '0') + ':' + String(nu.getMinutes()).padStart(2, '0');
        opdaterCareFelter();
    }
});

document.getElementById('btn-add-care')?.addEventListener('click', () => {
    const type = document.getElementById('care-type').value;
    const raa = document.getElementById('care-time').value;
    if (!raa) { alert(T('pickTime')); return; }
    const d = new Date(raa);
    if (isNaN(d.getTime())) { alert(T('pickTime')); return; }
    const entry = {
        id: 'c' + Date.now() + Math.random().toString(36).slice(2, 6),
        type, dato: isoKey(d), tid: d.getTime(),
        note: document.getElementById('care-note').value.trim()
    };
    if (type === 'amning') {
        entry.side = document.getElementById('care-side').value;
        const m = talFraFelt('care-min'); if (m) entry.min = m;
    }
    if (type === 'flaske' || type === 'mad') {
        const ml = talFraFelt('care-ml'); if (ml) entry.ml = ml;
    }
    if (type === 'ble') entry.ble = document.getElementById('care-diaper').value;
    tilfoejPleje(entry);
    document.getElementById('care-note').value = "";
    document.getElementById('care-min').value = "";
    document.getElementById('care-ml').value = "";
    document.getElementById('care-detail').style.display = 'none';
});

// ---------- overblik ----------
document.querySelectorAll('.crange-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.crange-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        cLogFra = dateKeyOffset(Number(btn.dataset.cdays) - 1);
        cLogTil = todayKey();
        const f = document.getElementById('crange-from'), t = document.getElementById('crange-to');
        if (f) f.value = cLogFra; if (t) t.value = cLogTil;
        renderCareStats();
    });
});
document.getElementById('btn-apply-crange')?.addEventListener('click', () => {
    const f = document.getElementById('crange-from').value, t = document.getElementById('crange-to').value;
    if (!f || !t || f > t) { alert(T('endBeforeStart')); return; }
    cLogFra = f; cLogTil = t;
    document.querySelectorAll('.crange-btn').forEach(b => b.classList.remove('active'));
    renderCareStats();
});
document.querySelectorAll('.chart-tab[data-carechart]').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.chart-tab[data-carechart]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        aktivtCareChart = tab.dataset.carechart;
        tegnCareChart();
    });
});

function careDage() {
    const ud = [];
    const slut = keyToDate(cLogTil), d = keyToDate(cLogFra);
    let vagt = 0;
    while (d <= slut && vagt < 400) {
        const key = isoKey(d);
        ud.push({ key, entries: plejeListe(key) });
        d.setDate(d.getDate() + 1); vagt++;
    }
    return ud;
}

function renderCareStats() {
    const info = document.getElementById('crange-info');
    const dage = careDage();
    if (info) info.textContent = `${T('showing')} ${dage.length} ${T('days')}: ${formatDateDK(cLogFra)} – ${formatDateDK(cLogTil)}`;

    const el = document.getElementById('care-stats');
    if (el) {
        const medData = dage.filter(d => d.entries.length);
        const maal = dage.reduce((s, d) => s + d.entries.filter(e => e.type !== 'ble').length, 0);
        const bleer = dage.reduce((s, d) => s + d.entries.filter(e => e.type === 'ble').length, 0);
        const ml = dage.reduce((s, d) => s + d.entries.reduce((a, e) => a + (e.ml || 0), 0), 0);
        const ammeMin = dage.reduce((s, d) => s + d.entries.reduce((a, e) => a + (e.min || 0), 0), 0);
        const n = medData.length || 1;
        const kort = [
            { v: (maal / n).toFixed(1), l: T('statFeedsDay'), n: `${maal} ${T('inTotal')}` },
            { v: (bleer / n).toFixed(1), l: T('statNappiesDay'), n: `${bleer} ${T('inTotal')}` },
            { v: ml ? Math.round(ml / n) + " ml" : "–", l: T('statMlDay'), n: ml ? `${ml} ml ${T('inTotal')}` : "" },
            { v: ammeMin ? Math.round(ammeMin / n) + " " + T('minShort') : "–", l: T('statBreastDay'), n: ammeMin ? `${ammeMin} ${T('minShort')} ${T('inTotal')}` : "" },
            { v: medData.length, l: T('daysWithData'), n: "" }
        ];
        el.innerHTML = kort.map(k => `<div class="stat-card"><div class="stat-value">${k.v}</div>
            <div class="stat-label">${k.l}</div>${k.n ? `<div class="stat-note">${k.n}</div>` : ''}</div>`).join('');
    }
    tegnCareChart();
}

function tegnCareChart() {
    const area = document.getElementById('care-chart');
    const help = document.getElementById('care-chart-help');
    if (!area) return;
    const dage = careDage();
    const iDag = todayKey();

    if (aktivtCareChart === 'feeds') {
        area.innerHTML = barChart(dage.map(d => ({ label: shortDate(d.key), value: d.entries.filter(e => e.type !== 'ble').length, highlight: d.key === iDag })), { format: v => Math.round(v) });
        if (help) help.textContent = T('helpFeeds');
    } else if (aktivtCareChart === 'diapers') {
        area.innerHTML = barChart(dage.map(d => ({ label: shortDate(d.key), value: d.entries.filter(e => e.type === 'ble').length, highlight: d.key === iDag })), { format: v => Math.round(v) });
        if (help) help.textContent = T('helpNappies');
    } else if (aktivtCareChart === 'ml') {
        const harMl = dage.some(d => d.entries.some(e => e.ml));
        area.innerHTML = harMl
            ? barChart(dage.map(d => ({ label: shortDate(d.key), value: d.entries.reduce((a, e) => a + (e.ml || 0), 0), highlight: d.key === iDag })), { format: v => Math.round(v) + ' ml' })
            : emptyChart(T('noMlYet'));
        if (help) help.textContent = T('helpMl');
    } else {
        const rows = dage.map(d => ({
            label: shortDate(d.key),
            marks: d.entries.filter(e => e.tid).map(e => {
                const dt = new Date(e.tid);
                return { min: dt.getHours() * 60 + dt.getMinutes(), icon: CARE_IKON[e.type] || '•', title: `${careTypeNavn(e.type)} ${clockFromMs(e.tid)}` };
            })
        })).filter(r => r.marks.length);
        area.innerHTML = rows.length ? dayTimeline(rows) : emptyChart(T('noDataPeriod'));
        if (help) help.textContent = T('helpCareClock');
    }
}

function renderCare() {
    opdaterPlejeHero();
    renderPlejeDag();
    renderCareStats();
}

document.addEventListener('DOMContentLoaded', () => {
    const f = document.getElementById('crange-from'), t = document.getElementById('crange-to');
    if (f) f.value = cLogFra; if (t) t.value = cLogTil;
    opdaterCareFelter();
    setInterval(opdaterPlejeHero, 60000);
});
