// ==================================================
// BabyRo — log.js
// Periodevælger, nøgletal og diagrammer på Søvn-siden
// ==================================================

let logFra = dateKeyOffset(6);
let logTil = todayKey();
let aktivtChart = 'total';

function saetPeriode(dage) {
    logFra = dateKeyOffset(dage - 1);
    logTil = todayKey();
    const f = document.getElementById('range-from'), t = document.getElementById('range-to');
    if (f) f.value = logFra;
    if (t) t.value = logTil;
    renderLogPage();
}

document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        saetPeriode(Number(btn.dataset.days));
    });
});

document.getElementById('btn-apply-range')?.addEventListener('click', () => {
    const f = document.getElementById('range-from').value;
    const t = document.getElementById('range-to').value;
    if (!f || !t) { alert("Vælg både en fra- og en til-dato."); return; }
    if (f > t) { alert("Fra-datoen skal ligge før til-datoen."); return; }
    logFra = f; logTil = t;
    document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
    renderLogPage();
});

document.querySelectorAll('.chart-tab[data-chart]').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.chart-tab[data-chart]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        aktivtChart = tab.dataset.chart;
        tegnChart();
    });
});

function dageIPerioden() {
    const out = [];
    const slut = keyToDate(logTil);
    const d = keyToDate(logFra);
    let vagt = 0;
    while (d <= slut && vagt < 400) {
        const key = isoKey(d);
        const data = localSleepLogs[key] || { sessions: [], total: 0 };
        out.push({ key, total: data.total || 0, sessions: data.sessions || [] });
        d.setDate(d.getDate() + 1);
        vagt++;
    }
    return out;
}

