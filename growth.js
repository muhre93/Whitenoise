// ==================================================
// BabyRo — growth.js
// Vægt, længde, hovedomfang og dine egne målinger
// sammenholdt med WHO's vækstkurver.
// ==================================================

let aktivtMaal = 'vaegt';

function alleMaalTyper() {
    const egne = {};
    (growthData.customTypes || []).forEach(c => {
        egne[c.id] = { navn: c.navn, enhed: c.enhed, ikon: '✨', egen: true };
    });
    return Object.assign({}, MAAL_TYPER, egne);
}

async function gemVaekst() {
    if (isGuest || !currentUserId || !db) {
        alert("Log ind med Google under Profil for at gemme målinger.");
        return false;
    }
    try {
        await db.collection("users").doc(currentUserId).set({ growth: growthData }, { merge: true });
        return true;
    } catch (e) {
        alert("Kunne ikke gemme: " + e.message);
        return false;
    }
}

// Alder i måneder på måletidspunktet
function alderVedDato(dato) {
    if (!babyBirthDate) return null;
    const b = new Date(babyBirthDate + "T00:00:00");
    const d = new Date(dato + "T00:00:00");
    return (d - b) / (1000 * 60 * 60 * 24 * 30.4375);
}

// ==========================================
// TILFØJ MÅLING
// ==========================================
document.getElementById('btn-add-measure')?.addEventListener('click', async () => {
    const dato = document.getElementById('m-date').value;
    if (!dato) { alert("Vælg en dato for målingen."); return; }

    const maaling = { dato, note: document.getElementById('m-note').value.trim() || "" };
    let noget = false;

    ['vaegt', 'laengde', 'hoved'].forEach(k => {
        const el = document.getElementById('m-' + k);
        const v = parseFloat(String(el.value).replace(',', '.'));
        if (!isNaN(v) && v > 0) { maaling[k] = v; noget = true; }
    });
    (growthData.customTypes || []).forEach(c => {
        const el = document.getElementById('m-custom-' + c.id);
        if (!el) return;
        const v = parseFloat(String(el.value).replace(',', '.'));
        if (!isNaN(v)) { maaling[c.id] = v; noget = true; }
    });

    if (!noget) { alert("Udfyld mindst én måling."); return; }

    growthData.measurements = (growthData.measurements || []).filter(m => m.dato !== dato);
    growthData.measurements.push(maaling);
    growthData.measurements.sort((a, b) => a.dato.localeCompare(b.dato));

    if (await gemVaekst()) {
        ['m-vaegt', 'm-laengde', 'm-hoved', 'm-note'].forEach(id => { document.getElementById(id).value = ''; });
        (growthData.customTypes || []).forEach(c => {
            const el = document.getElementById('m-custom-' + c.id);
            if (el) el.value = '';
        });
        renderGrowth();
    }
});

document.getElementById('btn-add-custom')?.addEventListener('click', async () => {
    const navn = prompt("Hvad vil du måle? (f.eks. Fodlængde, Maveomfang)");
    if (!navn || !navn.trim()) return;
    const enhed = prompt("Hvilken enhed? (f.eks. cm, kg, ml)", "cm");
    if (!enhed) return;
    const id = 'egen-' + navn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-4);
    growthData.customTypes = growthData.customTypes || [];
    growthData.customTypes.push({ id, navn: navn.trim(), enhed: enhed.trim() });
    if (await gemVaekst()) renderGrowth();
});

window.sletMaaling = async function (dato) {
    if (!confirm(`Slet målingen fra ${dato}?`)) return;
    growthData.measurements = growthData.measurements.filter(m => m.dato !== dato);
    if (await gemVaekst()) renderGrowth();
};

window.sletEgenType = async function (id) {
    const type = (growthData.customTypes || []).find(c => c.id === id);
    if (!type) return;
    if (!confirm(`Slet målingstypen "${type.navn}" og alle dens værdier?`)) return;
    growthData.customTypes = growthData.customTypes.filter(c => c.id !== id);
    growthData.measurements.forEach(m => { delete m[id]; });
    if (aktivtMaal === id) aktivtMaal = 'vaegt';
    if (await gemVaekst()) renderGrowth();
};

