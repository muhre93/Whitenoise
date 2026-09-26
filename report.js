// ==================================================
// BabyBasen — report.js
// Rapport til sundhedsplejersken + hele oversigten
// Åbner et nyt vindue der kan printes eller gemmes som PDF
// ==================================================

let repFra = dateKeyOffset(29);
let repTil = todayKey();

document.querySelectorAll('.rep-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.rep-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        repFra = dateKeyOffset(Number(btn.dataset.repdays) - 1);
        repTil = todayKey();
        const f = document.getElementById('rep-from'), t = document.getElementById('rep-to');
        if (f) f.value = repFra; if (t) t.value = repTil;
        opdaterRepInfo();
    });
});
['rep-from', 'rep-to'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
        const f = document.getElementById('rep-from').value, t = document.getElementById('rep-to').value;
        if (f && t && f <= t) {
            repFra = f; repTil = t;
            document.querySelectorAll('.rep-btn').forEach(b => b.classList.remove('active'));
            opdaterRepInfo();
        }
    });
});

function opdaterRepInfo() {
    const el = document.getElementById('rep-info');
    if (el) el.textContent = `${formatDateDK(repFra)} – ${formatDateDK(repTil)}`;
}

function opdaterRepBoern() {
    const wrap = document.getElementById('rep-compare-wrap');
    const sel = document.getElementById('rep-compare');
    if (!wrap || !sel) return;
    const andre = childList.filter(c => c.id !== childId && !c.archived);
    if (!andre.length || isGuest) { wrap.style.display = 'none'; return; }
    wrap.style.display = '';
    sel.innerHTML = `<option value="">${T('reportNoCompare')}</option>` +
        andre.map(c => `<option value="${c.id}">${esc(c.name || T('childNoName'))}</option>`).join('');
}

// ---------- dataindsamling ----------
function repDage(fra, til, logs, care) {
    const ud = [];
    const slut = keyToDate(til), d = keyToDate(fra);
    let vagt = 0;
    while (d <= slut && vagt < 800) {
        const key = isoKey(d);
        const s = (logs || {})[key] || { sessions: [], total: 0 };
        const ym = monthKey(key);
        const c = ((care || {})[ym] || []).filter(e => e.dato === key);
        ud.push({ key, total: s.total || 0, sessions: s.sessions || [], care: c });
        d.setDate(d.getDate() + 1); vagt++;
    }
    return ud;
}

function repNoegletal(dage) {
    const med = dage.filter(d => d.total > 0);
    const totalSek = dage.reduce((s, d) => s + d.total, 0);
    const lure = dage.reduce((s, d) => s + d.sessions.length, 0);
    const maal = dage.reduce((s, d) => s + d.care.filter(e => e.type !== 'ble').length, 0);
    const bleer = dage.reduce((s, d) => s + d.care.filter(e => e.type === 'ble').length, 0);
    const ml = dage.reduce((s, d) => s + d.care.reduce((a, e) => a + (e.ml || 0), 0), 0);
    const nMed = med.length || 1;
    const nCare = dage.filter(d => d.care.length).length || 1;
    return {
        dage: dage.length, medData: med.length,
        gnsSoevn: totalSek / nMed, totalSoevn: totalSek,
        gnsLure: lure / nMed, lure,
        gnsLurLaengde: lure ? totalSek / lure : 0,
        gnsMaal: maal / nCare, gnsBleer: bleer / nCare,
        gnsMl: ml ? ml / nCare : 0
    };
}

function repTabel(n) {
    const r = [
        [T('statAvgDay'), formatTimeText(Math.round(n.gnsSoevn))],
        [T('statNaps') + ' / ' + T('perDayLabel'), n.gnsLure.toFixed(1)],
        [T('statAvgNap'), formatTimeText(Math.round(n.gnsLurLaengde))],
        [T('statFeedsDay'), n.gnsMaal.toFixed(1)],
        [T('statNappiesDay'), n.gnsBleer.toFixed(1)]
    ];
    if (n.gnsMl) r.push([T('statMlDay'), Math.round(n.gnsMl) + " ml"]);
    r.push([T('daysWithData'), n.medData + " / " + n.dage]);
    return r;
}