function sessionStartMin(s) {
    if (s.startMs) {
        const d = new Date(s.startMs);
        return d.getHours() * 60 + d.getMinutes();
    }
    const m = /Kl\.\s*(\d{1,2})[.:](\d{2})/.exec(s.timeDisplay || "");
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function renderStats() {
    const el = document.getElementById('stat-grid');
    if (!el) return;
    const dage = dageIPerioden();
    const medSoevn = dage.filter(d => d.total > 0);
    const totalSek = dage.reduce((s, d) => s + d.total, 0);
    const antalLure = dage.reduce((s, d) => s + d.sessions.length, 0);
    const gnsPrDag = medSoevn.length ? totalSek / medSoevn.length : 0;
    const gnsLur = antalLure ? totalSek / antalLure : 0;
    const bedste = dage.reduce((b, d) => (d.total > (b ? b.total : 0) ? d : b), null);
    const laengste = dage.reduce((max, d) => Math.max(max, ...d.sessions.map(s => s.durationSec || 0), 0), 0);

    const fase = soevnFaseForAlder(alderIMdr());
    let vurdering = "";
    if (fase && gnsPrDag > 0) {
        const timer = gnsPrDag / 3600;
        if (timer < fase.soevnMin) vurdering = `Under anbefalet (${fase.soevnMin}-${fase.soevnMax} t)`;
        else if (timer > fase.soevnMax) vurdering = `Over anbefalet (${fase.soevnMin}-${fase.soevnMax} t)`;
        else vurdering = `Inden for anbefalet (${fase.soevnMin}-${fase.soevnMax} t)`;
    }

    const kort = [
        { v: formatShort(gnsPrDag), l: "Gns. pr. dag", n: vurdering },
        { v: formatShort(totalSek), l: "I alt i perioden", n: `${medSoevn.length} dage med data` },
        { v: antalLure, l: "Lure i alt", n: medSoevn.length ? `Gns. ${(antalLure / medSoevn.length).toFixed(1)} pr. dag` : "" },
        { v: formatShort(gnsLur), l: "Gns. lurlængde", n: laengste ? `Længste: ${formatShort(laengste)}` : "" },
        { v: bedste && bedste.total ? formatShort(bedste.total) : "–", l: "Bedste dag", n: bedste && bedste.total ? shortDate(bedste.key) : "" }
    ];
    el.innerHTML = kort.map(k => `<div class="stat-card">
        <div class="stat-value">${k.v}</div><div class="stat-label">${k.l}</div>
        ${k.n ? `<div class="stat-note">${k.n}</div>` : ''}</div>`).join('');
}

function tegnChart() {
    const area = document.getElementById('chart-area');
    const help = document.getElementById('chart-help');
    if (!area) return;
    const dage = dageIPerioden();
    const iDag = todayKey();

    if (aktivtChart === 'total') {
        area.innerHTML = barChart(dage.map(d => ({ label: shortDate(d.key), value: d.total / 3600, highlight: d.key === iDag })),
            { format: v => v.toFixed(1) + 't' });
        help.textContent = "Samlet søvn pr. dag i timer. Den stiplede linje er dit gennemsnit for perioden.";
    }
    else if (aktivtChart === 'trend') {
        const fase = soevnFaseForAlder(alderIMdr());
        const punkter = dage.map((d, i) => ({ x: i, y: d.total / 3600, label: `${shortDate(d.key)}: ${formatShort(d.total)}` }));
        const glidende = punkter.map((p, i) => {
            const fra = Math.max(0, i - 1), til = Math.min(punkter.length - 1, i + 1);
            let sum = 0, n = 0;
            for (let j = fra; j <= til; j++) { sum += punkter[j].y; n++; }
            return { x: i, y: sum / n };
        });
        const bands = fase ? [{
            lower: punkter.map(p => ({ x: p.x, y: fase.soevnMin })),
            upper: punkter.map(p => ({ x: p.x, y: fase.soevnMax }))
        }] : [];
        area.innerHTML = lineChart({
            series: [{ points: punkter, klasse: 'c-s1' }, { points: glidende, klasse: 'c-s2', dots: false }],
            bands, yMin: 0,
            formatY: v => v.toFixed(0) + 't',
            formatX: v => dage[Math.round(v)] ? shortDate(dage[Math.round(v)].key) : '',
            xTicks: Math.min(6, Math.max(1, dage.length - 1)),
            legend: `<span class="c-key"><i class="c-swatch c-sw-s1"></i>Faktisk søvn</span>
                     <span class="c-key"><i class="c-swatch c-sw-s2"></i>3-dages gennemsnit</span>
                     ${fase ? `<span class="c-key"><i class="c-swatch c-sw-band"></i>Anbefalet ${fase.soevnMin}-${fase.soevnMax} t</span>` : ''}`
        });
        help.textContent = "Den lyse linje viser den enkelte dag, den mørke jævner udsvingene ud. Se efter retningen, ikke enkeltdage.";
    }
    else if (aktivtChart === 'naps') {
        area.innerHTML = barChart(dage.map(d => ({ label: shortDate(d.key), value: d.sessions.length, highlight: d.key === iDag })),
            { format: v => Math.round(v) });
        const fase = soevnFaseForAlder(alderIMdr());
        help.textContent = fase ? `Antal gemte lure pr. dag. I ${babyName}s alder er ${fase.lure} lure typisk.` : "Antal gemte lure pr. dag.";
    }
    else if (aktivtChart === 'length') {
        area.innerHTML = barChart(dage.map(d => ({
            label: shortDate(d.key),
            value: d.sessions.length ? (d.total / d.sessions.length) / 60 : 0,
            highlight: d.key === iDag
        })), { format: v => Math.round(v) + 'm' });
        help.textContent = "Gennemsnitlig længde pr. lur i minutter. Korte lure under 45 min. kan betyde, at barnet vågner mellem søvncyklusserne.";
    }
    else if (aktivtChart === 'clock') {
        const rows = dage.map(d => ({
            label: shortDate(d.key),
            blocks: d.sessions.map(s => {
                const start = sessionStartMin(s);
                if (start == null) return null;
                return { startMin: start, endMin: start + Math.round((s.durationSec || 0) / 60), title: `${s.timeDisplay} (${s.durationText})` };
            }).filter(Boolean)
        })).filter(r => r.blocks.length);
        area.innerHTML = dayTimeline(rows);
        help.textContent = "Hvornår på døgnet der blev sovet. Her ser du hurtigt, om rytmen er ved at falde på plads.";
    }
}

function renderHistoryList() {
    const c = document.getElementById('history-container');
    if (!c) return;
    const dage = dageIPerioden().filter(d => d.sessions.length).reverse();
    if (!dage.length) { c.innerHTML = `<div class="empty-state">Ingen gemte lure i den valgte periode.</div>`; return; }
    c.innerHTML = dage.map(d => `
        <div class="history-day-card">
            <h3>${formatDateDK(d.key)}</h3>
            <ul>${d.sessions.map((s, i) => `
                <li><span>${esc(s.timeDisplay)}</span>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <strong>${esc(s.durationText)}</strong>
                        <button class="delete-btn" onclick="deleteLogEntry('${d.key}', ${i})">❌</button>
                    </div></li>`).join('')}</ul>
            <div class="day-total">Dagens total: ${formatTimeText(d.total)}</div>
        </div>`).join('');
}

function renderLogPage() {
    const info = document.getElementById('range-info');
    if (info) info.textContent = `Viser ${dageIPerioden().length} dage: ${formatDateDK(logFra)} – ${formatDateDK(logTil)}`;
    renderStats();
    tegnChart();
    renderHistoryList();
}

document.addEventListener('DOMContentLoaded', () => {
    const f = document.getElementById('range-from'), t = document.getElementById('range-to');
    if (f) f.value = logFra;
    if (t) t.value = logTil;
    renderLogPage();
});
