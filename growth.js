// ==================================================
// BabyRo — growth.js
// Vægt, længde, hovedomfang og egne målinger
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

function alderVedDato(dato) {
    if (!babyBirthDate) return null;
    const b = new Date(babyBirthDate + "T00:00:00");
    return (new Date(dato + "T00:00:00") - b) / (1000 * 60 * 60 * 24 * 30.4375);
}

document.getElementById('btn-add-measure')?.addEventListener('click', async () => {
    if (isGuest) { alert(T('loginToSaveGrowth')); return; }
    const dato = document.getElementById('m-date').value;
    if (!dato) { alert(T('pickDate')); return; }

    const maaling = { dato, note: document.getElementById('m-note').value.trim() || "" };
    let noget = false;
    ['vaegt', 'laengde', 'hoved'].forEach(k => {
        const v = talFraFelt('m-' + k);
        if (!isNaN(v) && v > 0) { maaling[k] = v; noget = true; }
    });
    (growthData.customTypes || []).forEach(c => {
        const v = talFraFelt('m-custom-' + c.id);
        if (!isNaN(v)) { maaling[c.id] = v; noget = true; }
    });
    if (!noget) { alert(T('fillOne')); return; }

    growthData.measurements = (growthData.measurements || []).filter(m => m.dato !== dato);
    growthData.measurements.push(maaling);
    growthData.measurements.sort((a, b) => a.dato.localeCompare(b.dato));

    if (await gemVaekstData()) {
        ['m-vaegt', 'm-laengde', 'm-hoved', 'm-note'].forEach(id => { document.getElementById(id).value = ''; });
        (growthData.customTypes || []).forEach(c => {
            const el = document.getElementById('m-custom-' + c.id);
            if (el) el.value = '';
        });
        renderGrowth();
    }
});

document.getElementById('btn-add-custom')?.addEventListener('click', async () => {
    if (isGuest) { alert(T('loginToSaveGrowth')); return; }
    const navn = prompt("Hvad vil du måle? (f.eks. Fodlængde, Maveomfang)");
    if (!navn || !navn.trim()) return;
    const enhed = prompt("Hvilken enhed? (f.eks. cm, kg, ml)", "cm");
    if (!enhed) return;
    const id = 'egen-' + navn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-4);
    growthData.customTypes = growthData.customTypes || [];
    growthData.customTypes.push({ id, navn: navn.trim(), enhed: enhed.trim() });
    if (await gemVaekstData()) renderGrowth();
});

window.sletMaaling = async function (dato) {
    if (!confirm(`Slet målingen fra ${dato}?`)) return;
    growthData.measurements = growthData.measurements.filter(m => m.dato !== dato);
    if (await gemVaekstData()) renderGrowth();
};

window.sletEgenType = async function (id) {
    const type = (growthData.customTypes || []).find(c => c.id === id);
    if (!type || !confirm(`Slet målingstypen "${type.navn}" og alle dens værdier?`)) return;
    growthData.customTypes = growthData.customTypes.filter(c => c.id !== id);
    growthData.measurements.forEach(m => { delete m[id]; });
    if (aktivtMaal === id) aktivtMaal = 'vaegt';
    if (await gemVaekstData()) renderGrowth();
};

function renderCustomFields() {
    const wrap = document.getElementById('custom-fields');
    if (!wrap) return;
    const egne = growthData.customTypes || [];
    if (!egne.length) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = `<div class="measure-form">` + egne.map(c => `
        <label class="field"><span>${esc(c.navn)} (${esc(c.enhed)})
            <button class="mini-del" onclick="sletEgenType('${c.id}')" title="Slet denne type">✕</button></span>
            <input type="text" inputmode="decimal" id="m-custom-${c.id}" placeholder="0,0"></label>`).join('') + `</div>`;
}