function repVaekstTabel() {
    const maalinger = (growthData.measurements || []).slice()
        .filter(m => m.dato >= repFra && m.dato <= repTil)
        .sort((a, b) => a.dato.localeCompare(b.dato));
    if (!maalinger.length) return `<p class="tom">${T('noMeasuresPeriod')}</p>`;
    return `<table><thead><tr><th>${T('date')}</th><th>${T('weightKg')}</th><th>${T('lengthCm')}</th><th>${T('headCm')}</th><th>${T('note')}</th></tr></thead><tbody>` +
        maalinger.map(m => `<tr><td>${formatDateDK(m.dato)}</td><td>${m.vaegt || '–'}</td><td>${m.laengde || '–'}</td><td>${m.hoved || '–'}</td><td>${esc(m.note || '')}</td></tr>`).join('') +
        `</tbody></table>`;
}

function repMilepaele() {
    const m = milestones.filter(x => x.dato >= repFra && x.dato <= repTil)
        .sort((a, b) => a.dato.localeCompare(b.dato));
    if (!m.length) return `<p class="tom">${T('msNonePeriod')}</p>`;
    return `<ul>` + m.map(x => `<li><strong>${formatDateDK(x.dato)}:</strong> ${esc(x.titel)}${x.note ? ' — ' + esc(x.note) : ''}</li>`).join('') + `</ul>`;
}

function repDagTabel(dage) {
    const medData = dage.filter(d => d.total > 0 || d.care.length);
    if (!medData.length) return `<p class="tom">${T('noDataPeriod')}</p>`;
    return `<table><thead><tr><th>${T('date')}</th><th>${T('sleepWord')}</th><th>${T('statNaps')}</th><th>${T('feedsPerDay')}</th><th>${T('nappiesPerDay')}</th></tr></thead><tbody>` +
        medData.map(d => `<tr><td>${formatDateDK(d.key)}</td><td>${d.total ? formatTimeText(d.total) : '–'}</td><td>${d.sessions.length || '–'}</td><td>${d.care.filter(e => e.type !== 'ble').length || '–'}</td><td>${d.care.filter(e => e.type === 'ble').length || '–'}</td></tr>`).join('') +
        `</tbody></table>`;
}

async function hentAndetBarn(cid) {
    if (!db || !currentUserId) return null;
    try {
        const barn = childList.find(c => c.id === cid) || {};
        const logs = {}, care = {};
        const sSnap = await db.collection('children').doc(cid).collection('sleep').get();
        sSnap.forEach(doc => Object.assign(logs, doc.data().dage || {}));
        const cSnap = await db.collection('children').doc(cid).collection('care').get();
        cSnap.forEach(doc => { care[doc.id] = doc.data().poster || []; });
        return { navn: barn.name || T('childNoName'), logs, care };
    } catch (e) { return null; }
}

