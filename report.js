// ==================================================
// BabyRo — report.js
// Én side med de sidste fire ugers søvn, mad, bleer,
// vækstkurver og milepæle — klar til print eller PDF.
// ==================================================

function rapportDage(antal) {
    const out = [];
    for (let i = antal - 1; i >= 0; i--) {
        const key = dateKeyOffset(i);
        const s = localSleepLogs[key] || { sessions: [], total: 0 };
        const c = typeof careForDag === 'function' ? careForDag(key) : [];
        out.push({
            key,
            total: s.total || 0,
            lure: s.sessions.length,
            maaltider: c.filter(x => CARE_TYPER[x.type]?.mad).length,
            bleer: c.filter(x => x.type === 'ble').length
        });
    }
    return out;
}

function byggeRapport() {
    const dage = rapportDage(28);
    const medSoevn = dage.filter(d => d.total > 0);
    const totalSek = dage.reduce((s, d) => s + d.total, 0);
    const antalLure = dage.reduce((s, d) => s + d.lure, 0);
    const gnsPrDag = medSoevn.length ? totalSek / medSoevn.length : 0;
    const fase = soevnFaseForAlder(alderIMdr());

    const medPleje = dage.filter(d => d.maaltider || d.bleer);
    const gnsMad = medPleje.length ? dage.reduce((s, d) => s + d.maaltider, 0) / medPleje.length : 0;
    const gnsBle = medPleje.length ? dage.reduce((s, d) => s + d.bleer, 0) / medPleje.length : 0;

    // Søvndiagram
    const soevnChart = barChart(
        dage.map(d => ({ label: shortDate(d.key), value: d.total / 3600 })),
        { format: v => v.toFixed(1) + 't' }
    );

    // Vækstkurver for de tre standardmål
    let vaekstHtml = "";
    ['vaegt', 'laengde', 'hoved'].forEach(k => {
        const maal = (growthData.measurements || []).filter(m => m[k] != null)
            .sort((a, b) => a.dato.localeCompare(b.dato));
        if (!maal.length || !babyBirthDate) return;
        const type = MAAL_TYPER[k];
        const punkter = maal.map(m => ({ x: Math.max(0, alderVedDato(m.dato)), y: m[k] }));
        const maxAlder = Math.max(3, Math.ceil(Math.max(...punkter.map(p => p.x)) + 1));
        const ref = WHO_DATA[babyGender]?.[k];
        let bands = [], series = [{ points: punkter, klasse: 'c-s1' }];
        if (ref) {
            const aldre = Object.keys(ref).map(Number).sort((a, b) => a - b).filter(a => a <= maxAlder + 3);
            bands = [{ lower: aldre.map(a => ({ x: a, y: ref[a][0] })), upper: aldre.map(a => ({ x: a, y: ref[a][2] })) }];
            series.unshift({ points: aldre.map(a => ({ x: a, y: ref[a][1] })), klasse: 'c-s2', dots: false });
        }
        vaekstHtml += `<div class="rap-chart"><h4>${type.ikon} ${type.navn} (${type.enhed})</h4>${
            lineChart({ series, bands, xMin: 0, xMax: maxAlder, formatY: v => v.toFixed(1), formatX: v => Math.round(v) + " mdr", xTicks: Math.min(6, maxAlder) })
        }</div>`;
    });

    // Måletabel
    const maalinger = (growthData.measurements || []).slice().sort((a, b) => b.dato.localeCompare(a.dato)).slice(0, 8);
    const maalTabel = maalinger.length ? `<table class="rap-table">
        <tr><th>Dato</th><th>Alder</th><th>Vægt</th><th>Længde</th><th>Hoved</th><th>Note</th></tr>
        ${maalinger.map(m => `<tr>
            <td>${new Date(m.dato).toLocaleDateString('da-DK')}</td>
            <td>${alderVedDato(m.dato) != null ? alderVedDato(m.dato).toFixed(1) + ' mdr' : '–'}</td>
            <td>${m.vaegt ?? '–'}</td><td>${m.laengde ?? '–'}</td><td>${m.hoved ?? '–'}</td>
            <td>${esc(m.note || '')}</td></tr>`).join('')}
    </table>` : `<p class="rap-tom">Ingen målinger registreret.</p>`;

    // Milepæle
    const ms = milestones.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
    const msHtml = ms.length ? `<ul class="rap-list">${ms.map(m =>
        `<li><strong>${esc(m.title)}</strong> — ${new Date(m.date).toLocaleDateString('da-DK')}${alderVedMilepael(m.date) ? ` (${alderVedMilepael(m.date)})` : ''}</li>`
    ).join('')}</ul>` : `<p class="rap-tom">Ingen milepæle registreret.</p>`;

    const f = birthInfo || {};
    const foedsel = [
        f['birth-weight'] ? `${f['birth-weight']} g` : null,
        f['birth-length'] ? `${f['birth-length']} cm` : null,
        f['birth-head'] ? `hoved ${f['birth-head']} cm` : null,
        f['birth-week'] ? `uge ${f['birth-week']}` : null
    ].filter(Boolean).join(' · ');

    return `<!DOCTYPE html><html lang="da"><head><meta charset="UTF-8">
<title>Søvnrapport — ${esc(babyName)}</title>
<style>
:root{--accent-green:#8DA399;--btn-save:#A4C3D2;--bg-main:#F4F2ED;--text-light:#777;--text-dark:#333;--card-bg:#fff;--band:rgba(141,163,153,.18);}
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
.c-dot{stroke:#fff;stroke-width:2;}.c-dot.c-s1{fill:var(--btn-save);}.c-dot.c-s2{fill:var(--accent-green);}
.chart-legend{display:flex;gap:14px;justify-content:center;margin-top:8px;flex-wrap:wrap;}
.c-key{display:inline-flex;align-items:center;gap:5px;font-size:.75rem;color:var(--text-light);}
.c-swatch{width:12px;height:12px;border-radius:3px;display:inline-block;}
.c-sw-bar,.c-sw-s1{background:var(--btn-save);}.c-sw-s2{background:var(--accent-green);}
.c-sw-avg{background:var(--text-light);height:3px;}.c-sw-band{background:var(--band);border:1px solid var(--accent-green);}
.chart-empty{color:var(--text-light);font-style:italic;padding:16px;}
.rap-foot{margin-top:30px;padding-top:14px;border-top:2px solid var(--bg-main);font-size:.78rem;color:var(--text-light);}
.rap-print{background:var(--accent-green);color:#fff;border:none;padding:12px 22px;border-radius:9px;font-size:.95rem;font-weight:700;cursor:pointer;margin-bottom:22px;}
@media print{.rap-print{display:none;}body{padding:0;}h2{break-after:avoid;}}
</style></head><body>

<button class="rap-print" onclick="window.print()">🖨️ Print eller gem som PDF</button>

<h1>${esc(babyName)}</h1>
<p class="rap-sub">
    ${babyBirthDate ? `Født ${new Date(babyBirthDate).toLocaleDateString('da-DK')}${f['birth-time'] ? ' kl. ' + f['birth-time'] : ''}${f['birth-place'] ? ', ' + esc(f['birth-place']) : ''} · ${alderTekst()}` : 'Fødselsdato ikke angivet'}
    ${foedsel ? `<br>Ved fødslen: ${esc(foedsel)}` : ''}
    ${(f['parent-1'] || f['parent-2']) ? `<br>Forældre: ${esc([f['parent-1'], f['parent-2']].filter(Boolean).join(' og '))}` : ''}
</p>
<p class="rap-sub">Rapport dannet ${new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })} · perioden ${formatDateDK(dage[0].key)} til ${formatDateDK(dage[dage.length - 1].key)}</p>

<h2>Søvn — de sidste 4 uger</h2>
<div class="rap-grid">
    <div class="rap-kpi"><b>${formatShort(gnsPrDag)}</b><small>Gns. pr. døgn</small></div>
    <div class="rap-kpi"><b>${fase ? fase.soevnMin + '-' + fase.soevnMax + ' t' : '–'}</b><small>Anbefalet for alderen</small></div>
    <div class="rap-kpi"><b>${medSoevn.length ? (antalLure / medSoevn.length).toFixed(1) : '–'}</b><small>Lure pr. dag</small></div>
    <div class="rap-kpi"><b>${antalLure ? formatShort(totalSek / antalLure) : '–'}</b><small>Gns. lurlængde</small></div>
    <div class="rap-kpi"><b>${medSoevn.length}</b><small>Dage med data</small></div>
</div>
${soevnChart}

<h2>Mad og bleer — de sidste 4 uger</h2>
<div class="rap-grid">
    <div class="rap-kpi"><b>${gnsMad ? gnsMad.toFixed(1) : '–'}</b><small>Måltider pr. dag</small></div>
    <div class="rap-kpi"><b>${gnsBle ? gnsBle.toFixed(1) : '–'}</b><small>Bleer pr. dag</small></div>
    <div class="rap-kpi"><b>${medPleje.length}</b><small>Dage med data</small></div>
</div>
${medPleje.length ? '' : '<p class="rap-tom">Ingen registreringer af mad og bleer i perioden.</p>'}

<h2>Vækst</h2>
${vaekstHtml || '<p class="rap-tom">Ingen vækstkurver — der mangler målinger eller fødselsdato.</p>'}
${maalTabel}

<h2>Milepæle</h2>
${msHtml}

<p class="rap-foot">
    Dannet i BabyRo. Tallene er registreret af forældrene og er ikke en journal.
    Vækstkurverne bruger WHO Child Growth Standards; det skyggede felt svarer til ±2 standardafvigelser.
    Rapporten erstatter ikke en faglig vurdering.
</p>
</body></html>`;
}

function aabnRapport() {
    const vindue = window.open('', '_blank');
    if (!vindue) { alert("Browseren blokerede vinduet. Tillad pop op-vinduer for denne side og prøv igen."); return; }
    vindue.document.write(byggeRapport());
    vindue.document.close();
}

document.getElementById('btn-open-report')?.addEventListener('click', aabnRapport);
document.getElementById('btn-open-report2')?.addEventListener('click', aabnRapport);
