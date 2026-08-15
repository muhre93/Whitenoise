// ==================================================
// BabyRo — report.js
// Rapport til sundhedsplejersken.
// Standard 30 dage, men perioden kan vælges frit,
// og to børn kan stilles op ved siden af hinanden.
// ==================================================

let repDage = 30;
let repFra = "", repTil = "";
let repSammenlign = "";

document.querySelectorAll('.rep-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.rep-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        repDage = Number(btn.dataset.repdays);
        repFra = ""; repTil = "";
        const f = document.getElementById('rep-from'), t = document.getElementById('rep-to');
        if (f) f.value = ""; if (t) t.value = "";
        opdaterRapportInfo();
    });
});

['rep-from', 'rep-to'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
        repFra = document.getElementById('rep-from').value;
        repTil = document.getElementById('rep-to').value;
        if (repFra && repTil) document.querySelectorAll('.rep-btn').forEach(b => b.classList.remove('active'));
        opdaterRapportInfo();
    });
});

document.getElementById('rep-compare')?.addEventListener('change', (e) => {
    repSammenlign = e.target.value;
});

function rapportPeriode() {
    if (repFra && repTil && repFra <= repTil) {
        const dage = Math.round((keyToDate(repTil) - keyToDate(repFra)) / 86400000) + 1;
        return { fra: repFra, til: repTil, antal: Math.min(dage, 400) };
    }
    return { fra: dateKeyOffset(repDage - 1), til: todayKey(), antal: repDage };
}

function opdaterRapportInfo() {
    const vaelger = document.getElementById('rep-compare');
    const wrap = document.getElementById('rep-compare-wrap');

    // Sammenligning giver kun mening med mere end ét barn
    if (vaelger && wrap && typeof childList !== 'undefined') {
        const andre = childList.filter(c => c.id !== childId);
        wrap.style.display = andre.length ? 'block' : 'none';
        const nuvaerende = vaelger.value;
        vaelger.innerHTML = `<option value="">Ingen sammenligning</option>` +
            andre.map(c => `<option value="${c.id}">${esc(c.name || 'Baby')}</option>`).join('');
        if (andre.some(c => c.id === nuvaerende)) vaelger.value = nuvaerende;
        else repSammenlign = "";
    }

    const el = document.getElementById('rep-info');
    if (!el) return;
    const p = rapportPeriode();
    el.textContent = `Rapporten dækker ${p.antal} dage: ${formatDateDK(p.fra)} – ${formatDateDK(p.til)}`;
}

// ==========================================
// DATA
// ==========================================
function rapportDage(periode, logs, careListe) {
    const out = [];
    const d = keyToDate(periode.fra), slut = keyToDate(periode.til);
    let vagt = 0;
    while (d <= slut && vagt < 400) {
        const key = isoKey(d);
        const s = (logs && logs[key]) || { sessions: [], total: 0 };
        const c = (careListe || []).filter(e => isoKey(new Date(e.ts)) === key);
        out.push({
            key, total: s.total || 0, lure: (s.sessions || []).length,
            maaltider: c.filter(x => CARE_TYPER[x.type] && CARE_TYPER[x.type].mad).length,
            bleer: c.filter(x => x.type === 'ble').length
        });
        d.setDate(d.getDate() + 1);
        vagt++;
    }
    return out;
}

// Henter et andet barns data, så to søskende kan stilles op ved siden af hinanden
async function hentBarnData(cid) {
    if (!db || isGuest) return null;
    try {
        const base = db.collection("children").doc(cid);
        const [barn, sleepSnap, growthDoc, careSnap] = await Promise.all([
            base.get(), base.collection("sleep").get(),
            base.collection("data").doc("growth").get(), base.collection("care").get()
        ]);
        const logs = {};
        sleepSnap.forEach(doc => Object.assign(logs, doc.data().days || {}));
        const care = [];
        careSnap.forEach(doc => care.push(...(doc.data().entries || [])));
        return {
            info: barn.exists ? barn.data() : {},
            logs, care,
            growth: growthDoc.exists ? growthDoc.data() : { measurements: [] }
        };
    } catch (e) {
        console.log("Kunne ikke hente det andet barn:", e);
        return null;
    }
}

