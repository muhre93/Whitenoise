// ==================================================
// BabyRo — care.js
// Mad og bleer. Ét tryk registrerer nu;
// dagens liste kan rettes og bladres i.
// ==================================================

let careChart = 'feeds';
let careDagOffset = 0;   // 0 = i dag, 1 = i går ...
let careFra = dateKeyOffset(6);
let careTil = todayKey();

const CARE_TYPER = {
    amning:   { get navn(){return T("breastfeed");}, ikon: "🤱", mad: true },
    flaske:   { get navn(){return T("bottle");}, ikon: "🍼", mad: true },
    mad:      { get navn(){return T("solids");}, ikon: "🥣", mad: true },
    ble:      { get navn(){return T("nappy");}, ikon: "👶", mad: false }
};
function bleTekst(k){ return { vaad: T("wetShort"), afforing: T("dirtyShort"), begge: T("bothShort") }[k] || ""; }

// ==========================================
// DATA
// ==========================================
function alleCareEntries() {
    const out = [];
    Object.keys(careData).forEach(ym => (careData[ym] || []).forEach(e => out.push(e)));
    return out.sort((a, b) => a.ts - b.ts);
}
function careForDag(dateKey) {
    return alleCareEntries().filter(e => isoKey(new Date(e.ts)) === dateKey);
}
function sidsteMaaltid() {
    const mad = alleCareEntries().filter(e => CARE_TYPER[e.type] && CARE_TYPER[e.type].mad);
    return mad.length ? mad[mad.length - 1] : null;
}
function sidsteBle() {
    const b = alleCareEntries().filter(e => e.type === 'ble');
    return b.length ? b[b.length - 1] : null;
}

async function tilfoejCare(entry) {
    entry.id = 'c' + Date.now() + Math.random().toString(36).slice(2, 6);
    const ym = monthKey(isoKey(new Date(entry.ts)));
    if (!careData[ym]) careData[ym] = [];
    careData[ym].push(entry);
    careData[ym].sort((a, b) => a.ts - b.ts);
    await gemPlejeMaaned(ym);
    careDagOffset = 0;
    renderCare();
    renderPlanCard();
}

window.sletCare = async function (id, ym) {
    if (!confirm(T('deleteEntry'))) return;
    careData[ym] = (careData[ym] || []).filter(e => e.id !== id);
    await gemPlejeMaaned(ym);
    renderCare();
    renderPlanCard();
};

// Ret tidspunktet på en registrering — det sker tit, at man
// trykker et kvarter for sent, når man har hænderne fulde.
window.retCareTid = async function (id, ym) {
    const liste = careData[ym] || [];
    const e = liste.find(x => x.id === id);
    if (!e) return;
    const nu = new Date(e.ts);
    const svar = prompt(T('askTime'),
        String(nu.getHours()).padStart(2, '0') + ':' + String(nu.getMinutes()).padStart(2, '0'));
    if (!svar) return;
    const m = /^(\d{1,2})[:.](\d{2})$/.exec(svar.trim());
    if (!m) { alert(T('badTime')); return; }
    const ny = new Date(e.ts);
    ny.setHours(Number(m[1]), Number(m[2]), 0, 0);
    e.ts = ny.getTime();
    liste.sort((a, b) => a.ts - b.ts);
    await gemPlejeMaaned(ym);
    renderCare();
    renderPlanCard();
};

// ==========================================
// HURTIGKNAPPER
// ==========================================
document.querySelectorAll('[data-quick]').forEach(btn => {
    btn.addEventListener('click', async () => {
        const q = btn.dataset.quick;
        const ts = Date.now();
        if (q === 'vaad' || q === 'afforing' || q === 'begge') await tilfoejCare({ type: 'ble', ts, ble: q });
        else await tilfoejCare({ type: q, ts });
        btn.classList.add('flash');
        setTimeout(() => btn.classList.remove('flash'), 700);
    });
});

// ==========================================
// DETALJERET FORMULAR
// ==========================================
document.getElementById('btn-toggle-detail')?.addEventListener('click', () => {
    const d = document.getElementById('care-detail');
    const b = document.getElementById('btn-toggle-detail');
    const aaben = d.style.display !== 'none';
    d.style.display = aaben ? 'none' : 'block';
    b.textContent = aaben ? '✏️ Tilføj med eget tidspunkt og detaljer' : '✕ Luk';
    if (!aaben) opdaterCareFelter();
});