function renderGrowthTabs() {
    const el = document.getElementById('growth-tabs');
    if (!el) return;
    const typer = alleMaalTyper();
    el.innerHTML = `<button class="chart-tab ${aktivtMaal === 'samlet' ? 'active' : ''}" data-maal="samlet">⚖️📏 ${T('weightLength')}</button>` +
        Object.keys(typer).map(k =>
        `<button class="chart-tab ${k === aktivtMaal ? 'active' : ''}" data-maal="${k}">${typer[k].ikon || '✨'} ${esc(typer[k].navn)}</button>`
    ).join('');
    el.querySelectorAll('[data-maal]').forEach(b =>
        b.addEventListener('click', () => { aktivtMaal = b.dataset.maal; renderGrowth(); }));
}

function tegnVaekstChart() {
    const area = document.getElementById('growth-chart');
    if (!area) return;
    if (aktivtMaal === 'samlet') { tegnSamletChart(area); return; }
    const typer = alleMaalTyper();
    const type = typer[aktivtMaal];
    if (!type) { area.innerHTML = ''; return; }

    const maalinger = (growthData.measurements || []).filter(m => m[aktivtMaal] != null)
        .sort((a, b) => a.dato.localeCompare(b.dato));

    if (!babyBirthDate) {
        area.innerHTML = `<div class="chart-empty">${T('noBirthDate')}</div>`;
        return;
    }
    if (!maalinger.length) {
        area.innerHTML = `<div class="chart-empty">${T('noMeasures')}</div>`;
        return;
    }

    const punkter = maalinger.map(m => {
        const mdr = alderVedDato(m.dato);
        return { x: Math.max(0, mdr), y: m[aktivtMaal],
            label: `${new Date(m.dato).toLocaleDateString(locale())}: ${talTilFelt(m[aktivtMaal])} ${type.enhed} (${mdr.toFixed(1)} mdr.)` };
    });
    const maxAlder = Math.max(3, Math.ceil(Math.max(...punkter.map(p => p.x)) + 1));
    let legend = `<span class="c-key"><i class="c-swatch c-sw-s1"></i>${esc(babyName)}</span>`;

    if (!type.egen && WHO_DATA[babyGender]?.[aktivtMaal]) {
        const ref = WHO_DATA[babyGender][aktivtMaal];
        const aldre = Object.keys(ref).map(Number).sort((a, b) => a - b).filter(a => a <= maxAlder + 3);
        const bands = [{ lower: aldre.map(a => ({ x: a, y: ref[a][0] })), upper: aldre.map(a => ({ x: a, y: ref[a][2] })) }];
        legend += `<span class="c-key"><i class="c-swatch c-sw-s2"></i>${T('whoMedian')}</span>
                   <span class="c-key"><i class="c-swatch c-sw-band"></i>${T('normalRange')}</span>`;
        area.innerHTML = lineChart({
            series: [{ points: aldre.map(a => ({ x: a, y: ref[a][1] })), klasse: 'c-s2', dots: false },
                     { points: punkter, klasse: 'c-s1' }],
            bands, xMin: 0, xMax: maxAlder,
            formatY: v => v.toFixed(1), formatX: v => Math.round(v) + " mdr",
            xTicks: Math.min(6, maxAlder), legend
        });
    } else {
        area.innerHTML = lineChart({
            series: [{ points: punkter, klasse: 'c-s1' }],
            xMin: 0, xMax: maxAlder,
            formatY: v => v.toFixed(1), formatX: v => Math.round(v) + " mdr",
            xTicks: Math.min(6, maxAlder), legend
        });
    }

    const vurdering = vurderMaaling(maalinger[maalinger.length - 1]);
    if (vurdering) area.insertAdjacentHTML('beforeend', `<p class="growth-status">${vurdering}</p>`);
}