function noegletal(dage, fodselsdato) {
    const medSoevn = dage.filter(d => d.total > 0);
    const totalSek = dage.reduce((s, d) => s + d.total, 0);
    const antalLure = dage.reduce((s, d) => s + d.lure, 0);
    const medPleje = dage.filter(d => d.maaltider || d.bleer);
    let fase = null;
    if (fodselsdato) {
        const mdr = (Date.now() - new Date(fodselsdato + "T00:00:00")) / (1000 * 60 * 60 * 24 * 30.4375);
        fase = soevnFaseForAlder(mdr);
    }
    return {
        gnsPrDag: medSoevn.length ? totalSek / medSoevn.length : 0,
        totalSek, antalLure,
        lurePrDag: medSoevn.length ? antalLure / medSoevn.length : 0,
        gnsLur: antalLure ? totalSek / antalLure : 0,
        dageMedData: medSoevn.length,
        gnsMad: medPleje.length ? dage.reduce((s, d) => s + d.maaltider, 0) / medPleje.length : 0,
        gnsBle: medPleje.length ? dage.reduce((s, d) => s + d.bleer, 0) / medPleje.length : 0,
        plejeDage: medPleje.length,
        fase
    };
}

function alderVedDatoFor(fodselsdato, dato) {
    if (!fodselsdato) return null;
    return (new Date(dato + "T00:00:00") - new Date(fodselsdato + "T00:00:00")) / (1000 * 60 * 60 * 24 * 30.4375);
}

function vaekstKurver(growth, koen, fodselsdato) {
    let html = "";
    ['vaegt', 'laengde', 'hoved'].forEach(k => {
        const maal = ((growth && growth.measurements) || []).filter(m => m[k] != null).sort((a, b) => a.dato.localeCompare(b.dato));
        if (!maal.length || !fodselsdato) return;
        const type = MAAL_TYPER[k];
        const punkter = maal.map(m => ({ x: Math.max(0, alderVedDatoFor(fodselsdato, m.dato)), y: m[k] }));
        const maxAlder = Math.max(3, Math.ceil(Math.max(...punkter.map(p => p.x)) + 1));
        const ref = WHO_DATA[koen] && WHO_DATA[koen][k];
        let bands = [], series = [{ points: punkter, klasse: 'c-s1' }];
        if (ref) {
            const aldre = Object.keys(ref).map(Number).sort((a, b) => a - b).filter(a => a <= maxAlder + 3);
            bands = [{ lower: aldre.map(a => ({ x: a, y: ref[a][0] })), upper: aldre.map(a => ({ x: a, y: ref[a][2] })) }];
            series.unshift({ points: aldre.map(a => ({ x: a, y: ref[a][1] })), klasse: 'c-s2', dots: false });
        }
        html += `<div class="rap-chart"><h4>${type.ikon} ${type.navn} (${type.enhed})</h4>${
            lineChart({ series, bands, xMin: 0, xMax: maxAlder, formatY: v => v.toFixed(1), formatX: v => Math.round(v) + " mdr", xTicks: Math.min(6, maxAlder) })
        }</div>`;
    });
    return html;
}