// ==========================================
// OPTEGNING
// ==========================================
function renderCustomFields() {
    const wrap = document.getElementById('custom-fields');
    if (!wrap) return;
    const egne = growthData.customTypes || [];
    if (!egne.length) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = `<div class="measure-form">` + egne.map(c => `
        <label class="field">
            <span>${c.navn} (${c.enhed})
                <button class="mini-del" onclick="sletEgenType('${c.id}')" title="Slet denne målingstype">✕</button>
            </span>
            <input type="number" step="0.01" id="m-custom-${c.id}">
        </label>`).join('') + `</div>`;
}

function renderGrowthTabs() {
    const el = document.getElementById('growth-tabs');
    if (!el) return;
    const typer = alleMaalTyper();
    el.innerHTML = Object.keys(typer).map(k =>
        `<button class="chart-tab ${k === aktivtMaal ? 'active' : ''}" data-maal="${k}">${typer[k].ikon || '✨'} ${typer[k].navn}</button>`
    ).join('');
    el.querySelectorAll('[data-maal]').forEach(b => {
        b.addEventListener('click', () => { aktivtMaal = b.dataset.maal; renderGrowth(); });
    });
}

function tegnVaekstChart() {
    const area = document.getElementById('growth-chart');
    if (!area) return;
    const typer = alleMaalTyper();
    const type = typer[aktivtMaal];
    if (!type) { area.innerHTML = ''; return; }

    const maalinger = (growthData.measurements || [])
        .filter(m => m[aktivtMaal] != null)
        .sort((a, b) => a.dato.localeCompare(b.dato));

    if (!babyBirthDate) {
        area.innerHTML = `<div class="chart-empty">Indtast fødselsdato under Profil, så kan kurven tegnes efter alder.</div>`;
        return;
    }
    if (!maalinger.length) {
        area.innerHTML = `<div class="chart-empty">Ingen målinger af ${type.navn.toLowerCase()} endnu. Tilføj den første ovenfor.</div>`;
        return;
    }

    const punkter = maalinger.map(m => {
        const mdr = alderVedDato(m.dato);
        return {
            x: Math.max(0, mdr),
            y: m[aktivtMaal],
            label: `${new Date(m.dato).toLocaleDateString('da-DK')}: ${m[aktivtMaal]} ${type.enhed} (${mdr.toFixed(1)} mdr.)`
        };
    });

    const maxAlder = Math.max(3, Math.ceil(Math.max(...punkter.map(p => p.x)) + 1));
    let bands = [], legend = `<span class="c-key"><i class="c-swatch c-sw-s1"></i>${babyName}</span>`;

    // WHO-kurver findes kun for de tre standardmål
    if (!type.egen && WHO_DATA[babyGender] && WHO_DATA[babyGender][aktivtMaal]) {
        const ref = WHO_DATA[babyGender][aktivtMaal];
        const aldre = Object.keys(ref).map(Number).sort((a, b) => a - b).filter(a => a <= maxAlder + 3);
        bands = [{
            lower: aldre.map(a => ({ x: a, y: ref[a][0] })),
            upper: aldre.map(a => ({ x: a, y: ref[a][2] }))
        }];
        const median = aldre.map(a => ({ x: a, y: ref[a][1] }));
        legend += `<span class="c-key"><i class="c-swatch c-sw-s2"></i>WHO median</span>
                   <span class="c-key"><i class="c-swatch c-sw-band"></i>Normalområde</span>`;

        area.innerHTML = lineChart({
            series: [
                { points: median, klasse: 'c-s2', dots: false },
                { points: punkter, klasse: 'c-s1' }
            ],
            bands, xMin: 0, xMax: maxAlder,
            formatY: v => v.toFixed(1),
            formatX: v => Math.round(v) + " mdr",
            xTicks: Math.min(6, maxAlder),
            legend
        });
    } else {
        area.innerHTML = lineChart({
            series: [{ points: punkter, klasse: 'c-s1' }],
            xMin: 0, xMax: maxAlder,
            formatY: v => v.toFixed(1),
            formatX: v => Math.round(v) + " mdr",
            xTicks: Math.min(6, maxAlder),
            legend
        });
    }

    // Kort status under kurven
    const sidste = maalinger[maalinger.length - 1];
    const vurdering = vurderMaaling(sidste);
    if (vurdering) area.insertAdjacentHTML('beforeend', `<p class="growth-status">${vurdering}</p>`);
}

