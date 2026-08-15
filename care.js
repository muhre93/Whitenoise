// ==================================================
// BabyRo — care.js
// Amning, flaske, fast føde og bleer.
// ==================================================

let careChart = 'feeds';

const CARE_TYPER = {
    amning:   { navn: "Amning",    ikon: "🤱", mad: true },
    flaske:   { navn: "Flaske",    ikon: "🍼", mad: true },
    mad:      { navn: "Fast føde", ikon: "🥣", mad: true },
    ble:      { navn: "Ble",       ikon: "👶", mad: false }
};
const BLE_TEKST = { vaad: "💧 Våd", afforing: "💩 Afføring", begge: "🌊 Begge dele" };

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
    const mad = alleCareEntries().filter(e => CARE_TYPER[e.type]?.mad);
    return mad.length ? mad[mad.length - 1] : null;
}
function sidsteBle() {
    const bleer = alleCareEntries().filter(e => e.type === 'ble');
    return bleer.length ? bleer[bleer.length - 1] : null;
}

async function tilfoejCare(entry) {
    entry.id = 'c' + Date.now() + Math.random().toString(36).slice(2, 6);
    const ym = monthKey(isoKey(new Date(entry.ts)));
    if (!careData[ym]) careData[ym] = [];
    careData[ym].push(entry);
    careData[ym].sort((a, b) => a.ts - b.ts);
    await gemPlejeMaaned(ym);
    renderCare();
    renderPlanCard();
}

window.sletCare = async function (id, ym) {
    if (!confirm("Slet denne registrering?")) return;
    careData[ym] = (careData[ym] || []).filter(e => e.id !== id);
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
        if (q === 'vaad' || q === 'afforing' || q === 'begge') {
            await tilfoejCare({ type: 'ble', ts, ble: q });
        } else {
            await tilfoejCare({ type: q, ts });
        }
        btn.classList.add('flash');
        setTimeout(() => btn.classList.remove('flash'), 600);
    });
});

// ==========================================
// DETALJERET FORMULAR
// ==========================================
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
    document.getElementById('care-note').value = '';
    document.getElementById('care-min').value = '';
    document.getElementById('care-ml').value = '';
});

// ==========================================
// VISNING
// ==========================================
function careLinje(e) {
    const t = CARE_TYPER[e.type] || { navn: e.type, ikon: '•' };
    let detalje = "";
    if (e.type === 'amning') {
        const sider = { venstre: 'venstre', hoejre: 'højre', begge: 'begge' };
        detalje = [e.side ? sider[e.side] : '', e.min ? `${e.min} min` : ''].filter(Boolean).join(', ');
    }
    if (e.type === 'flaske' && e.ml) detalje = `${e.ml} ml`;
    if (e.type === 'ble') detalje = BLE_TEKST[e.ble] || '';
    return { ikon: t.ikon, navn: t.navn, detalje, note: e.note };
}

function renderCareToday() {
    const el = document.getElementById('care-today');
    if (!el) return;
    const idag = careForDag(todayKey()).slice().reverse();
    if (!idag.length) { el.innerHTML = `<p class="empty-state">Ingen registreringer i dag endnu.</p>`; return; }
    el.innerHTML = `<ul class="log-list">` + idag.map(e => {
        const l = careLinje(e);
        const ym = monthKey(isoKey(new Date(e.ts)));
        return `<li>
            <span>${l.ikon} <strong>${clockFromMs(e.ts)}</strong> ${esc(l.navn)}${l.detalje ? ' · ' + esc(l.detalje) : ''}
                ${l.note ? `<br><small>${esc(l.note)}</small>` : ''}</span>
            <button class="delete-btn" onclick="sletCare('${e.id}','${ym}')">❌</button>
        </li>`;
    }).join('') + `</ul>`;
}

function renderCareSince() {
    const mad = sidsteMaaltid(), ble = sidsteBle();
    const f = document.getElementById('care-last-feed');
    const d = document.getElementById('care-last-diaper');
    if (f) f.textContent = mad ? minTekst((Date.now() - mad.ts) / 60000) : '–';
    if (d) d.textContent = ble ? minTekst((Date.now() - ble.ts) / 60000) : '–';
}