// ==========================================
// BYG RAPPORTEN
// ==========================================
async function byggeRapport() {
    const p = rapportPeriode();
    const careListe = typeof alleCareEntries === 'function' ? alleCareEntries() : [];
    const dage = rapportDage(p, localSleepLogs, careListe);
    const n = noegletal(dage, babyBirthDate);

    const soevnChart = barChart(dage.map(d => ({ label: shortDate(d.key), value: d.total / 3600 })), { format: v => v.toFixed(1) + 't' });
    const vaekstHtml = vaekstKurver(growthData, babyGender, babyBirthDate);

    const maalinger = (growthData.measurements || []).slice().sort((a, b) => b.dato.localeCompare(a.dato)).slice(0, 10);
    const maalTabel = maalinger.length ? `<table class="rap-table">
        <tr><th>Dato</th><th>Alder</th><th>Vægt</th><th>Længde</th><th>Hoved</th><th>Note</th></tr>
        ${maalinger.map(m => `<tr>
            <td>${new Date(m.dato).toLocaleDateString(locale())}</td>
            <td>${alderVedDatoFor(babyBirthDate, m.dato) != null ? alderVedDatoFor(babyBirthDate, m.dato).toFixed(1) + ' mdr' : '–'}</td>
            <td>${m.vaegt != null ? talTilFelt(m.vaegt) : '–'}</td>
            <td>${m.laengde != null ? talTilFelt(m.laengde) : '–'}</td>
            <td>${m.hoved != null ? talTilFelt(m.hoved) : '–'}</td>
            <td>${esc(m.note || '')}</td></tr>`).join('')}
    </table>` : `<p class="rap-tom">Ingen målinger registreret.</p>`;

    const ms = milestones.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
    const msHtml = ms.length ? `<ul class="rap-list">${ms.map(m =>
        `<li><strong>${esc(m.title)}</strong> — ${new Date(m.date).toLocaleDateString(locale())}${alderVedMilepael(m.date) ? ` (${alderVedMilepael(m.date)})` : ''}</li>`
    ).join('')}</ul>` : `<p class="rap-tom">Ingen milepæle registreret.</p>`;

    // Eventuel sammenligning med et søskendebarn
    let sammenlignHtml = "";
    if (repSammenlign) {
        const andet = await hentBarnData(repSammenlign);
        if (andet) {
            const aDage = rapportDage(p, andet.logs, andet.care);
            const aN = noegletal(aDage, andet.info.birthDate);
            const aNavn = esc(andet.info.name || 'Barn 2');
            const raekke = (etiket, a, b) => `<tr><td>${etiket}</td><td>${a}</td><td>${b}</td></tr>`;
            sammenlignHtml = `
                <h2>Sammenligning: ${esc(babyName)} og ${aNavn}</h2>
                <p class="rap-sub">Samme periode for begge. Husk at børnene kan være i forskellig alder — det betyder mere end noget andet for tallene.</p>
                <table class="rap-table">
                    <tr><th>Nøgletal</th>
                        <th>${esc(babyName)}${babyBirthDate ? ` (${alderTekst()})` : ''}</th>
                        <th>${aNavn}</th></tr>
                    ${raekke('Søvn pr. døgn', formatShort(n.gnsPrDag), formatShort(aN.gnsPrDag))}
                    ${raekke('Lure pr. dag', n.lurePrDag ? n.lurePrDag.toFixed(1) : '–', aN.lurePrDag ? aN.lurePrDag.toFixed(1) : '–')}
                    ${raekke('Gns. lurlængde', n.gnsLur ? formatShort(n.gnsLur) : '–', aN.gnsLur ? formatShort(aN.gnsLur) : '–')}
                    ${raekke('Måltider pr. dag', n.gnsMad ? n.gnsMad.toFixed(1) : '–', aN.gnsMad ? aN.gnsMad.toFixed(1) : '–')}
                    ${raekke('Bleer pr. dag', n.gnsBle ? n.gnsBle.toFixed(1) : '–', aN.gnsBle ? aN.gnsBle.toFixed(1) : '–')}
                    ${raekke('Dage med data', n.dageMedData, aN.dageMedData)}
                </table>
                <div class="rap-chart"><h4>${aNavn}: søvn pr. dag</h4>${
                    barChart(aDage.map(d => ({ label: shortDate(d.key), value: d.total / 3600 })), { format: v => v.toFixed(1) + 't' })
                }</div>
                ${vaekstKurver(andet.growth, andet.info.gender || 'neutral', andet.info.birthDate)}`;
        }
    }

    const f = birthInfo || {};
    const foedsel = [
        f['birth-weight'] ? `${f['birth-weight']} g` : null,
        f['birth-length'] ? `${f['birth-length']} cm` : null,
        f['birth-head'] ? `hoved ${f['birth-head']} cm` : null,
        f['birth-week'] ? `uge ${f['birth-week']}` : null
    ].filter(Boolean).join(' · ');

    return `<!DOCTYPE html><html lang="da"><head><meta charset="UTF-8">
<title>Rapport — ${esc(babyName)}</title>
<style>
:root{--accent-green:#8DA399;--btn-save:#A4C3D2;--bg-main:#F4F2ED;--text-light:#777;--text-dark:#333;--band:rgba(141,163,153,.18);}
*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif;}
body{padding:28px;color:var(--text-dark);line-height:1.5;max-width:900px;margin:0 auto;}
h1{font-size:1.6rem;color:var(--accent-green);margin-bottom:4px;}
h2{font-size:1.1rem;color:var(--accent-green);margin:26px 0 10px;padding-bottom:6px;border-bottom:2px solid var(--bg-main);}
h4{font-size:.92rem;color:var(--text-light);margin-bottom:6px;}
.rap-sub{color:var(--text-light);font-size:.9rem;margin-bottom:6px;}
.rap-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:14px 0;}
.rap-kpi{background:var(--bg-main);border-radius:10px;padding:12px;text-align:center;}
.rap-kpi b{display:block;font-size:1.3rem;color:var(--accent-green);}
.rap-kpi small{color:var(--text-light);font-size:.75rem;}
.rap-table{width:100%;border-collapse:collapse;font-size:.85rem;margin-top:8px;}
.rap-table th{text-align:left;padding:7px 6px;border-bottom:2px solid var(--bg-main);color:var(--accent-green);font-size:.78rem;}
.rap-table td{padding:7px 6px;border-bottom:1px solid var(--bg-main);}
.rap-list{list-style:none;font-size:.88rem;}
.rap-list li{padding:6px 0;border-bottom:1px solid var(--bg-main);}
.rap-tom{color:var(--text-light);font-size:.88rem;font-style:italic;}
.rap-chart{margin-bottom:18px;break-inside:avoid;}
.chart-svg{width:100%;height:auto;}
.c-grid{stroke:var(--bg-main);stroke-width:1.5;}
.c-axis{fill:var(--text-light);font-size:12px;}
.c-bar{fill:var(--btn-save);}.c-bar-hi{fill:var(--accent-green);}
.c-avg{stroke:var(--text-light);stroke-width:2;stroke-dasharray:6 5;}
.c-band{fill:var(--band);}
.c-line{stroke-width:2.5;fill:none;}.c-line.c-s1{stroke:var(--btn-save);}
.c-line.c-s2{stroke:var(--accent-green);stroke-dasharray:6 4;}
.c-line.c-s3{stroke:var(--text-light);stroke-dasharray:3 4;stroke-width:1.5;}
.c-dot{stroke:#fff;stroke-width:2;}.c-dot.c-s1{fill:var(--btn-save);}.c-dot.c-s2{fill:var(--accent-green);}
.chart-legend{display:flex;gap:14px;justify-content:center;margin-top:8px;flex-wrap:wrap;}
.c-key{display:inline-flex;align-items:center;gap:5px;font-size:.75rem;color:var(--text-light);}
.c-swatch{width:12px;height:12px;border-radius:3px;display:inline-block;}
.c-sw-bar,.c-sw-s1{background:var(--btn-save);}.c-sw-s2{background:var(--accent-green);}
.c-sw-s3{background:var(--text-light);}
.c-sw-avg{background:var(--text-light);height:3px;}.c-sw-band{background:var(--band);border:1px solid var(--accent-green);}
.chart-empty{color:var(--text-light);font-style:italic;padding:16px;}
.rap-foot{margin-top:30px;padding-top:14px;border-top:2px solid var(--bg-main);font-size:.78rem;color:var(--text-light);}
.rap-print{background:var(--accent-green);color:#fff;border:none;padding:12px 22px;border-radius:9px;font-size:.95rem;font-weight:700;cursor:pointer;margin-bottom:22px;}
@media print{.rap-print{display:none;}body{padding:0;}h2{break-after:avoid;}}
</style></head><body>

<button class="rap-print" onclick="window.print()">🖨️ Print eller gem som PDF</button>

<h1>${esc(babyName)}</h1>
<p class="rap-sub">
    ${babyBirthDate ? `Født ${new Date(babyBirthDate).toLocaleDateString(locale())}${f['birth-time'] ? ' kl. ' + esc(f['birth-time']) : ''}${f['birth-place'] ? ', ' + esc(f['birth-place']) : ''} · ${alderTekst()}` : 'Fødselsdato ikke angivet'}
    ${foedsel ? `<br>Ved fødslen: ${esc(foedsel)}` : ''}
    ${(f['parent-1'] || f['parent-2']) ? `<br>Forældre: ${esc([f['parent-1'], f['parent-2']].filter(Boolean).join(' og '))}` : ''}
</p>
<p class="rap-sub">Rapport dannet ${new Date().toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' })} · perioden ${formatDateDK(p.fra)} til ${formatDateDK(p.til)} (${p.antal} dage)</p>

<h2>Søvn</h2>
<div class="rap-grid">
    <div class="rap-kpi"><b>${formatShort(n.gnsPrDag)}</b><small>Gns. pr. døgn</small></div>
    <div class="rap-kpi"><b>${n.fase ? n.fase.soevnMin + '-' + n.fase.soevnMax + ' t' : '–'}</b><small>Anbefalet for alderen</small></div>
    <div class="rap-kpi"><b>${n.lurePrDag ? n.lurePrDag.toFixed(1) : '–'}</b><small>Lure pr. dag</small></div>
    <div class="rap-kpi"><b>${n.gnsLur ? formatShort(n.gnsLur) : '–'}</b><small>Gns. lurlængde</small></div>
    <div class="rap-kpi"><b>${n.dageMedData}</b><small>Dage med data</small></div>
</div>
${soevnChart}

<h2>Mad og bleer</h2>
<div class="rap-grid">
    <div class="rap-kpi"><b>${n.gnsMad ? n.gnsMad.toFixed(1) : '–'}</b><small>Måltider pr. dag</small></div>
    <div class="rap-kpi"><b>${n.gnsBle ? n.gnsBle.toFixed(1) : '–'}</b><small>Bleer pr. dag</small></div>
    <div class="rap-kpi"><b>${n.plejeDage}</b><small>Dage med data</small></div>
</div>
${n.plejeDage ? '' : '<p class="rap-tom">Ingen registreringer af mad og bleer i perioden.</p>'}

<h2>Vækst</h2>
${vaekstHtml || '<p class="rap-tom">Ingen vækstkurver — der mangler målinger eller fødselsdato.</p>'}
${maalTabel}

<h2>Milepæle</h2>
${msHtml}

${sammenlignHtml}

<p class="rap-foot">
    Dannet i BabyRo. Tallene er registreret af forældrene og er ikke en journal.
    Vækstkurverne bruger WHO Child Growth Standards; det skyggede felt svarer til ±2 standardafvigelser.
    Rapporten erstatter ikke en faglig vurdering.
</p>
</body></html>`;
}

