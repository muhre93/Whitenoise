// ==================================================
// BabyBasen — growth.js
// Målinger, WHO-kurver og egne måletyper
// ==================================================

let aktivKurve = 'vaegt';

function alderIMdrVedDato(dateKey) {
    if (!babyBirthDate) return null;
    const f = keyToDate(babyBirthDate), d = keyToDate(dateKey);
    return (d - f) / (1000 * 60 * 60 * 24 * 30.4375);
}

function whoSaet(maal) {
    const koen = (babyGender === 'dreng' || babyGender === 'pige') ? babyGender : 'neutral';
    return (WHO_DATA[koen] || {})[maal] || null;
}

function whoPunkter(maal, felt, maxMdr) {
    const saet = whoSaet(maal);
    if (!saet) return [];
    return Object.keys(saet).map(Number).sort((a, b) => a - b)
        .filter(m => m <= maxMdr + 1)
        .map(m => ({ x: m, y: saet[m][felt] }));
}

function whoVurdering(maal, mdr, vaerdi) {
    const saet = whoSaet(maal);
    if (!saet || mdr == null) return "";
    const aldre = Object.keys(saet).map(Number).sort((a, b) => a - b);
    let naermest = aldre[0];
    aldre.forEach(a => { if (Math.abs(a - mdr) < Math.abs(naermest - mdr)) naermest = a; });
    const r = saet[naermest];
    if (!r) return "";
    if (vaerdi < r.min) return T('whoBelow');
    if (vaerdi > r.max) return T('whoAbove');
    return T('whoNormal');
}

// ---------- egne måletyper ----------
function renderCustomFields() {
    const box = document.getElementById('custom-fields');
    if (!box) return;
    const egne = growthData.customTypes || [];
    box.innerHTML = egne.length ? `<div class="measure-form">` + egne.map(c => `
        <label class="field"><span>${esc(c.navn)}${c.enhed ? ' (' + esc(c.enhed) + ')' : ''}</span>
        <input type="text" inputmode="decimal" class="custom-input" data-cid="${c.id}"></label>`).join('') + `</div>` : "";
}

document.getElementById('btn-add-custom')?.addEventListener('click', async () => {
    const navn = prompt(T('ownNameAsk'));
    if (!navn) return;
    const enhed = prompt(T('ownUnitAsk')) || "";
    if (!growthData.customTypes) growthData.customTypes = [];
    growthData.customTypes.push({ id: 'x' + Date.now(), navn: navn.trim(), enhed: enhed.trim() });
    await gemVaekstData();
    renderCustomFields();
    renderGrowthTabs();
});

// ---------- gem måling ----------
document.getElementById('btn-add-measure')?.addEventListener('click', async () => {
    const dato = document.getElementById('m-date').value || todayKey();
    const m = {
        id: 'm' + Date.now(),
        dato,
        vaegt: talFraFelt('m-vaegt'),
        laengde: talFraFelt('m-laengde'),
        hoved: talFraFelt('m-hoved'),
        note: document.getElementById('m-note').value.trim(),
        egne: {}
    };
    document.querySelectorAll('.custom-input').forEach(inp => {
        const v = talFraFelt(inp);
        if (v) m.egne[inp.dataset.cid] = v;
    });
    if (!m.vaegt && !m.laengde && !m.hoved && !Object.keys(m.egne).length) { alert(T('fillOne')); return; }
    if (!growthData.measurements) growthData.measurements = [];
    growthData.measurements.push(m);
    growthData.measurements.sort((a, b) => a.dato.localeCompare(b.dato));
    await gemVaekstData();
    spor('maalingGemt');
    ['m-vaegt', 'm-laengde', 'm-hoved', 'm-note'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ""; });
    document.querySelectorAll('.custom-input').forEach(i => i.value = "");
    renderGrowth();
});

async function sletMaaling(id) {
    if (!confirm(T('deleteMeasureSure'))) return;
    growthData.measurements = (growthData.measurements || []).filter(m => m.id !== id);
    await gemVaekstData();
    renderGrowth();
}

// ---------- fanerne over grafen ----------
function renderGrowthTabs() {
    const box = document.getElementById('growth-tabs');
    if (!box) return;
    const faner = [
        { id: 'vaegt', navn: T('weightKg') },
        { id: 'laengde', navn: T('lengthCm') },
        { id: 'hoved', navn: T('headCm') }
    ];
    (growthData.customTypes || []).forEach(c => faner.push({ id: 'x:' + c.id, navn: c.navn }));
    box.innerHTML = faner.map(f =>
        `<button class="chart-tab ${f.id === aktivKurve ? 'active' : ''}" data-growth="${f.id}">${esc(f.navn)}</button>`).join('');
    box.querySelectorAll('.chart-tab').forEach(b => b.addEventListener('click', () => {
        aktivKurve = b.dataset.growth;
        renderGrowthTabs();
        tegnGrowthChart();
    }));
}