function opdaterCareFelter() {
    const type = document.getElementById('care-type')?.value;
    const vis = (id, ja) => { const el = document.getElementById(id); if (el) el.style.display = ja ? 'block' : 'none'; };
    vis('wrap-care-side', type === 'amning');
    vis('wrap-care-min', type === 'amning');
    vis('wrap-care-ml', type === 'flaske');
    vis('wrap-care-diaper', type === 'ble');
}
document.getElementById('care-type')?.addEventListener('change', opdaterCareFelter);

document.getElementById('btn-add-care')?.addEventListener('click', async () => {
    const type = document.getElementById('care-type').value;
    const tid = document.getElementById('care-time').value;
    const ts = tid ? new Date(tid).getTime() : Date.now();
    const entry = { type, ts, note: document.getElementById('care-note').value.trim() || "" };

    if (type === 'amning') {
        entry.side = document.getElementById('care-side').value;
        const m = talFraFelt('care-min');
        if (!isNaN(m)) entry.min = Math.round(m);
    }
    if (type === 'flaske') {
        const ml = talFraFelt('care-ml');
        if (!isNaN(ml)) entry.ml = Math.round(ml);
    }
    if (type === 'ble') entry.ble = document.getElementById('care-diaper').value;

    await tilfoejCare(entry);
    ['care-note', 'care-min', 'care-ml'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('care-detail').style.display = 'none';
    document.getElementById('btn-toggle-detail').textContent = '✏️ Tilføj med eget tidspunkt og detaljer';
});

// ==========================================
// DAGENS OVERBLIK
// ==========================================
function careLinje(e) {
    const t = CARE_TYPER[e.type] || { navn: e.type, ikon: '•' };
    let detalje = "";
    if (e.type === 'amning') {
        const sider = { venstre: T('left').toLowerCase(), hoejre: T('right').toLowerCase(), begge: T('bothSides').toLowerCase() };
        detalje = [e.side ? sider[e.side] : '', e.min ? `${e.min} min` : ''].filter(Boolean).join(', ');
    }
    if (e.type === 'flaske' && e.ml) detalje = `${e.ml} ml`;
    if (e.type === 'ble') detalje = bleTekst(e.ble);
    return { ikon: t.ikon, navn: t.navn, detalje, note: e.note };
}

function renderCareHero() {
    const idag = careForDag(todayKey());
    const maaltider = idag.filter(e => CARE_TYPER[e.type] && CARE_TYPER[e.type].mad).length;
    const bleer = idag.filter(e => e.type === 'ble').length;

    const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    s('che-feeds', maaltider);
    s('che-diapers', bleer);
    s('che-label-feeds', T(maaltider === 1 ? 'feedToday' : 'feedsToday'));
    s('che-label-diapers', T(bleer === 1 ? 'nappyToday' : 'nappiesToday'));

    const mad = sidsteMaaltid(), ble = sidsteBle();
    s('che-feed-since', mad ? `${T('lastAt')} ${clockFromMs(mad.ts)} · ${minTekst((Date.now() - mad.ts) / 60000)} ${T('ago')}` : T('none'));
    s('che-diaper-since', ble ? `${T('lastAt')} ${clockFromMs(ble.ts)} · ${minTekst((Date.now() - ble.ts) / 60000)} ${T('ago')}` : T('none'));
    s('care-hero-date', formatDateDK(todayKey()).split(' den ')[0] + ' — i dag');

    // Kort, konkret vurdering i stedet for bare tal
    const note = document.getElementById('care-hero-note');
    if (!note) return;
    const alder = alderIMdr();
    const vaade = idag.filter(e => e.type === 'ble' && (e.ble === 'vaad' || e.ble === 'begge')).length;
    const timer = new Date().getHours() + new Date().getMinutes() / 60;

    if (!idag.length) { note.textContent = T('noEntriesYet'); return; }
    if (alder != null && alder < 6 && timer > 18) {
        if (vaade >= 6) note.innerHTML = `✅ ${vaade} våde bleer i dag — det tyder på, at ${esc(babyName)} får rigeligt at drikke.`;
        else note.innerHTML = `Der er registreret ${vaade} våde bleer i dag. Under 6 på et helt døgn kan være værd at nævne for sundhedsplejersken — men husk kun at tælle med, hvis du har registreret hele dagen.`;
    } else {
        note.textContent = `${maaltider} ${T(maaltider === 1 ? 'feedToday' : 'feedsToday')} · ${bleer} ${T(bleer === 1 ? 'nappyToday' : 'nappiesToday')}`;
    }
}

// Dagene i den valgte periode på Overblik-fanen
function carePeriodeDage() {
    const out = [];
    const d = keyToDate(careFra), slut = keyToDate(careTil);
    let vagt = 0;
    while (d <= slut && vagt < 400) {
        const key = isoKey(d);
        const e = careForDag(key);
        out.push({
            key,
            maaltider: e.filter(x => CARE_TYPER[x.type] && CARE_TYPER[x.type].mad).length,
            bleer: e.filter(x => x.type === 'ble').length,
            ml: e.reduce((s, x) => s + (x.ml || 0), 0),
            entries: e
        });
        d.setDate(d.getDate() + 1);
        vagt++;
    }
    return out;
}

function saetCarePeriode(dage) {
    careFra = dateKeyOffset(dage - 1);
    careTil = todayKey();
    const f = document.getElementById('crange-from'), t = document.getElementById('crange-to');
    if (f) f.value = careFra;
    if (t) t.value = careTil;
    renderCareStats();
    tegnCareChart();
    opdaterCareInfo();
}

function opdaterCareInfo() {
    const el = document.getElementById('crange-info');
    if (!el) return;
    const n = carePeriodeDage().length;
    el.textContent = `${T('showing')} ${n} ${T('days')}: ${formatDateDK(careFra)} – ${formatDateDK(careTil)}`;
}

document.querySelectorAll('.crange-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.crange-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        saetCarePeriode(Number(btn.dataset.cdays));
    });
});
document.getElementById('btn-apply-crange')?.addEventListener('click', () => {
    const f = document.getElementById('crange-from').value;
    const t = document.getElementById('crange-to').value;
    if (!f || !t || f > t) { alert(T('endBeforeStart')); return; }
    careFra = f; careTil = t;
    document.querySelectorAll('.crange-btn').forEach(b => b.classList.remove('active'));
    renderCareStats(); tegnCareChart(); opdaterCareInfo();
});