// Vægt og længde vist som to rigtige WHO-kurver under hinanden.
// Samme udseende som de øvrige, men samlet ét sted — for det er
// forholdet mellem dem, sundhedsplejersken kigger på.
function enWhoKurve(maalNoegle) {
    const type = MAAL_TYPER[maalNoegle];
    const maalinger = (growthData.measurements || [])
        .filter(m => m[maalNoegle] != null)
        .sort((a, b) => a.dato.localeCompare(b.dato));

    if (!maalinger.length) {
        return `<div class="kurve-blok"><h4>${type.ikon} ${T(maalNoegle === 'vaegt' ? 'weightKg' : 'lengthCm')}</h4>
            <div class="chart-empty">${T('noMeasures')}</div></div>`;
    }

    const punkter = maalinger.map(m => {
        const mdr = alderVedDato(m.dato);
        return {
            x: Math.max(0, mdr), y: m[maalNoegle],
            label: `${new Date(m.dato).toLocaleDateString(locale())}: ${talTilFelt(m[maalNoegle])} ${type.enhed} (${mdr.toFixed(1)} ${T('months')}.)`
        };
    });
    const maxAlder = Math.max(3, Math.ceil(Math.max(...punkter.map(p => p.x)) + 1));
    const ref = WHO_DATA[babyGender] && WHO_DATA[babyGender][maalNoegle];

    let bands = [], series = [{ points: punkter, klasse: 'c-s1' }];
    let legend = `<span class="c-key"><i class="c-swatch c-sw-s1"></i>${esc(babyName)}</span>`;
    if (ref) {
        const aldre = Object.keys(ref).map(Number).sort((a, b) => a - b).filter(a => a <= maxAlder + 3);
        bands = [{ lower: aldre.map(a => ({ x: a, y: ref[a][0] })), upper: aldre.map(a => ({ x: a, y: ref[a][2] })) }];
        series.unshift({ points: aldre.map(a => ({ x: a, y: ref[a][1] })), klasse: 'c-s2', dots: false });
        legend += `<span class="c-key"><i class="c-swatch c-sw-s2"></i>${T('whoMedian')}</span>
                   <span class="c-key"><i class="c-swatch c-sw-band"></i>${T('normalRange')}</span>`;
    }

    return `<div class="kurve-blok">
        <h4>${type.ikon} ${T(maalNoegle === 'vaegt' ? 'weightKg' : 'lengthCm')}</h4>
        ${lineChart({
            series, bands, xMin: 0, xMax: maxAlder,
            formatY: v => v.toFixed(1),
            formatX: v => Math.round(v) + " " + T('months'),
            xTicks: Math.min(6, maxAlder), legend
        })}
    </div>`;
}

function tegnSamletChart(area) {
    if (!babyBirthDate) {
        area.innerHTML = `<div class="chart-empty">${T('noBirthDate')}</div>`;
        return;
    }
    const harNoget = (growthData.measurements || []).some(m => m.vaegt != null || m.laengde != null);
    if (!harNoget) {
        area.innerHTML = `<div class="chart-empty">${T('noMeasures')}</div>`;
        return;
    }

    area.innerHTML = enWhoKurve('vaegt') + enWhoKurve('laengde');

    // Kort vurdering af, om de to følges ad
    function pctAfMedian(maal, vaerdi, mdr) {
        const ref = WHO_DATA[babyGender] && WHO_DATA[babyGender][maal];
        if (!ref) return null;
        const aldre = Object.keys(ref).map(Number).sort((a, b) => a - b);
        const naermest = aldre.reduce((b, a) => Math.abs(a - mdr) < Math.abs(b - mdr) ? a : b, aldre[0]);
        return (vaerdi / ref[naermest][1]) * 100;
    }
    const sidsteV = (growthData.measurements || []).filter(m => m.vaegt != null).sort((a, b) => a.dato.localeCompare(b.dato)).pop();
    const sidsteL = (growthData.measurements || []).filter(m => m.laengde != null).sort((a, b) => a.dato.localeCompare(b.dato)).pop();

    if (sidsteV && sidsteL) {
        const pv = pctAfMedian('vaegt', sidsteV.vaegt, Math.max(0, alderVedDato(sidsteV.dato)));
        const pl = pctAfMedian('laengde', sidsteL.laengde, Math.max(0, alderVedDato(sidsteL.dato)));
        if (pv != null && pl != null) {
            const forskel = Math.abs(pv - pl);
            let tekst;
            if (forskel < 8) tekst = T('proportional');
            else if (pv > pl) tekst = T('heavierThanLong');
            else tekst = T('longerThanHeavy');
            area.insertAdjacentHTML('beforeend',
                `<p class="growth-status">${T('latestBoth', { v: talTilFelt(sidsteV.vaegt), l: talTilFelt(sidsteL.laengde) })} ${tekst} ${T('sameLevelMatters')}</p>`);
        }
    } else {
        area.insertAdjacentHTML('beforeend', `<p class="growth-status">${T('needBoth')}</p>`);
    }
}