// ---------- selve dokumentet ----------
function repDokument(titel, indhold) {
    return `<!DOCTYPE html><html lang="${SPROG}"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titel)}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:800px;margin:0 auto;padding:28px 20px;color:#2b2b2b;line-height:1.55;}
  h1{font-size:1.7rem;margin:0 0 4px;color:#6f8f80;}
  h2{font-size:1.15rem;margin:30px 0 10px;padding-bottom:6px;border-bottom:2px solid #e6e1d6;color:#4a4a4a;}
  .meta{color:#777;font-size:.9rem;margin-bottom:22px;}
  table{width:100%;border-collapse:collapse;margin:8px 0 4px;font-size:.92rem;}
  th,td{text-align:left;padding:7px 8px;border-bottom:1px solid #eee;}
  th{background:#f6f4ef;font-weight:600;}
  .kort{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:10px 0;}
  .kort div{background:#f6f4ef;border-radius:10px;padding:12px 14px;}
  .kort strong{display:block;font-size:1.25rem;color:#6f8f80;}
  .kort span{font-size:.82rem;color:#777;}
  .tom{color:#999;font-style:italic;}
  ul{padding-left:20px;} li{margin-bottom:4px;}
  .print{position:fixed;top:12px;right:12px;background:#6f8f80;color:#fff;border:none;padding:11px 18px;border-radius:9px;font-size:1rem;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.15);}
  .foot{margin-top:36px;padding-top:12px;border-top:1px solid #eee;color:#999;font-size:.82rem;}
  @media print{.print{display:none;} body{padding:0;} h2{page-break-after:avoid;} table{page-break-inside:avoid;}}
</style></head><body>
<button class="print" onclick="window.print()">${T('printBtn')}</button>
${indhold}
<p class="foot">${T('reportFoot')}</p>
</body></html>`;
}

function aabnVindue(html) {
    const v = window.open('', '_blank');
    if (!v) { alert(T('popupBlocked')); return; }
    v.document.write(html);
    v.document.close();
}

