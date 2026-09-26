// ==================================================
// BabyBasen — milestones.js
// Milepæle med billede (billedet gemmes i Cloudflare KV)
// ==================================================

let msBillede = null;   // { dataUrl, fil }

function msForslag() {
    const liste = lokal(TEXTS.milestoneSuggestions || DEFAULT_TEXTS.milestoneSuggestions);
    const arr = Array.isArray(liste) ? liste : [];
    const dl = document.getElementById('ms-suggestions');
    if (dl) dl.innerHTML = arr.map(s => `<option value="${esc(s)}"></option>`).join('');
}

document.getElementById('ms-photo')?.addEventListener('change', e => {
    const fil = e.target.files && e.target.files[0];
    const prev = document.getElementById('ms-preview');
    if (!fil) { msBillede = null; if (prev) prev.innerHTML = ""; return; }
    if (fil.size > 4 * 1024 * 1024) { alert(T('msPhotoBig')); e.target.value = ""; return; }
    const r = new FileReader();
    r.onload = () => {
        msBillede = { dataUrl: r.result, fil };
        if (prev) prev.innerHTML = `<img src="${r.result}" class="ms-thumb" alt="">`;
    };
    r.readAsDataURL(fil);
});

async function uploadMilepaelBillede(fil) {
    if (typeof CLOUDFLARE_URL === 'undefined' || !CLOUDFLARE_URL) return "";
    try {
        const fd = new FormData();
        fd.append('file', fil);
        const svar = await fetch(CLOUDFLARE_URL.replace(/\/$/, '') + '/upload/photo', { method: 'POST', body: fd });
        if (!svar.ok) return "";
        const j = await svar.json();
        return j.url || "";
    } catch (e) { return ""; }
}

document.getElementById('btn-add-milestone')?.addEventListener('click', async () => {
    const titel = document.getElementById('ms-title').value.trim();
    if (!titel) { alert(T('msNeedTitle')); return; }
    const btn = document.getElementById('btn-add-milestone');
    btn.disabled = true;
    const m = {
        id: 'ms' + Date.now(),
        titel,
        dato: document.getElementById('ms-date').value || todayKey(),
        note: document.getElementById('ms-note').value.trim(),
        billede: ""
    };
    if (msBillede) {
        const url = await uploadMilepaelBillede(msBillede.fil);
        m.billede = url || msBillede.dataUrl;   // falder tilbage til lokalt billede
    }
    milestones.push(m);
    milestones.sort((a, b) => b.dato.localeCompare(a.dato));
    await gemMilepael(m);
    spor('milepaelGemt');
    document.getElementById('ms-title').value = "";
    document.getElementById('ms-note').value = "";
    document.getElementById('ms-photo').value = "";
    document.getElementById('ms-preview').innerHTML = "";
    msBillede = null;
    btn.disabled = false;
    renderMilestones();
});

async function sletMilepael(id) {
    if (!confirm(T('msDeleteSure'))) return;
    milestones = milestones.filter(m => m.id !== id);
    await sletMilepaelData(id);
    renderMilestones();
}

function renderMilestones() {
    msForslag();
    const d = document.getElementById('ms-date');
    if (d && !d.value) d.value = todayKey();

    const box = document.getElementById('milestone-list');
    if (!box) return;
    if (!milestones.length) { box.innerHTML = `<div class="empty-state">${T('msEmpty')}</div>`; return; }
    const sorteret = milestones.slice().sort((a, b) => b.dato.localeCompare(a.dato));
    box.innerHTML = `<div class="ms-timeline">` + sorteret.map(m => {
        const mdr = babyBirthDate ? alderIMdrVedDato(m.dato) : null;
        return `<div class="ms-item">
            <div class="ms-dot"></div>
            <div class="ms-body">
                <div class="ms-head">
                    <strong>${esc(m.titel)}</strong>
                    <button class="delete-btn" onclick="sletMilepael('${m.id}')">❌</button>
                </div>
                <div class="care-meta">${formatDateDK(m.dato)}${mdr != null ? ' · ' + minTekstMdr(mdr) : ''}</div>
                ${m.note ? `<p>${esc(m.note)}</p>` : ''}
                ${m.billede ? `<img src="${esc(m.billede)}" class="ms-photo" alt="" loading="lazy">` : ''}
            </div>
        </div>`;
    }).join('') + `</div>`;
}