function vurderMaaling(m) {
    const typer = alleMaalTyper();
    const type = typer[aktivtMaal];
    if (!type || type.egen) return "";
    const ref = WHO_DATA[babyGender] && WHO_DATA[babyGender][aktivtMaal];
    if (!ref) return "";
    const mdr = alderVedDato(m.dato);
    if (mdr == null || mdr < 0) return "";

    const aldre = Object.keys(ref).map(Number).sort((a, b) => a - b);
    const naermest = aldre.reduce((best, a) => Math.abs(a - mdr) < Math.abs(best - mdr) ? a : best, aldre[0]);
    const [lav, median, hoej] = ref[naermest];
    const v = m[aktivtMaal];

    let tekst = `Seneste måling: <strong>${v} ${type.enhed}</strong> ved ${mdr.toFixed(1)} måneder. `;
    tekst += `Det typiske for alderen er ${median} ${type.enhed} (normalområde ${lav}-${hoej}). `;
    if (v < lav) tekst += `${babyName} ligger under normalområdet — nævn det gerne ved næste besøg hos sundhedsplejersken.`;
    else if (v > hoej) tekst += `${babyName} ligger over normalområdet — det er ofte helt fint, men tal med sundhedsplejersken.`;
    else tekst += `Det ligger pænt inden for normalområdet.`;
    return tekst;
}

function renderMeasureList() {
    const el = document.getElementById('measure-list');
    if (!el) return;
    const typer = alleMaalTyper();
    const m = (growthData.measurements || []).slice().sort((a, b) => b.dato.localeCompare(a.dato));
    if (!m.length) { el.innerHTML = `<p class="empty-state">Ingen målinger gemt endnu.</p>`; return; }

    const kolonner = Object.keys(typer).filter(k => m.some(x => x[k] != null));
    el.innerHTML = `<div class="table-scroll"><table class="data-table">
        <thead><tr><th>Dato</th><th>Alder</th>
            ${kolonner.map(k => `<th>${typer[k].navn}<br><small>${typer[k].enhed}</small></th>`).join('')}
            <th>Note</th><th></th></tr></thead>
        <tbody>${m.map(x => {
            const mdr = alderVedDato(x.dato);
            return `<tr>
                <td>${new Date(x.dato).toLocaleDateString('da-DK')}</td>
                <td>${mdr != null ? mdr.toFixed(1) + ' mdr' : '–'}</td>
                ${kolonner.map(k => `<td>${x[k] != null ? x[k] : '–'}</td>`).join('')}
                <td>${x.note || ''}</td>
                <td><button class="delete-btn" onclick="sletMaaling('${x.dato}')">❌</button></td>
            </tr>`;
        }).join('')}</tbody></table></div>`;
}

function renderGrowth() {
    const locked = document.getElementById('growth-locked');
    const content = document.getElementById('growth-content');
    if (locked) locked.style.display = isGuest ? 'block' : 'none';
    if (content) content.style.opacity = isGuest ? '0.55' : '1';

    const dateEl = document.getElementById('m-date');
    if (dateEl && !dateEl.value) dateEl.value = todayKey();

    renderCustomFields();
    renderGrowthTabs();
    tegnVaekstChart();
    renderMeasureList();
}

document.getElementById('btn-print-growth')?.addEventListener('click', () => window.print());
document.addEventListener('DOMContentLoaded', renderGrowth);
