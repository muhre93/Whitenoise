// ==================================================
// BabyRo — Diagrammer
// Rene SVG-diagrammer uden nogen biblioteker.
// Bruges af både Log-siden og Vækst-siden.
// ==================================================

const CHART_W = 720;
const CHART_H = 320;

function chartEsc(s) {
    return String(s == null ? "" : s)
        .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function niceMax(value) {
    if (value <= 0) return 1;
    const exp = Math.pow(10, Math.floor(Math.log10(value)));
    const norm = value / exp;
    let step;
    if (norm <= 1) step = 1;
    else if (norm <= 2) step = 2;
    else if (norm <= 2.5) step = 2.5;
    else if (norm <= 5) step = 5;
    else step = 10;
    return step * exp;
}

let clipTaeller = 0;
function chartWrap(inner, legend) {
    return `<div class="chart-box">
        <svg viewBox="0 0 ${CHART_W} ${CHART_H}" class="chart-svg" preserveAspectRatio="xMidYMid meet" role="img">${inner}</svg>
        ${legend ? `<div class="chart-legend">${legend}</div>` : ''}
    </div>`;
}

// ==================================================
// SØJLEDIAGRAM
// data: [{ label, value, highlight }]
// ==================================================
function barChart(data, opts = {}) {
    const fmt = opts.format || (v => String(v));
    const pad = { top: 20, right: 20, bottom: 40, left: 52 };
    const w = CHART_W - pad.left - pad.right;
    const h = CHART_H - pad.top - pad.bottom;

    if (!data.length) return emptyChart("Ingen data i den valgte periode.");

    const max = niceMax(Math.max(...data.map(d => d.value), 0.001));
    const slot = w / data.length;
    const barW = Math.max(3, Math.min(46, slot * 0.62));

    let grid = "", bars = "", labels = "";
    for (let i = 0; i <= 4; i++) {
        const v = (max / 4) * i;
        const y = pad.top + h - (v / max) * h;
        grid += `<line x1="${pad.left}" y1="${y}" x2="${pad.left + w}" y2="${y}" class="c-grid"/>`;
        grid += `<text x="${pad.left - 8}" y="${y + 4}" class="c-axis" text-anchor="end">${chartEsc(fmt(v))}</text>`;
    }

    // Gennemsnitslinje
    const avg = data.reduce((s, d) => s + d.value, 0) / data.length;
    const avgY = pad.top + h - (avg / max) * h;
    const avgLine = `<line x1="${pad.left}" y1="${avgY}" x2="${pad.left + w}" y2="${avgY}" class="c-avg"/>`;

    // Vis kun hvert n'te navn, så de ikke overlapper
    const every = Math.ceil(data.length / 14);

    data.forEach((d, i) => {
        const x = pad.left + slot * i + (slot - barW) / 2;
        const bh = Math.max(d.value > 0 ? 2 : 0, (d.value / max) * h);
        const y = pad.top + h - bh;
        bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="4" class="c-bar${d.highlight ? ' c-bar-hi' : ''}"><title>${chartEsc(d.label)}: ${chartEsc(fmt(d.value))}</title></rect>`;
        if (i % every === 0 || i === data.length - 1) {
            labels += `<text x="${(x + barW / 2).toFixed(1)}" y="${pad.top + h + 20}" class="c-axis" text-anchor="middle">${chartEsc(d.label)}</text>`;
        }
    });

    const legend = `<span class="c-key"><i class="c-swatch c-sw-bar"></i>Pr. dag</span>
                    <span class="c-key"><i class="c-swatch c-sw-avg"></i>Gennemsnit: ${chartEsc(fmt(avg))}</span>`;
    return chartWrap(grid + avgLine + bars + labels, legend);
}

// ==================================================
// LINJEDIAGRAM
// series: [{ points: [{x, y, label}], klasse }]
// bands:  [{ lower: [{x,y}], upper: [{x,y}] }]
// ==================================================
function lineChart(opts) {
    const pad = { top: 20, right: 20, bottom: 40, left: 52 };
    const w = CHART_W - pad.left - pad.right;
    const h = CHART_H - pad.top - pad.bottom;
    const fmtY = opts.formatY || (v => String(Math.round(v * 10) / 10));
    const fmtX = opts.formatX || (v => String(v));

    const allPts = [];
    (opts.series || []).forEach(s => allPts.push(...s.points));
    (opts.bands || []).forEach(b => { allPts.push(...b.lower, ...b.upper); });
    if (!allPts.length) return emptyChart(opts.empty || "Ingen data endnu.");

    const xMin = opts.xMin != null ? opts.xMin : Math.min(...allPts.map(p => p.x));
    const xMax = opts.xMax != null ? opts.xMax : Math.max(...allPts.map(p => p.x));
    let yMin = opts.yMin != null ? opts.yMin : Math.min(...allPts.map(p => p.y));
    let yMax = opts.yMax != null ? opts.yMax : Math.max(...allPts.map(p => p.y));
    if (yMax === yMin) { yMax += 1; yMin -= 1; }
    const yPad = (yMax - yMin) * 0.1;
    yMin -= yPad; yMax += yPad;

    const X = v => pad.left + ((v - xMin) / (xMax - xMin || 1)) * w;
    const Y = v => pad.top + h - ((v - yMin) / (yMax - yMin || 1)) * h;

    let grid = "";
    for (let i = 0; i <= 4; i++) {
        const v = yMin + ((yMax - yMin) / 4) * i;
        const y = Y(v);
        grid += `<line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${pad.left + w}" y2="${y.toFixed(1)}" class="c-grid"/>`;
        grid += `<text x="${pad.left - 8}" y="${(y + 4).toFixed(1)}" class="c-axis" text-anchor="end">${chartEsc(fmtY(v))}</text>`;
    }

    const ticks = opts.xTicks || 6;
    for (let i = 0; i <= ticks; i++) {
        const v = xMin + ((xMax - xMin) / ticks) * i;
        grid += `<text x="${X(v).toFixed(1)}" y="${pad.top + h + 20}" class="c-axis" text-anchor="middle">${chartEsc(fmtX(v))}</text>`;
    }

    // Alt der tegnes, klippes til selve grafområdet
    const clipId = "clip" + (++clipTaeller) + "-" + Math.random().toString(36).slice(2, 7);
    const clipDef = `<defs><clipPath id="${clipId}"><rect x="${pad.left}" y="${pad.top - 4}" width="${w}" height="${h + 8}"/></clipPath></defs>`;

    // Normalområde som skygge
    let bandSvg = "";
    (opts.bands || []).forEach(b => {
        const up = b.upper.map(p => `${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
        const lo = b.lower.slice().reverse().map(p => `${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
        bandSvg += `<polygon points="${up} ${lo}" class="c-band"/>`;
    });

    let lines = "", dots = "";
    (opts.series || []).forEach(s => {
        if (!s.points.length) return;
        const d = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
        lines += `<path d="${d}" class="c-line ${s.klasse || ''}" fill="none"/>`;
        if (s.dots !== false) {
            s.points.forEach(p => {
                dots += `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="4.5" class="c-dot ${s.klasse || ''}"><title>${chartEsc(p.label || (fmtX(p.x) + ': ' + fmtY(p.y)))}</title></circle>`;
            });
        }
    });

    const tegnet = `<g clip-path="url(#${clipId})">${bandSvg}${lines}${dots}</g>`;
    return chartWrap(clipDef + grid + tegnet, opts.legend);
}

// ==================================================
// DØGNKORT — hvornår på døgnet barnet sov
// rows: [{ label, blocks: [{startMin, endMin, title}] }]
// ==================================================
function dayTimeline(rows) {
    if (!rows.length) return emptyChart("Ingen data i den valgte periode.");

    const pad = { top: 26, right: 16, bottom: 26, left: 52 };
    const rowH = Math.max(10, Math.min(26, 240 / rows.length));
    const h = rows.length * rowH;
    const totalH = h + pad.top + pad.bottom;
    const w = CHART_W - pad.left - pad.right;
    const X = min => pad.left + (min / 1440) * w;

    let grid = "";
    for (let t = 0; t <= 24; t += 3) {
        const x = X(t * 60);
        grid += `<line x1="${x.toFixed(1)}" y1="${pad.top}" x2="${x.toFixed(1)}" y2="${pad.top + h}" class="c-grid"/>`;
        grid += `<text x="${x.toFixed(1)}" y="${pad.top - 10}" class="c-axis" text-anchor="middle">${String(t).padStart(2, '0')}</text>`;
    }
    // Nattemarkering
    const night = `<rect x="${X(0)}" y="${pad.top}" width="${(X(6 * 60) - X(0)).toFixed(1)}" height="${h}" class="c-night"/>
                   <rect x="${X(20 * 60)}" y="${pad.top}" width="${(X(1440) - X(20 * 60)).toFixed(1)}" height="${h}" class="c-night"/>`;

    let blocks = "", labels = "";
    rows.forEach((r, i) => {
        const y = pad.top + i * rowH;
        labels += `<text x="${pad.left - 8}" y="${(y + rowH / 2 + 4).toFixed(1)}" class="c-axis" text-anchor="end">${chartEsc(r.label)}</text>`;
        r.blocks.forEach(b => {
            const x1 = X(b.startMin), x2 = X(Math.min(1440, b.endMin));
            blocks += `<rect x="${x1.toFixed(1)}" y="${(y + 2).toFixed(1)}" width="${Math.max(2, x2 - x1).toFixed(1)}" height="${(rowH - 4).toFixed(1)}" rx="3" class="c-block"><title>${chartEsc(b.title)}</title></rect>`;
        });
    });

    const inner = night + grid + blocks + labels;
    return `<div class="chart-box">
        <svg viewBox="0 0 ${CHART_W} ${totalH}" class="chart-svg" preserveAspectRatio="xMidYMid meet" role="img">${inner}</svg>
        <div class="chart-legend"><span class="c-key"><i class="c-swatch c-sw-block"></i>Søvn</span><span class="c-key"><i class="c-swatch c-sw-night"></i>Nat (20-06)</span></div>
    </div>`;
}

function emptyChart(msg) {
    return `<div class="chart-empty">${chartEsc(msg)}</div>`;
}