function tegnGrowthChart() {
    const area = document.getElementById('growth-chart');
    if (!area) return;
    const maalinger = (growthData.measurements || []).slice().sort((a, b) => a.dato.localeCompare(b.dato));

    const egen = aktivKurve.startsWith('x:');
    const cid = egen ? aktivKurve.slice(2) : null;
    const felt = egen ? null : aktivKurve;

    const punkter = maalinger.map(m => {
        const v = egen ? (m.egne || {})[cid] : m[felt];
        if (!v) return null;
        const mdr = alderIMdrVedDato(m.dato);
        return { x: mdr != null ? mdr : maalinger.indexOf(m), y: v, label: `${formatDateDK(m.dato)}: ${v}` };
    }).filter(Boolean);

    if (!punkter.length) { area.innerHTML = emptyChart(T('noMeasuresYet')); return; }

    const maxMdr = Math.max(...punkter.map(p => p.x), 1);
    const serier = [{ points: punkter, klasse: 'c-s1' }];
    let bands = [], legend = `<span class="c-key"><i class="c-swatch c-sw-s1"></i>${esc(babyName)}</span>`;

    if (!egen && babyBirthDate && whoSaet(felt)) {
        const lav = whoPunkter(felt, 'min', maxMdr);
        const hoej = whoPunkter(felt, 'max', maxMdr);
        const med = whoPunkter(felt, 'med', maxMdr);
        if (lav.length && hoej.length) bands = [{ lower: lav, upper: hoej }];
        if (med.length) serier.push({ points: med, klasse: 'c-s2', dots: false });
        legend += `<span class="c-key"><i class="c-swatch c-sw-s2"></i>${T('whoMedian')}</span>
                   <span class="c-key"><i class="c-swatch c-sw-band"></i>${T('whoBand')}</span>`;
    }

    const enhed = egen ? ((growthData.customTypes || []).find(c => c.id === cid) || {}).enhed || "" : (felt === 'vaegt' ? 'kg' : 'cm');
    area.innerHTML = lineChart({
        series: serier, bands,
        formatY: v => (Math.round(v * 10) / 10) + (enhed ? ' ' + enhed : ''),
        formatX: v => Math.round(v) + ' ' + T('monthsShort'),
        xTicks: 6, legend
    });
}

function renderMeasureList() {
    const box = document.getElementById('measure-list');
    if (!box) return;
    const maalinger = (growthData.measurements || []).slice().sort((a, b) => b.dato.localeCompare(a.dato));
    if (!maalinger.length) { box.innerHTML = `<div class="empty-state">${T('noMeasuresYet')}</div>`; return; }
    box.innerHTML = maalinger.map(m => {
        const mdr = alderIMdrVedDato(m.dato);
        const dele = [];
        if (m.vaegt) dele.push(`${m.vaegt} kg <em>${whoVurdering('vaegt', mdr, m.vaegt)}</em>`);
        if (m.laengde) dele.push(`${m.laengde} cm <em>${whoVurdering('laengde', mdr, m.laengde)}</em>`);
        if (m.hoved) dele.push(`${m.hoved} cm <em>${whoVurdering('hoved', mdr, m.hoved)}</em>`);
        Object.keys(m.egne || {}).forEach(k => {
            const c = (growthData.customTypes || []).find(x => x.id === k);
            if (c) dele.push(`${esc(c.navn)}: ${m.egne[k]} ${esc(c.enhed || '')}`);
        });
        return `<div class="measure-row">
            <div><strong>${formatDateDK(m.dato)}</strong>${mdr != null ? ` <span class="care-meta">${minTekstMdr(mdr)}</span>` : ''}
            <div class="measure-vals">${dele.join(' · ')}</div>
            ${m.note ? `<div class="care-meta">${esc(m.note)}</div>` : ''}</div>
            <button class="delete-btn" onclick="sletMaaling('${m.id}')">❌</button>
        </div>`;
    }).join('');
}

function minTekstMdr(mdr) {
    const hele = Math.floor(mdr);
    if (hele < 1) return T('underMonth');
    return hele + " " + (hele === 1 ? T('monthOne') : T('monthMany'));
}

function renderGrowth() {
    const sub = document.getElementById('growth-sub');
    if (sub) {
        const sidste = (growthData.measurements || []).slice().sort((a, b) => b.dato.localeCompare(a.dato))[0];
        sub.textContent = sidste ? T('growthLast', { dato: formatDateDK(sidste.dato) }) : T('growthNone');
    }
    const d = document.getElementById('m-date');
    if (d && !d.value) d.value = todayKey();
    renderCustomFields();
    renderGrowthTabs();
    tegnGrowthChart();
    renderMeasureList();
}