function careDage(antal) {
    const out = [];
    for (let i = antal - 1; i >= 0; i--) {
        const key = dateKeyOffset(i);
        const e = careForDag(key);
        out.push({
            key,
            maaltider: e.filter(x => CARE_TYPER[x.type] && CARE_TYPER[x.type].mad).length,
            bleer: e.filter(x => x.type === 'ble').length,
            ml: e.reduce((s, x) => s + (x.ml || 0), 0),
            entries: e
        });
    }
    return out;
}

// ==========================================
// DAGENS LISTE (kan bladres)
// ==========================================
function renderCareListe() {
    const el = document.getElementById('care-today');
    const titel = document.getElementById('care-list-title');
    const prev = document.getElementById('care-prev');
    const next = document.getElementById('care-next');
    if (!el) return;

    const key = dateKeyOffset(careDagOffset);
    if (titel) titel.textContent = careDagOffset === 0 ? T('dayEntries') : formatDateDK(key);
    if (next) next.disabled = careDagOffset === 0;
    if (prev) prev.textContent = '‹ ' + (careDagOffset === 0 ? T('yesterday') : T('dayBefore'));

    const liste = careForDag(key).slice().reverse();
    if (!liste.length) {
        el.innerHTML = `<p class="empty-state">${careDagOffset === 0 ? T('noEntriesToday') : T('noEntriesDay')}</p>`;
        return;
    }

    const maaltider = liste.filter(e => CARE_TYPER[e.type] && CARE_TYPER[e.type].mad).length;
    const bleer = liste.filter(e => e.type === 'ble').length;

    el.innerHTML = `<p class="dag-sum">${maaltider} ${T(maaltider === 1 ? 'feedToday' : 'feedsToday').replace(/ i dag| today/,'')} · ${bleer} ${T(bleer === 1 ? 'nappyToday' : 'nappiesToday').replace(/ i dag| today/,'')}</p>
        <ul class="care-list">` + liste.map(e => {
        const l = careLinje(e);
        const ym = monthKey(isoKey(new Date(e.ts)));
        const erMad = CARE_TYPER[e.type] && CARE_TYPER[e.type].mad;
        return `<li class="care-item ${erMad ? 'mad' : 'ble'}">
            <span class="ci-time">${clockFromMs(e.ts)}</span>
            <span class="ci-icon">${l.ikon}</span>
            <span class="ci-text">
                <strong>${esc(l.navn)}</strong>${l.detalje ? ` <span class="ci-detail">${esc(l.detalje)}</span>` : ''}
                ${l.note ? `<small>${esc(l.note)}</small>` : ''}
            </span>
            <span class="ci-actions">
                <button class="mini-btn" onclick="retCareTid('${e.id}','${ym}')" title="${T('editTime')}">🕘</button>
                <button class="delete-btn" onclick="sletCare('${e.id}','${ym}')">❌</button>
            </span>
        </li>`;
    }).join('') + `</ul>`;
}