document.getElementById('btn-open-report')?.addEventListener('click', async () => {
    spor('rapport');
    const dage = repDage(repFra, repTil, localSleepLogs, careData);
    const n = repNoegletal(dage);
    const fase = soevnFaseForAlder(alderIMdr());

    let sammenlign = "";
    const cid = document.getElementById('rep-compare')?.value;
    if (cid) {
        const andet = await hentAndetBarn(cid);
        if (andet) {
            const d2 = repDage(repFra, repTil, andet.logs, andet.care);
            const n2 = repNoegletal(d2);
            const r1 = repTabel(n), r2 = repTabel(n2);
            sammenlign = `<h2>${T('reportCompare')}</h2>
            <table><thead><tr><th></th><th>${esc(babyName)}</th><th>${esc(andet.navn)}</th></tr></thead><tbody>` +
                r1.map((row, i) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${(r2[i] || ['', '–'])[1]}</td></tr>`).join('') +
                `</tbody></table>`;
        }
    }

    const html = repDokument(T('reportTitle') + " — " + babyName, `
        <h1>${esc(babyName)}</h1>
        <p class="meta">${T('reportFor')} ${formatDateDK(repFra)} – ${formatDateDK(repTil)}
        ${babyBirthDate ? ' · ' + T('ageLabel') + ': ' + alderTekst() : ''}
        ${birthInfo.week ? ' · ' + T('birthWeek') + ': ' + esc(birthInfo.week) : ''}</p>

        <h2>${T('reportKey')}</h2>
        <div class="kort">
            <div><strong>${formatShort(n.gnsSoevn)}</strong><span>${T('statAvgDay')}</span></div>
            <div><strong>${n.gnsLure.toFixed(1)}</strong><span>${T('statNaps')} / ${T('perDayLabel')}</span></div>
            <div><strong>${formatShort(n.gnsLurLaengde)}</strong><span>${T('statAvgNap')}</span></div>
            <div><strong>${n.gnsMaal.toFixed(1)}</strong><span>${T('statFeedsDay')}</span></div>
            <div><strong>${n.gnsBleer.toFixed(1)}</strong><span>${T('statNappiesDay')}</span></div>
            ${n.gnsMl ? `<div><strong>${Math.round(n.gnsMl)} ml</strong><span>${T('statMlDay')}</span></div>` : ''}
        </div>
        ${fase ? `<p>${T('reportRec', { min: fase.soevnMin, max: fase.soevnMax, lure: fase.lure })}</p>` : ''}
        ${sammenlign}

        <h2>${T('growthTitle')}</h2>
        ${repVaekstTabel()}

        <h2>${T('msTitle')}</h2>
        ${repMilepaele()}

        <h2>${T('reportDayByDay')}</h2>
        ${repDagTabel(dage)}
    `);
    aabnVindue(html);
});

document.getElementById('btn-open-summary')?.addEventListener('click', () => {
    spor('oversigt');
    const alleDage = Object.keys(localSleepLogs).sort();
    const fra = alleDage[0] || todayKey();
    const dage = repDage(fra, todayKey(), localSleepLogs, careData);
    const n = repNoegletal(dage);

    const fødsel = [];
    if (babyBirthDate) fødsel.push([T('birthDate'), formatDateDK(babyBirthDate)]);
    if (babyDueDate) fødsel.push([T('dueDate'), formatDateDK(babyDueDate)]);
    if (birthInfo.week) fødsel.push([T('birthWeek'), birthInfo.week]);
    if (birthInfo.weight) fødsel.push([T('birthWeight'), birthInfo.weight + " g"]);
    if (birthInfo.length) fødsel.push([T('birthLength'), birthInfo.length + " cm"]);
    if (birthInfo.head) fødsel.push([T('birthHead'), birthInfo.head + " cm"]);
    if (birthInfo.time) fødsel.push([T('birthTime'), birthInfo.time]);
    if (birthInfo.place) fødsel.push([T('birthPlace'), birthInfo.place]);
    if (birthInfo.parent1) fødsel.push([T('parent1'), birthInfo.parent1]);
    if (birthInfo.parent2) fødsel.push([T('parent2'), birthInfo.parent2]);

    const html = repDokument(T('summaryTitle') + " — " + babyName, `
        <h1>${esc(babyName)}</h1>
        <p class="meta">${T('summarySub')}${babyBirthDate ? ' · ' + alderTekst() : ''}</p>

        ${fødsel.length ? `<h2>${T('birthTitle')}</h2>
        <table><tbody>${fødsel.map(r => `<tr><th>${r[0]}</th><td>${esc(String(r[1]))}</td></tr>`).join('')}</tbody></table>` : ''}
        ${birthInfo.story ? `<p>${esc(birthInfo.story)}</p>` : ''}

        <h2>${T('reportKey')}</h2>
        <table><tbody>${repTabel(n).map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</tbody></table>
        <p>${T('summaryTotal', { timer: (n.totalSoevn / 3600).toFixed(0), lure: n.lure })}</p>

        <h2>${T('growthTitle')}</h2>
        ${(() => {
            const m = (growthData.measurements || []).slice().sort((a, b) => a.dato.localeCompare(b.dato));
            if (!m.length) return `<p class="tom">${T('noMeasuresYet')}</p>`;
            return `<table><thead><tr><th>${T('date')}</th><th>${T('weightKg')}</th><th>${T('lengthCm')}</th><th>${T('headCm')}</th></tr></thead><tbody>` +
                m.map(x => `<tr><td>${formatDateDK(x.dato)}</td><td>${x.vaegt || '–'}</td><td>${x.laengde || '–'}</td><td>${x.hoved || '–'}</td></tr>`).join('') + `</tbody></table>`;
        })()}

        <h2>${T('msTimeline')}</h2>
        ${(() => {
            const m = milestones.slice().sort((a, b) => a.dato.localeCompare(b.dato));
            if (!m.length) return `<p class="tom">${T('msEmpty')}</p>`;
            return `<ul>` + m.map(x => `<li><strong>${formatDateDK(x.dato)}:</strong> ${esc(x.titel)}${x.note ? ' — ' + esc(x.note) : ''}</li>`).join('') + `</ul>`;
        })()}
    `);
    aabnVindue(html);
});

document.addEventListener('DOMContentLoaded', () => {
    const f = document.getElementById('rep-from'), t = document.getElementById('rep-to');
    if (f) f.value = repFra; if (t) t.value = repTil;
    opdaterRepInfo();
});
