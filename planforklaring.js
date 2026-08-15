// ==================================================
// BabyRo — planforklaring.js
// Tegner de visuelle forklaringer på "Sådan virker
// Dagens plan" — med barnets egne tal, hvis de findes.
// ==================================================

// ==========================================
// 1) VÅGETIDS-TIDSLINJE
// Viser et døgn med lure og vågevinduer for alderen
// ==========================================
function tegnVaageVisual() {
    const el = document.getElementById('wake-visual');
    if (!el) return;

    const fase = soevnFaseForAlder(alderIMdr());
    if (!fase) {
        el.innerHTML = `<div class="chart-empty">${T('noBirthDate')}</div>`;
        return;
    }

    const W = 720, H = 150;
    const pad = { l: 14, r: 14, t: 34, b: 30 };
    const w = W - pad.l - pad.r;

    // Et forenklet døgn: vågn kl. 7, lure efter vågetiden, i seng kl. 19
    const startMin = 7 * 60, slutMin = 19 * 60;
    const X = m => pad.l + ((m - startMin) / (slutMin - startMin)) * w;
    const vaageMid = (fase.vaageMin + fase.vaageMax) / 2;
    const lurLaengde = Math.max(45, Math.min(120, vaageMid * 0.75));

    let blokke = "", maerker = "", t = startMin, n = 0;
    while (t < slutMin - 30 && n < 8) {
        const vaageSlut = Math.min(t + vaageMid, slutMin);
        // Vågeperiode
        blokke += `<rect x="${X(t).toFixed(1)}" y="${pad.t}" width="${(X(vaageSlut) - X(t)).toFixed(1)}" height="34" rx="6" class="pv-wake"/>`;
        blokke += `<text x="${((X(t) + X(vaageSlut)) / 2).toFixed(1)}" y="${pad.t + 22}" class="pv-label" text-anchor="middle">${Math.round(vaageMid)} ${T('peAwake')}</text>`;
        if (vaageSlut >= slutMin - 20) { t = slutMin; break; }
        // Lur
        const lurSlut = Math.min(vaageSlut + lurLaengde, slutMin);
        blokke += `<rect x="${X(vaageSlut).toFixed(1)}" y="${pad.t}" width="${(X(lurSlut) - X(vaageSlut)).toFixed(1)}" height="34" rx="6" class="pv-sleep"/>`;
        blokke += `<text x="${((X(vaageSlut) + X(lurSlut)) / 2).toFixed(1)}" y="${pad.t + 22}" class="pv-label light" text-anchor="middle">💤</text>`;
        maerker += `<line x1="${X(vaageSlut).toFixed(1)}" y1="${pad.t - 8}" x2="${X(vaageSlut).toFixed(1)}" y2="${pad.t + 42}" class="pv-mark"/>`;
        t = lurSlut; n++;
    }

    let timer = "";
    for (let h = 7; h <= 19; h += 2) {
        timer += `<text x="${X(h * 60).toFixed(1)}" y="${H - 8}" class="pv-axis" text-anchor="middle">${h}:00</text>`;
        timer += `<line x1="${X(h * 60).toFixed(1)}" y1="${pad.t + 40}" x2="${X(h * 60).toFixed(1)}" y2="${pad.t + 46}" class="pv-tick"/>`;
    }

    el.innerHTML = `
        <div class="plan-visual">
            <svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img">
                <text x="${pad.l}" y="20" class="pv-title">${T('peDayFor')} — ${esc(faseNavn(fase))}</text>
                ${blokke}${maerker}${timer}
            </svg>
            <div class="chart-legend">
                <span class="c-key"><i class="c-swatch pv-sw-wake"></i>${T('peLegendWake')} (${minTekst(fase.vaageMin)}–${minTekst(fase.vaageMax)})</span>
                <span class="c-key"><i class="c-swatch pv-sw-sleep"></i>${T('peLegendNap')}</span>
                <span class="c-key"><i class="c-swatch pv-sw-mark"></i>${T('peLegendMark')}</span>
            </div>
            <p class="mini-help">${T('peExampleNote', { lure: fase.lure })}</p>
        </div>`;
}