function careDage(antal) {
    const out = [];
    for (let i = antal - 1; i >= 0; i--) {
        const key = dateKeyOffset(i);
        const e = careForDag(key);
        out.push({
            key,
            maaltider: e.filter(x => CARE_TYPER[x.type]?.mad).length,
            bleer: e.filter(x => x.type === 'ble').length,
            ml: e.reduce((s, x) => s + (x.ml || 0), 0),
            entries: e
        });
    }
    return out;
}

function renderCareStats() {
    const el = document.getElementById('care-stats');
    if (!el) return;
    const dage = careDage(7);
    const medData = dage.filter(d => d.entries.length);
    const gnsMad = medData.length ? dage.reduce((s, d) => s + d.maaltider, 0) / medData.length : 0;
    const gnsBle = medData.length ? dage.reduce((s, d) => s + d.bleer, 0) / medData.length : 0;
    const gnsMl = medData.length ? dage.reduce((s, d) => s + d.ml, 0) / medData.length : 0;
    const idag = dage[dage.length - 1];

    const kort = [
        { v: idag.maaltider, l: "Måltider i dag", n: gnsMad ? `Gns. ${gnsMad.toFixed(1)} pr. dag` : "" },
        { v: idag.bleer, l: "Bleer i dag", n: gnsBle ? `Gns. ${gnsBle.toFixed(1)} pr. dag` : "" },
        { v: idag.ml ? idag.ml + " ml" : "–", l: "Mælk i dag", n: gnsMl ? `Gns. ${Math.round(gnsMl)} ml` : "" }
    ];
    el.innerHTML = kort.map(k => `<div class="stat-card">
        <div class="stat-value">${k.v}</div><div class="stat-label">${k.l}</div>
        ${k.n ? `<div class="stat-note">${k.n}</div>` : ''}</div>`).join('');
}

function tegnCareChart() {
    const area = document.getElementById('care-chart');
    const help = document.getElementById('care-chart-help');
    if (!area) return;
    const dage = careDage(14);
    const iDag = todayKey();

    if (careChart === 'feeds') {
        area.innerHTML = barChart(dage.map(d => ({ label: shortDate(d.key), value: d.maaltider, highlight: d.key === iDag })),
            { format: v => Math.round(v) });
        help.textContent = "Antal måltider pr. dag de sidste 14 dage. Nyfødte spiser typisk 8-12 gange i døgnet.";
    }
    else if (careChart === 'diapers') {
        area.innerHTML = barChart(dage.map(d => ({ label: shortDate(d.key), value: d.bleer, highlight: d.key === iDag })),
            { format: v => Math.round(v) });
        help.textContent = "Antal bleer pr. dag. 6 eller flere våde bleer i døgnet tyder på, at barnet får nok at drikke.";
    }
    else if (careChart === 'ml') {
        area.innerHTML = barChart(dage.map(d => ({ label: shortDate(d.key), value: d.ml, highlight: d.key === iDag })),
            { format: v => Math.round(v) + ' ml' });
        help.textContent = "Mælk fra flaske pr. dag. Amning tælles ikke med her — den kan ikke måles i ml.";
    }
    else if (careChart === 'clock') {
        const rows = dage.map(d => ({
            label: shortDate(d.key),
            blocks: d.entries.map(e => {
                const dt = new Date(e.ts);
                const start = dt.getHours() * 60 + dt.getMinutes();
                const l = careLinje(e);
                return { startMin: start, endMin: start + 12, title: `${clockFromMs(e.ts)} ${l.navn}${l.detalje ? ' · ' + l.detalje : ''}` };
            })
        })).filter(r => r.blocks.length);
        area.innerHTML = dayTimeline(rows);
        help.textContent = "Hvornår på døgnet der blev spist og skiftet. Her ser du hurtigt, om der er ved at komme rytme i det.";
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
    renderCareSince();
    renderCareStats();
    tegnCareChart();
    renderCareToday();
}

document.addEventListener('DOMContentLoaded', () => {
    renderCare();
    setInterval(renderCareSince, 60000);
});