async function aabnRapport() {
    const knap = document.getElementById('btn-open-report');
    if (knap) { knap.disabled = true; knap.textContent = T('reportBuilding'); }
    try {
        const html = await byggeRapport();
        const vindue = window.open('', '_blank');
        if (!vindue) { alert(T('popupBlocked')); return; }
        vindue.document.write(html);
        vindue.document.close();
    } catch (e) {
        alert("Kunne ikke lave rapporten: " + e.message);
    } finally {
        if (knap) { knap.disabled = false; knap.textContent = T('reportMake'); }
    }
}

document.getElementById('btn-open-report')?.addEventListener('click', aabnRapport);

// Rapportkortet ligger under Profil → Barnet, så info opdateres når man går derind
document.getElementById('nav-profile')?.addEventListener('click', opdaterRapportInfo);
document.addEventListener('DOMContentLoaded', opdaterRapportInfo);

// ==================================================
// MIN OVERSIGT
// Alt om barnet på én læsbar side — erstatningen for
// den gamle JSON-fil, som ingen kunne bruge til noget.
// ==================================================
function byggeOversigt() {
    const f = birthInfo || {};
    const careListe = typeof alleCareEntries === 'function' ? alleCareEntries() : [];
    const alleDage = Object.keys(localSleepLogs).sort();
    const totalSek = alleDage.reduce((s, k) => s + (localSleepLogs[k].total || 0), 0);
    const antalLure = alleDage.reduce((s, k) => s + (localSleepLogs[k].sessions || []).length, 0);

    const raekke = (etiket, vaerdi) => vaerdi ? `<tr><td>${esc(etiket)}</td><td>${esc(vaerdi)}</td></tr>` : '';

    const stamdata = `<table class="o-table">
        ${raekke(T('name'), babyName)}
        ${raekke(T('birthDate'), babyBirthDate ? new Date(babyBirthDate).toLocaleDateString(locale()) : '')}
        ${raekke(T('age'), alderTekst())}
        ${raekke(T('dueDate'), babyDueDate ? new Date(babyDueDate).toLocaleDateString(locale()) : '')}
        ${raekke(T('birthTime'), f['birth-time'])}
        ${raekke(T('birthPlace'), f['birth-place'])}
        ${raekke(T('birthWeight'), f['birth-weight'] ? f['birth-weight'] + ' g' : '')}
        ${raekke(T('birthLength'), f['birth-length'] ? f['birth-length'] + ' cm' : '')}
        ${raekke(T('head'), f['birth-head'] ? f['birth-head'] + ' cm' : '')}
        ${raekke(T('gestWeek'), f['birth-week'])}
        ${raekke(T('parent1'), f['parent-1'])}
        ${raekke(T('parent2'), f['parent-2'])}
    </table>
    ${f['birth-story'] ? `<div class="o-story">${esc(f['birth-story']).replaceAll('\n', '<br>')}</div>` : ''}`;

    // Vækst
    const maal = (growthData.measurements || []).slice().sort((a, b) => b.dato.localeCompare(a.dato));
    const vaekst = maal.length ? `<table class="o-table">
        <tr><th>${T('date')}</th><th>${T('age')}</th><th>${T('weight')}</th><th>${T('length')}</th><th>${T('head')}</th><th>${T('note').split(' ')[0]}</th></tr>
        ${maal.map(m => `<tr>
            <td>${new Date(m.dato).toLocaleDateString(locale())}</td>
            <td>${alderVedDatoFor(babyBirthDate, m.dato) != null ? alderVedDatoFor(babyBirthDate, m.dato).toFixed(1) + ' ' + T('months') : '–'}</td>
            <td>${m.vaegt != null ? talTilFelt(m.vaegt) + ' kg' : '–'}</td>
            <td>${m.laengde != null ? talTilFelt(m.laengde) + ' cm' : '–'}</td>
            <td>${m.hoved != null ? talTilFelt(m.hoved) + ' cm' : '–'}</td>
            <td>${esc(m.note || '')}</td></tr>`).join('')}
    </table>` : `<p class="o-tom">${T('noMeasures')}</p>`;

    // Milepæle
    const ms = milestones.slice().sort((a, b) => b.date.localeCompare(a.date));
    const msHtml = ms.length ? ms.map(m => `<div class="o-ms">
        <div class="o-ms-head"><strong>${esc(m.title)}</strong>
            <span>${new Date(m.date).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' })}${alderVedMilepael(m.date) ? ` · ${alderVedMilepael(m.date)}` : ''}</span></div>
        ${m.note ? `<p>${esc(m.note)}</p>` : ''}
        ${m.photo ? `<img src="${m.photo}" alt="${esc(m.title)}">` : ''}
    </div>`).join('') : `<p class="o-tom">${T('msNone')}</p>`;

    // Søvn: hele loggen dag for dag
    const soevn = alleDage.length ? alleDage.slice().reverse().map(k => `
        <div class="o-dag">
            <h4>${formatDateDK(k)} — ${formatTimeText(localSleepLogs[k].total)}</h4>
            <ul>${(localSleepLogs[k].sessions || []).map(s => `<li>${esc(s.timeDisplay)} · ${esc(s.durationText)}</li>`).join('')}</ul>
        </div>`).join('') : `<p class="o-tom">–</p>`;

    // Pleje: seneste 14 dage
    const plejeDage = [];
    for (let i = 0; i < 14; i++) {
        const k = dateKeyOffset(i);
        const e = careListe.filter(x => isoKey(new Date(x.ts)) === k);
        if (e.length) plejeDage.push({ k, e });
    }
    const pleje = plejeDage.length ? plejeDage.map(d => `
        <div class="o-dag">
            <h4>${formatDateDK(d.k)}</h4>
            <ul>${d.e.slice().reverse().map(x => {
                const l = careLinje(x);
                return `<li>${clockFromMs(x.ts)} · ${l.ikon} ${esc(l.navn)}${l.detalje ? ' · ' + esc(l.detalje) : ''}${l.note ? ' — ' + esc(l.note) : ''}</li>`;
            }).join('')}</ul>
        </div>`).join('') : `<p class="o-tom">–</p>`;

    return `<!DOCTYPE html><html lang="${SPROG}"><head><meta charset="UTF-8">
<title>${esc(babyName)} — ${T('summaryTitle')}</title>
<style>
:root{--g:#8DA399;--bg:#F4F2ED;--lt:#777;--tx:#333;}
*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif;}
body{padding:28px;color:var(--tx);line-height:1.55;max-width:860px;margin:0 auto;}
h1{font-size:1.7rem;color:var(--g);margin-bottom:4px;}
h2{font-size:1.15rem;color:var(--g);margin:30px 0 12px;padding-bottom:6px;border-bottom:2px solid var(--bg);}
h4{font-size:.92rem;margin-bottom:4px;}
.o-sub{color:var(--lt);font-size:.9rem;margin-bottom:20px;}
.o-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:16px 0;}
.o-kpi div{background:var(--bg);border-radius:10px;padding:14px;text-align:center;}
.o-kpi b{display:block;font-size:1.3rem;color:var(--g);}
.o-kpi small{color:var(--lt);font-size:.75rem;}
.o-table{width:100%;border-collapse:collapse;font-size:.88rem;}
.o-table th{text-align:left;padding:8px 6px;border-bottom:2px solid var(--bg);color:var(--g);font-size:.8rem;}
.o-table td{padding:8px 6px;border-bottom:1px solid var(--bg);}
.o-table td:first-child{color:var(--lt);width:38%;}
.o-story{background:var(--bg);border-radius:12px;padding:16px;margin-top:14px;font-size:.92rem;font-style:italic;}
.o-dag{margin-bottom:14px;break-inside:avoid;}
.o-dag ul{list-style:none;font-size:.86rem;color:var(--lt);}
.o-dag li{padding:3px 0;}
.o-ms{background:var(--bg);border-radius:12px;padding:16px;margin-bottom:14px;break-inside:avoid;}
.o-ms-head{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:6px;}
.o-ms-head span{color:var(--lt);font-size:.83rem;}
.o-ms p{font-size:.9rem;margin-bottom:10px;}
.o-ms img{max-width:320px;width:100%;border-radius:10px;}
.o-tom{color:var(--lt);font-style:italic;font-size:.88rem;}
.o-print{background:var(--g);color:#fff;border:none;padding:12px 22px;border-radius:9px;font-size:.95rem;font-weight:700;cursor:pointer;margin-bottom:22px;}
.o-foot{margin-top:34px;padding-top:14px;border-top:2px solid var(--bg);font-size:.78rem;color:var(--lt);}
@media print{.o-print{display:none;}body{padding:0;}h2{break-after:avoid;}}
</style></head><body>
<button class="o-print" onclick="window.print()">🖨️ ${SPROG === 'en' ? 'Print or save as PDF' : 'Print eller gem som PDF'}</button>

<h1>${esc(babyName)}</h1>
<p class="o-sub">${SPROG === 'en' ? 'Everything BabyRo has saved' : 'Alt hvad BabyRo har gemt'} · ${new Date().toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' })}</p>

<div class="o-kpi">
    <div><b>${alleDage.length}</b><small>${T('daysWithData')}</small></div>
    <div><b>${antalLure}</b><small>${T('statNaps')}</small></div>
    <div><b>${formatShort(totalSek)}</b><small>${T('statTotal')}</small></div>
    <div><b>${maal.length}</b><small>${T('allMeasures')}</small></div>
    <div><b>${ms.length}</b><small>${T('msTitle')}</small></div>
</div>

<h2>${T('yourChild')}</h2>
${stamdata}

<h2>${T('msTitle')}</h2>
${msHtml}

<h2>${T('growthTitle')}</h2>
${vaekst}

<h2>${T('careTitle')}</h2>
${pleje}

<h2>${T('historyTitle')}</h2>
${soevn}

<p class="o-foot">${SPROG === 'en'
    ? 'Created in BabyRo. All entries were recorded by the parents.'
    : 'Dannet i BabyRo. Alle registreringer er indtastet af forældrene.'}</p>
</body></html>`;
}

document.getElementById('btn-open-summary')?.addEventListener('click', () => {
    const v = window.open('', '_blank');
    if (!v) { alert(T('popupBlocked')); return; }
    v.document.write(byggeOversigt());
    v.document.close();
});