// ==========================================
// 2) TRÆTHEDSKURVEN
// Hvorfor det er sværere at putte et overtræt barn
// ==========================================
function tegnTraethedsVisual() {
    const el = document.getElementById('tired-visual');
    if (!el) return;

    const W = 720, H = 220;
    const pad = { l: 46, r: 18, t: 26, b: 46 };
    const w = W - pad.l - pad.r, h = H - pad.t - pad.b;
    const X = p => pad.l + (p / 100) * w;
    const Y = v => pad.t + h - (v / 100) * h;

    // To kurver: søvntrykket stiger jævnt, stresshormonet først sent og stejlt
    let soevnPunkter = [], stressPunkter = [];
    for (let p = 0; p <= 100; p += 2) {
        soevnPunkter.push([p, Math.min(100, p * 0.95)]);
        stressPunkter.push([p, p < 62 ? 4 : Math.min(100, 4 + Math.pow((p - 62) / 38, 1.8) * 96)]);
    }
    const sti = pts => pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${X(pt[0]).toFixed(1)},${Y(pt[1]).toFixed(1)}`).join(' ');

    // Selve søvnvinduet
    const vFra = X(48), vTil = X(66);

    el.innerHTML = `
        <div class="plan-visual">
            <svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img">
                <rect x="${vFra}" y="${pad.t}" width="${(vTil - vFra).toFixed(1)}" height="${h}" class="pv-window"/>
                <text x="${((vFra + vTil) / 2).toFixed(1)}" y="${pad.t - 8}" class="pv-title" text-anchor="middle">${T('peWindow')}</text>

                <line x1="${pad.l}" y1="${pad.t + h}" x2="${pad.l + w}" y2="${pad.t + h}" class="c-grid"/>
                <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${pad.t + h}" class="c-grid"/>

                <path d="${sti(soevnPunkter)}" class="pv-line-sleep"/>
                <path d="${sti(stressPunkter)}" class="pv-line-stress"/>

                <text x="${pad.l - 8}" y="${Y(95).toFixed(1)}" class="pv-axis" text-anchor="end">${T('peHigh')}</text>
                <text x="${pad.l - 8}" y="${(pad.t + h).toFixed(1)}" class="pv-axis" text-anchor="end">${T('peLow')}</text>
                <text x="${X(6).toFixed(1)}" y="${H - 22}" class="pv-axis">${T('peWoke')}</text>
                <text x="${((vFra + vTil) / 2).toFixed(1)}" y="${H - 22}" class="pv-axis" text-anchor="middle">${T('peEasy')}</text>
                <text x="${X(94).toFixed(1)}" y="${H - 22}" class="pv-axis" text-anchor="end">${T('peOvertired')}</text>
                <text x="${(pad.l + w / 2).toFixed(1)}" y="${H - 6}" class="pv-axis" text-anchor="middle">${T('peAxisTime')}</text>
            </svg>
            <div class="chart-legend">
                <span class="c-key"><i class="c-swatch pv-sw-sleeppress"></i>${T('peSleepPressure')}</span>
                <span class="c-key"><i class="c-swatch pv-sw-stress"></i>${T('peStress')}</span>
            </div>
            <p class="mini-help">${T('peTiredCaption')}</p>
        </div>`;
}

// ==========================================
// 3) TABEL OVER VÅGETIDER
// ==========================================
function tegnFaseTabel() {
    const el = document.getElementById('phase-table');
    if (!el) return;
    const alder = alderIMdr();
    const nu = soevnFaseForAlder(alder);

    el.innerHTML = `<div class="table-scroll"><table class="wake-table">
        <tr><th>${T('peTableAge')}</th><th>${T('peTableWake')}</th><th>${T('peTableSleep')}</th><th>${T('peTableNaps')}</th></tr>
        ${SOEVN_FASER.map(f => {
            const aktiv = nu && f.fraMdr === nu.fraMdr;
            const til = f.tilMdr > 100 ? '24' : f.tilMdr;
            return `<tr class="${aktiv ? 'aktiv-fase' : ''}">
                <td>${f.fraMdr}–${til} ${T('peMonths')}${aktiv ? ` <span class="naa">${T('peNow')}</span>` : ''}</td>
                <td>${minTekst(f.vaageMin)}–${minTekst(f.vaageMax)}</td>
                <td>${f.soevnMin}–${f.soevnMax} ${SPROG === 'en' ? 'hours' : 'timer'}</td>
                <td>${f.lure}</td>
            </tr>`;
        }).join('')}
    </table></div>`;
}

function renderPlanForklaring() {
    tegnVaageVisual();
    tegnTraethedsVisual();
    tegnFaseTabel();
}

document.addEventListener('DOMContentLoaded', renderPlanForklaring);