function vurderMaaling(m) {
    const type = alleMaalTyper()[aktivtMaal];
    if (!type || type.egen) return "";
    const ref = WHO_DATA[babyGender]?.[aktivtMaal];
    if (!ref) return "";
    const mdr = alderVedDato(m.dato);
    if (mdr == null || mdr < 0) return "";
    const aldre = Object.keys(ref).map(Number).sort((a, b) => a - b);
    const naermest = aldre.reduce((best, a) => Math.abs(a - mdr) < Math.abs(best - mdr) ? a : best, aldre[0]);
    const [lav, median, hoej] = ref[naermest];
    const v = m[aktivtMaal];
    let tekst = `Seneste måling: <strong>${talTilFelt(v)} ${type.enhed}</strong> ved ${mdr.toFixed(1)} måneder. `;
    tekst += `Det typiske for alderen er ${talTilFelt(median)} ${type.enhed} (normalområde ${talTilFelt(lav)}-${talTilFelt(hoej)}). `;
    if (v < lav) tekst += `${esc(babyName)} ligger under normalområdet — nævn det gerne ved næste besøg hos sundhedsplejersken.`;
    else if (v > hoej) tekst += `${esc(babyName)} ligger over normalområdet — det er ofte helt fint, men tal med sundhedsplejersken.`;
    else tekst += `Det ligger pænt inden for normalområdet.`;
    return tekst;
}

function renderMeasureList() {
    const el = document.getElementById('measure-list');
    if (!el) return;
    const typer = alleMaalTyper();
    const m = (growthData.measurements || []).slice().sort((a, b) => b.dato.localeCompare(a.dato));
    if (!m.length) { el.innerHTML = `<p class="empty-state">${T('noMeasures')}</p>`; return; }
    const kolonner = Object.keys(typer).filter(k => m.some(x => x[k] != null));
    el.innerHTML = `<div class="table-scroll"><table class="data-table">
        <thead><tr><th>${T('date')}</th><th>${T('age')}</th>
            ${kolonner.map(k => `<th>${esc(typer[k].navn)}<br><small>${esc(typer[k].enhed)}</small></th>`).join('')}
            <th>Note</th><th></th></tr></thead>
        <tbody>${m.map(x => {
            const mdr = alderVedDato(x.dato);
            return `<tr><td>${new Date(x.dato).toLocaleDateString(locale())}</td>
                <td>${mdr != null ? mdr.toFixed(1) + ' ' + T('months') : '–'}</td>
                ${kolonner.map(k => `<td>${x[k] != null ? talTilFelt(x[k]) : '–'}</td>`).join('')}
                <td>${esc(x.note || '')}</td>
                <td><button class="delete-btn" onclick="sletMaaling('${x.dato}')">❌</button></td></tr>`;
        }).join('')}</tbody></table></div>`;
}

function renderGrowth() {
    const msLock = document.getElementById('ms-locked');
    if (msLock) msLock.style.display = isGuest ? 'block' : 'none';
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

document.addEventListener('DOMContentLoaded', renderGrowth);
