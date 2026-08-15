// ==================================================
// BabyRo — care.js
// Mad og bleer. Ét tryk registrerer nu;
// dagens liste kan rettes og bladres i.
// ==================================================

let careChart = 'feeds';
let careDagOffset = 0;   // 0 = i dag, 1 = i går ...

const CARE_TYPER = {
    amning:   { navn: "Amning",    ikon: "🤱", mad: true },
    flaske:   { navn: "Flaske",    ikon: "🍼", mad: true },
    mad:      { navn: "Fast føde", ikon: "🥣", mad: true },
    ble:      { navn: "Ble",       ikon: "👶", mad: false }
};
const BLE_TEKST = { vaad: "💧 Våd", afforing: "💩 Afføring", begge: "🌊 Våd + afføring" };

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
    if (!confirm("Slet denne registrering?")) return;
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
    const svar = prompt("Hvad var klokken? (f.eks. 14:35)",
        String(nu.getHours()).padStart(2, '0') + ':' + String(nu.getMinutes()).padStart(2, '0'));
    if (!svar) return;
    const m = /^(\d{1,2})[:.](\d{2})$/.exec(svar.trim());
    if (!m) { alert("Skriv tidspunktet som timer:minutter, f.eks. 14:35."); return; }
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
        const sider = { venstre: 'venstre', hoejre: 'højre', begge: 'begge sider' };
        detalje = [e.side ? sider[e.side] : '', e.min ? `${e.min} min` : ''].filter(Boolean).join(', ');
    }
    if (e.type === 'flaske' && e.ml) detalje = `${e.ml} ml`;
    if (e.type === 'ble') detalje = BLE_TEKST[e.ble] || '';
    return { ikon: t.ikon, navn: t.navn, detalje, note: e.note };
}

function renderCareHero() {
    const idag = careForDag(todayKey());
    const maaltider = idag.filter(e => CARE_TYPER[e.type] && CARE_TYPER[e.type].mad).length;
    const bleer = idag.filter(e => e.type === 'ble').length;

    const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    s('che-feeds', maaltider);
    s('che-diapers', bleer);
    s('che-label-feeds', maaltider === 1 ? 'måltid i dag' : 'måltider i dag');
    s('che-label-diapers', bleer === 1 ? 'ble i dag' : 'bleer i dag');

    const mad = sidsteMaaltid(), ble = sidsteBle();
    s('che-feed-since', mad ? `Sidst kl. ${clockFromMs(mad.ts)} · for ${minTekst((Date.now() - mad.ts) / 60000)} siden` : 'Endnu ingen');
    s('che-diaper-since', ble ? `Sidst kl. ${clockFromMs(ble.ts)} · for ${minTekst((Date.now() - ble.ts) / 60000)} siden` : 'Endnu ingen');
    s('care-hero-date', formatDateDK(todayKey()).split(' den ')[0] + ' — i dag');

    // Kort, konkret vurdering i stedet for bare tal
    const note = document.getElementById('care-hero-note');
    if (!note) return;
    const alder = alderIMdr();
    const vaade = idag.filter(e => e.type === 'ble' && (e.ble === 'vaad' || e.ble === 'begge')).length;
    const timer = new Date().getHours() + new Date().getMinutes() / 60;

    if (!idag.length) { note.textContent = "Ingen registreringer i dag endnu. Tryk på en knap nedenfor, når det sker."; return; }
    if (alder != null && alder < 6 && timer > 18) {
        if (vaade >= 6) note.innerHTML = `✅ ${vaade} våde bleer i dag — det tyder på, at ${esc(babyName)} får rigeligt at drikke.`;
        else note.innerHTML = `Der er registreret ${vaade} våde bleer i dag. Under 6 på et helt døgn kan være værd at nævne for sundhedsplejersken — men husk kun at tælle med, hvis du har registreret hele dagen.`;
    } else {
        note.textContent = `${maaltider} ${maaltider === 1 ? 'måltid' : 'måltider'} og ${bleer} ${bleer === 1 ? 'ble' : 'bleer'} registreret i dag.`;
    }
}

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
    if (titel) titel.textContent = careDagOffset === 0 ? "Dagens registreringer" : formatDateDK(key);
    if (next) next.disabled = careDagOffset === 0;
    if (prev) prev.textContent = '‹ ' + (careDagOffset === 0 ? 'I går' : 'Dagen før');

    const liste = careForDag(key).slice().reverse();
    if (!liste.length) {
        el.innerHTML = `<p class="empty-state">Ingen registreringer ${careDagOffset === 0 ? 'i dag' : 'denne dag'}.</p>`;
        return;
    }

    const maaltider = liste.filter(e => CARE_TYPER[e.type] && CARE_TYPER[e.type].mad).length;
    const bleer = liste.filter(e => e.type === 'ble').length;

    el.innerHTML = `<p class="dag-sum">${maaltider} ${maaltider === 1 ? 'måltid' : 'måltider'} · ${bleer} ${bleer === 1 ? 'ble' : 'bleer'}</p>
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
                <button class="mini-btn" onclick="retCareTid('${e.id}','${ym}')" title="Ret tidspunktet">🕘</button>
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
    const dage = careDage(7);
    const medData = dage.filter(d => d.entries.length);
    const gnsMad = medData.length ? dage.reduce((s, d) => s + d.maaltider, 0) / medData.length : 0;
    const gnsBle = medData.length ? dage.reduce((s, d) => s + d.bleer, 0) / medData.length : 0;
    const gnsMl = medData.length ? dage.reduce((s, d) => s + d.ml, 0) / medData.length : 0;
    const idag = dage[dage.length - 1];

    const kort = [
        { v: idag.maaltider, l: "Måltider i dag", n: gnsMad ? `Gns. ${gnsMad.toFixed(1)} pr. dag` : "" },
        { v: idag.bleer, l: "Bleer i dag", n: gnsBle ? `Gns. ${gnsBle.toFixed(1)} pr. dag` : "" },
        { v: idag.ml ? idag.ml + " ml" : "–", l: "Flaske i dag", n: gnsMl ? `Gns. ${Math.round(gnsMl)} ml` : "" },
        { v: medData.length, l: "Dage med data", n: "Sidste 7 dage" }
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
        area.innerHTML = barChart(dage.map(d => ({ label: shortDate(d.key), value: d.maaltider, highlight: d.key === iDag })), { format: v => Math.round(v) });
        help.textContent = "Antal måltider pr. dag. Nyfødte spiser typisk 8-12 gange i døgnet; det falder gradvist med alderen.";
    } else if (careChart === 'diapers') {
        area.innerHTML = barChart(dage.map(d => ({ label: shortDate(d.key), value: d.bleer, highlight: d.key === iDag })), { format: v => Math.round(v) });
        help.textContent = "Antal bleer pr. dag. Mindst 6 våde bleer i døgnet tyder på, at barnet får nok at drikke.";
    } else if (careChart === 'ml') {
        area.innerHTML = barChart(dage.map(d => ({ label: shortDate(d.key), value: d.ml, highlight: d.key === iDag })), { format: v => Math.round(v) + ' ml' });
        help.textContent = "Mælk fra flaske pr. dag. Amning kan ikke måles i ml og tælles derfor ikke med her.";
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
    renderCareHero();
    renderCareListe();
    renderCareStats();
    tegnCareChart();
}

document.addEventListener('DOMContentLoaded', () => {
    renderCare();
    setInterval(renderCareHero, 60000);
});