document.getElementById('care-prev')?.addEventListener('click', () => { careDagOffset++; renderCareListe(); });
document.getElementById('care-next')?.addEventListener('click', () => {
    if (careDagOffset > 0) { careDagOffset--; renderCareListe(); }
});

// ==========================================
// OVERBLIK
// ==========================================
function renderCareStats() {
    const el = document.getElementById('care-stats');
    if (!el) return;
    const dage = carePeriodeDage();
    const medData = dage.filter(d => d.entries.length);
    const gnsMad = medData.length ? dage.reduce((s, d) => s + d.maaltider, 0) / medData.length : 0;
    const gnsBle = medData.length ? dage.reduce((s, d) => s + d.bleer, 0) / medData.length : 0;
    const gnsMl = medData.length ? dage.reduce((s, d) => s + d.ml, 0) / medData.length : 0;
    const totalMad = dage.reduce((s, d) => s + d.maaltider, 0);
    const totalBle = dage.reduce((s, d) => s + d.bleer, 0);
    const totalMl = dage.reduce((s, d) => s + d.ml, 0);

    const kort = [
        { v: gnsMad ? gnsMad.toFixed(1) : "–", l: T('feedsPerDay'), n: `${totalMad} ${T('statTotal').toLowerCase()}` },
        { v: gnsBle ? gnsBle.toFixed(1) : "–", l: T('nappiesPerDay'), n: `${totalBle} ${T('statTotal').toLowerCase()}` },
        { v: gnsMl ? Math.round(gnsMl) + " ml" : "–", l: T('milkMl'), n: totalMl ? `${totalMl} ml ${T('statTotal').toLowerCase()}` : "" },
        { v: medData.length, l: T('daysWithData'), n: "" }
    ];
    el.innerHTML = kort.map(k => `<div class="stat-card">
        <div class="stat-value">${k.v}</div><div class="stat-label">${k.l}</div>
        ${k.n ? `<div class="stat-note">${k.n}</div>` : ''}</div>`).join('');
}

function tegnCareChart() {
    const area = document.getElementById('care-chart');
    const help = document.getElementById('care-chart-help');
    if (!area) return;
    const dage = carePeriodeDage();
    const iDag = todayKey();

    if (careChart === 'feeds') {
        area.innerHTML = barChart(dage.map(d => ({ label: shortDate(d.key), value: d.maaltider, highlight: d.key === iDag })), { format: v => Math.round(v) });
        help.textContent = T('helpFeeds');
    } else if (careChart === 'diapers') {
        area.innerHTML = barChart(dage.map(d => ({ label: shortDate(d.key), value: d.bleer, highlight: d.key === iDag })), { format: v => Math.round(v) });
        help.textContent = T('helpNappies');
    } else if (careChart === 'ml') {
        area.innerHTML = barChart(dage.map(d => ({ label: shortDate(d.key), value: d.ml, highlight: d.key === iDag })), { format: v => Math.round(v) + ' ml' });
        help.textContent = T('helpMl');
    } else if (careChart === 'clock') {
        const rows = dage.map(d => ({
            label: shortDate(d.key),
            blocks: d.entries.map(e => {
                const dt = new Date(e.ts);
                const l = careLinje(e);
                const start = dt.getHours() * 60 + dt.getMinutes();
                return { startMin: start, endMin: start + 12, title: `${clockFromMs(e.ts)} ${l.navn}${l.detalje ? ' · ' + l.detalje : ''}` };
            })
        })).filter(r => r.blocks.length);
        area.innerHTML = dayTimeline(rows);
        help.textContent = T('helpCareClock');
    }
}

document.querySelectorAll('[data-carechart]').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('[data-carechart]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        careChart = tab.dataset.carechart;
        tegnCareChart();
    });
});

function renderCare() {
    const el = document.getElementById('care-time');
    if (el && !el.value) {
        const n = new Date();
        n.setMinutes(n.getMinutes() - n.getTimezoneOffset());
        el.value = n.toISOString().slice(0, 16);
    }
    opdaterCareFelter();
    renderCareHero();
    renderCareListe();
    const f = document.getElementById('crange-from'), t = document.getElementById('crange-to');
    if (f && !f.value) f.value = careFra;
    if (t && !t.value) t.value = careTil;
    renderCareStats();
    tegnCareChart();
    opdaterCareInfo();
}

document.addEventListener('DOMContentLoaded', () => {
    renderCare();
    setInterval(renderCareHero, 60000);
});
