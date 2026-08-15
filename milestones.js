// ==================================================
// BabyRo — milestones.js
// Milepæle med billeder. Billederne skaleres ned i
// browseren, før de gemmes, så de fylder ca. 40 KB
// i stedet for flere megabyte.
// ==================================================

const MILEPAEL_FORSLAG = (typeof DEFAULT_TEXTS !== 'undefined' && DEFAULT_TEXTS.milestoneSuggestions) || [
    "Første smil", "Første grin", "Løfter hovedet", "Griber om ting",
    "Triller om på maven", "Sover igennem", "Første tand", "Sidder selv",
    "Første ord", "Kravler", "Står selv", "Første skridt",
    "Vinker farvel", "Drikker af kop", "Første sætning", "Løber"
];

function milepaelForslag() {
    return (typeof TEXTS !== 'undefined' && Array.isArray(TEXTS.milestoneSuggestions) && TEXTS.milestoneSuggestions.length)
        ? TEXTS.milestoneSuggestions : MILEPAEL_FORSLAG;
}

let msPhotoData = null;

document.addEventListener('DOMContentLoaded', () => {
    const dl = document.getElementById('ms-suggestions');
    if (dl) dl.innerHTML = milepaelForslag().map(s => `<option value="${esc(s)}">`).join('');
    const d = document.getElementById('ms-date');
    if (d && !d.value) d.value = todayKey();
});

// ==========================================
// BILLEDE: skalér ned i browseren
// ==========================================
function skalerBillede(file, maxSide = 700, kvalitet = 0.72) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > height && width > maxSide) { height = height * maxSide / width; width = maxSide; }
                else if (height > maxSide) { width = width * maxSide / height; height = maxSide; }
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(width);
                canvas.height = Math.round(height);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', kvalitet));
            };
            img.onerror = () => reject(new Error("Billedet kunne ikke læses."));
            img.src = reader.result;
        };
        reader.onerror = () => reject(new Error("Filen kunne ikke læses."));
        reader.readAsDataURL(file);
    });
}

document.getElementById('ms-photo')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const prev = document.getElementById('ms-preview');
    if (!file) { msPhotoData = null; if (prev) prev.innerHTML = ''; return; }
    if (prev) prev.innerHTML = `<p class="field-label">Behandler billedet...</p>`;
    try {
        msPhotoData = await skalerBillede(file);
        const kb = Math.round(msPhotoData.length * 0.75 / 1024);
        if (prev) prev.innerHTML = `<div class="ms-thumb-wrap">
            <img src="${msPhotoData}" alt="Forhåndsvisning" class="ms-thumb">
            <small>Klar til at gemme · ca. ${kb} KB</small></div>`;
    } catch (err) {
        msPhotoData = null;
        if (prev) prev.innerHTML = `<p class="field-label notif-error">${esc(err.message)}</p>`;
    }
});

// ==========================================
// GEM
// ==========================================
document.getElementById('btn-add-milestone')?.addEventListener('click', async () => {
    if (isGuest) { alert(T('loginToSaveMs')); return; }
    const titel = document.getElementById('ms-title').value.trim();
    const dato = document.getElementById('ms-date').value;
    if (!titel) { alert(T('msWhatHappened')); return; }
    if (!dato) { alert(T('pickDate')); return; }

    const m = {
        id: 'm' + Date.now(),
        title: titel,
        date: dato,
        note: document.getElementById('ms-note').value.trim() || "",
        photo: msPhotoData || "",
        createdAt: Date.now()
    };

    if (await gemMilepael(m)) {
        milestones.push(m);
        document.getElementById('ms-title').value = '';
        document.getElementById('ms-note').value = '';
        document.getElementById('ms-photo').value = '';
        document.getElementById('ms-preview').innerHTML = '';
        msPhotoData = null;
        renderMilestones();
    }
});

window.sletMilepael = async function (id) {
    if (!confirm(T('msDelete'))) return;
    milestones = milestones.filter(m => m.id !== id);
    if (await sletMilepaelData(id)) renderMilestones();
};

// ==========================================
// VISNING
// ==========================================
function alderVedMilepael(dato) {
    if (!babyBirthDate) return "";
    const b = new Date(babyBirthDate + "T00:00:00");
    const d = new Date(dato + "T00:00:00");
    const dage = Math.round((d - b) / 86400000);
    if (dage < 0) return "";
    if (dage < 31) return `${dage} ${T('daysOld')}`;
    const mdr = dage / 30.4375;
    if (mdr < 24) return `${Math.floor(mdr)} ${T('monthsOld')}`;
    return `${Math.floor(mdr / 12)} ${T('yearsOld')}`;
}

function renderMilestones() {
    const el = document.getElementById('milestone-list');
    if (!el) return;
    const liste = milestones.slice().sort((a, b) => b.date.localeCompare(a.date));
    if (!liste.length) {
        el.innerHTML = `<p class="empty-state">${T('msNone')}</p>`;
        return;
    }
    el.innerHTML = `<div class="timeline">` + liste.map(m => `
        <div class="tl-item">
            <div class="tl-dot"></div>
            <div class="tl-body">
                <div class="tl-head">
                    <strong>${esc(m.title)}</strong>
                    <button class="delete-btn" onclick="sletMilepael('${m.id}')">❌</button>
                </div>
                <div class="tl-meta">${new Date(m.date).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' })}${alderVedMilepael(m.date) ? ' · ' + alderVedMilepael(m.date) : ''}</div>
                ${m.note ? `<p class="tl-note">${esc(m.note)}</p>` : ''}
                ${m.photo ? `<img src="${m.photo}" alt="${esc(m.title)}" class="tl-photo" loading="lazy">` : ''}
            </div>
        </div>`).join('') + `</div>`;
}
