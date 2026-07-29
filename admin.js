// ==================================================
// BabyRo — admin.js
// Redigerer alt indhold i appen og gemmer det i Firestore:
//   content/sounds  → { categories: [...] }
//   content/texts   → alle tekster
// Lydfiler uploades til Firebase Storage under lyde/
// ==================================================

let auth = null, db = null;

if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
    } catch (e) {
        alert("Firebase kunne ikke starte. Tjek firebase-config.js.\n\n" + e.message);
    }
}

// Arbejdskopi af indholdet
let sounds = JSON.parse(JSON.stringify(DEFAULT_SOUNDS));
let texts = JSON.parse(JSON.stringify(DEFAULT_TEXTS));
let dirty = false;

// Felter under "Generelle tekster" — nøgle: [label, type]
const GENERAL_FIELDS = {
    appTitle: ["Appens navn (øverst)", "text"],
    appSubtitle: ["Undertekst i toppen", "text"],
    navPlayer: ["Faneblad 1: Lyde", "text"],
    navHistory: ["Faneblad 2: Log", "text"],
    navSleep: ["Faneblad 3: Søvn", "text"],
    navLeaps: ["Faneblad 4: Spring", "text"],
    navProfile: ["Faneblad 5: Profil", "text"],
    timerLabel: ["Søvnur: overskrift", "text"],
    autoStopLabel: ["Søvnur: tekst ved sluk-timer", "text"],
    stopAllLabel: ["Knap: Sluk alt lyd", "text"],
    todayBoxTitle: ["Boks: Søvn i dag", "text"],
    smartTitle: ["Smart-lyt: overskrift", "text"],
    smartDesc: ["Smart-lyt: forklaring", "area"],
    smartSoundLabel: ["Smart-lyt: label for lydvalg", "text"],
    smartSensitivityLabel: ["Smart-lyt: label for følsomhed", "text"],
    historyTitle: ["Log: overskrift", "text"],
    historySub: ["Log: underoverskrift", "text"],
    statsTitle: ["Log: overskrift over grafen", "text"],
    guestWarning: ["Log: advarsel til gæster (HTML)", "area"],
    profileTitle: ["Profil: overskrift", "text"]
};

// ==========================================
// HJÆLPERE
// ==========================================
function markDirty() {
    dirty = true;
    const el = document.getElementById('save-status');
    el.textContent = "Du har ændringer, der ikke er udgivet.";
    el.className = "unsaved";
}
function markClean(msg) {
    dirty = false;
    const el = document.getElementById('save-status');
    el.textContent = msg || "Alt er gemt.";
    el.className = "saved";
}
function esc(str) {
    return String(str == null ? "" : str)
        .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
function slugify(str) {
    return String(str).toLowerCase().trim()
        .replaceAll('æ', 'ae').replaceAll('ø', 'o').replaceAll('å', 'a')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('lyd-' + Date.now());
}
function move(arr, index, dir) {
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
}

window.addEventListener('beforeunload', (e) => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
});

// ==========================================
// LYDE
// ==========================================
function renderSounds() {
    const wrap = document.getElementById('sounds-list');
    wrap.innerHTML = sounds.map((cat, ci) => `
        <div class="card">
            <div class="card-head">
                <h3>${esc(cat.icon)} ${esc(cat.title) || 'Uden navn'}</h3>
                <div class="card-tools">
                    <button class="icon-btn" data-act="cat-up" data-ci="${ci}" title="Flyt op">↑</button>
                    <button class="icon-btn" data-act="cat-down" data-ci="${ci}" title="Flyt ned">↓</button>
                    <button class="icon-btn del" data-act="cat-del" data-ci="${ci}" title="Slet kortet">🗑</button>
                </div>
            </div>

            <div class="row">
                <label class="field" style="max-width:110px;">
                    <span>Ikon</span>
                    <input type="text" value="${esc(cat.icon)}" data-ci="${ci}" data-field="icon" class="sound-input">
                </label>
                <label class="field">
                    <span>Titel på kortet</span>
                    <input type="text" value="${esc(cat.title)}" data-ci="${ci}" data-field="title" class="sound-input">
                </label>
                <label class="field">
                    <span>Teknisk id (må ikke ændres, når lyden er i brug)</span>
                    <input type="text" value="${esc(cat.id)}" data-ci="${ci}" data-field="id" class="sound-input">
                </label>
            </div>

            <span class="field"><span>Varianter i rullemenuen</span></span>
            ${(cat.variants || []).map((v, vi) => `
                <div class="variant">
                    <div class="row">
                        <label class="field" style="max-width:220px;">
                            <span>Navn i menuen</span>
                            <input type="text" value="${esc(v.label)}" data-ci="${ci}" data-vi="${vi}" data-field="label" class="sound-input">
                        </label>
                        <label class="field">
                            <span>Filsti eller adresse</span>
                            <input type="text" value="${esc(v.url)}" data-ci="${ci}" data-vi="${vi}" data-field="url" class="sound-input">
                        </label>
                        <button class="icon-btn del" data-act="var-del" data-ci="${ci}" data-vi="${vi}" style="margin-bottom:16px;" title="Slet variant">🗑</button>
                    </div>
                    <div class="upload-row">
                        <label class="upload-label">
                            Upload lydfil
                            <input type="file" accept="audio/*" data-act="upload" data-ci="${ci}" data-vi="${vi}">
                        </label>
                        <button class="preview-btn" data-act="preview" data-ci="${ci}" data-vi="${vi}">▶ Afspil</button>
                        <span class="upload-info" id="up-${ci}-${vi}"></span>
                    </div>
                </div>
            `).join('')}
            <button class="btn btn-add" data-act="var-add" data-ci="${ci}">+ Tilføj variant</button>
        </div>
    `).join('');
}

document.getElementById('sounds-list').addEventListener('input', (e) => {
    const el = e.target;
    if (!el.classList.contains('sound-input')) return;
    const ci = Number(el.dataset.ci);
    const field = el.dataset.field;
    if (el.dataset.vi !== undefined) sounds[ci].variants[Number(el.dataset.vi)][field] = el.value;
    else sounds[ci][field] = el.value;
    markDirty();
});

document.getElementById('sounds-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.tagName === 'INPUT') return;
    const act = btn.dataset.act;
    const ci = Number(btn.dataset.ci);
    const vi = btn.dataset.vi !== undefined ? Number(btn.dataset.vi) : null;

    if (act === 'cat-up') { move(sounds, ci, -1); renderSounds(); markDirty(); }
    if (act === 'cat-down') { move(sounds, ci, 1); renderSounds(); markDirty(); }
    if (act === 'cat-del') {
        if (confirm(`Slet lydkortet "${sounds[ci].title}"?`)) { sounds.splice(ci, 1); renderSounds(); markDirty(); }
    }
    if (act === 'var-add') { sounds[ci].variants.push({ label: "Ny variant", url: "" }); renderSounds(); markDirty(); }
    if (act === 'var-del') {
        if (sounds[ci].variants.length <= 1) { alert("Der skal være mindst én variant på et lydkort."); return; }
        sounds[ci].variants.splice(vi, 1); renderSounds(); markDirty();
    }
    if (act === 'preview') {
        const url = sounds[ci].variants[vi].url;
        if (!url) { alert("Der er ingen fil på denne variant endnu."); return; }
        const a = new Audio(url);
        a.play().catch(() => alert("Kunne ikke afspille:\n" + url));
    }
});

// ---------- UPLOAD TIL CLOUDFLARE ----------
function getToken() { return sessionStorage.getItem('babyRoWorkerToken') || ""; }

function uploadToWorker(file, onProgress) {
    return new Promise((resolve, reject) => {
        const token = getToken();
        if (!token) return reject(new Error("Gem din Cloudflare-nøgle under fanen Filer først."));
        if (!WORKER_URL || WORKER_URL.includes("dit-brugernavn")) return reject(new Error("Udfyld WORKER_URL i cloudflare-config.js."));

        const name = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', `${WORKER_URL}/upload/${encodeURIComponent(name)}`);
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg');

        xhr.upload.onprogress = e => {
            if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
            let data = {};
            try { data = JSON.parse(xhr.responseText); } catch (e) {}
            if (xhr.status === 200 && data.url) resolve(data);
            else reject(new Error(data.error || `Fejl ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Ingen forbindelse til din Worker. Tjek WORKER_URL og CORS."));
        xhr.send(file);
    });
}

document.getElementById('sounds-list').addEventListener('change', async (e) => {
    const input = e.target;
    if (input.dataset.act !== 'upload') return;
    const file = input.files[0];
    if (!file) return;
    const ci = Number(input.dataset.ci);
    const vi = Number(input.dataset.vi);
    const info = document.getElementById(`up-${ci}-${vi}`);
    info.className = "upload-info";

    try {
        const res = await uploadToWorker(file, pct => { info.textContent = `Uploader... ${pct}%`; });
        sounds[ci].variants[vi].url = res.url;
        info.textContent = "✔ Uploadet";
        info.className = "upload-info done";
        const urlField = document.querySelector(`input[data-ci="${ci}"][data-vi="${vi}"][data-field="url"]`);
        if (urlField) urlField.value = res.url;
        markDirty();
    } catch (err) {
        info.textContent = err.message;
        info.className = "upload-info error";
    }
});

document.getElementById('btn-add-category').addEventListener('click', () => {
    const title = prompt("Hvad skal lydkortet hedde? (f.eks. Fugle)");
    if (!title) return;
    sounds.push({ id: slugify(title), icon: "🔊", title: title, variants: [{ label: "Variant 1", url: "" }] });
    renderSounds();
    markDirty();
});

// ==========================================
// GENERELLE TEKSTER
// ==========================================
function renderGeneral() {
    const wrap = document.getElementById('general-list');
    wrap.innerHTML = Object.keys(GENERAL_FIELDS).map(key => {
        const [label, type] = GENERAL_FIELDS[key];
        const val = texts[key] != null ? texts[key] : "";
        return `
            <label class="field">
                <span>${esc(label)}</span>
                ${type === 'area'
                    ? `<textarea rows="3" data-key="${key}" class="general-input">${esc(val)}</textarea>`
                    : `<input type="text" value="${esc(val)}" data-key="${key}" class="general-input">`}
            </label>`;
    }).join('');
}

// Alle simple felter (også dem der ligger direkte i HTML'en)
document.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.classList.contains('general-input')) return;
    if (!el.dataset.key) return;
    texts[el.dataset.key] = el.value;
    markDirty();
});

function fillStaticFields() {
    document.querySelectorAll('.general-input[data-key]').forEach(el => {
        if (el.closest('#general-list')) return; // dem tegnes af renderGeneral
        el.value = texts[el.dataset.key] != null ? texts[el.dataset.key] : "";
    });
}

// ==========================================
// SØVN-KORT
// ==========================================
function renderSleep() {
    const wrap = document.getElementById('sleep-list');
    wrap.innerHTML = (texts.sleepCards || []).map((c, si) => `
        <div class="card">
            <div class="card-head">
                <h3>Kort ${si + 1}</h3>
                <div class="card-tools">
                    <button class="icon-btn" data-act="up" data-si="${si}">↑</button>
                    <button class="icon-btn" data-act="down" data-si="${si}">↓</button>
                    <button class="icon-btn del" data-act="del" data-si="${si}">🗑</button>
                </div>
            </div>
            <label class="field">
                <span>Overskrift</span>
                <input type="text" value="${esc(c.title)}" data-si="${si}" data-field="title" class="sleep-input">
            </label>
            <label class="field">
                <span>Tekst (HTML)</span>
                <textarea rows="10" data-si="${si}" data-field="body" class="sleep-input">${esc(c.body)}</textarea>
            </label>
        </div>
    `).join('');
}

document.getElementById('sleep-list').addEventListener('input', (e) => {
    const el = e.target;
    if (!el.classList.contains('sleep-input')) return;
    texts.sleepCards[Number(el.dataset.si)][el.dataset.field] = el.value;
    markDirty();
});
document.getElementById('sleep-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const si = Number(btn.dataset.si);
    if (btn.dataset.act === 'up') move(texts.sleepCards, si, -1);
    if (btn.dataset.act === 'down') move(texts.sleepCards, si, 1);
    if (btn.dataset.act === 'del') {
        if (!confirm("Slet dette søvn-kort?")) return;
        texts.sleepCards.splice(si, 1);
    }
    renderSleep(); markDirty();
});
document.getElementById('btn-add-sleep').addEventListener('click', () => {
    texts.sleepCards.push({ title: "Ny overskrift", body: "<p>Skriv teksten her.</p>" });
    renderSleep(); markDirty();
});

// ==========================================
// TIGERSPRING
// ==========================================
function renderLeaps() {
    const wrap = document.getElementById('leaps-list');
    wrap.innerHTML = (texts.leapCards || []).map((c, li) => `
        <div class="card">
            <div class="card-head">
                <h3>Spring ${esc(c.nr)}</h3>
                <div class="card-tools">
                    <button class="icon-btn" data-act="up" data-li="${li}">↑</button>
                    <button class="icon-btn" data-act="down" data-li="${li}">↓</button>
                    <button class="icon-btn del" data-act="del" data-li="${li}">🗑</button>
                </div>
            </div>
            <div class="row">
                <label class="field" style="max-width:110px;">
                    <span>Nummer</span>
                    <input type="number" value="${esc(c.nr)}" data-li="${li}" data-field="nr" class="leap-input">
                </label>
                <label class="field" style="max-width:130px;">
                    <span>Fra uge</span>
                    <input type="number" value="${esc(c.from)}" data-li="${li}" data-field="from" class="leap-input">
                </label>
                <label class="field" style="max-width:130px;">
                    <span>Til uge</span>
                    <input type="number" value="${esc(c.to)}" data-li="${li}" data-field="to" class="leap-input">
                </label>
                <label class="field">
                    <span>Titel</span>
                    <input type="text" value="${esc(c.title)}" data-li="${li}" data-field="title" class="leap-input">
                </label>
            </div>
            <label class="field">
                <span>Tekst (HTML)</span>
                <textarea rows="8" data-li="${li}" data-field="body" class="leap-input">${esc(c.body)}</textarea>
            </label>
        </div>
    `).join('');
}

document.getElementById('leaps-list').addEventListener('input', (e) => {
    const el = e.target;
    if (!el.classList.contains('leap-input')) return;
    const field = el.dataset.field;
    const val = (field === 'nr' || field === 'from' || field === 'to') ? Number(el.value) : el.value;
    texts.leapCards[Number(el.dataset.li)][field] = val;
    markDirty();
});
document.getElementById('leaps-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const li = Number(btn.dataset.li);
    if (btn.dataset.act === 'up') move(texts.leapCards, li, -1);
    if (btn.dataset.act === 'down') move(texts.leapCards, li, 1);
    if (btn.dataset.act === 'del') {
        if (!confirm("Slet dette spring?")) return;
        texts.leapCards.splice(li, 1);
    }
    renderLeaps(); markDirty();
});
document.getElementById('btn-add-leap').addEventListener('click', () => {
    const nextNr = (texts.leapCards || []).reduce((m, c) => Math.max(m, Number(c.nr) || 0), 0) + 1;
    texts.leapCards.push({ nr: nextNr, from: 0, to: 0, title: "Nyt spring", body: "<p>Skriv teksten her.</p>" });
    renderLeaps(); markDirty();
});

// ==========================================
// GEM / UDGIV
// ==========================================
async function saveAll() {
    if (!db) { alert("Ingen forbindelse til databasen."); return; }

    // Tjek for dubletter i id'er — ellers rammer to lydkort samme rullemenu
    const ids = sounds.map(s => s.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) { alert("To lydkort har samme tekniske id: " + dupes.join(", ") + "\nRet det, før du gemmer."); return; }
    if (ids.some(id => !id)) { alert("Et lydkort mangler et teknisk id."); return; }

    const statusEl = document.getElementById('save-status');
    statusEl.textContent = "Gemmer...";
    statusEl.className = "";

    try {
        await Promise.all([
            db.collection("content").doc("sounds").set({ categories: sounds, updated: Date.now() }),
            db.collection("content").doc("texts").set(Object.assign({}, texts, { updated: Date.now() }))
        ]);
        markClean("Udgivet ✔ Ændringerne er live i appen.");
    } catch (e) {
        statusEl.textContent = "Kunne ikke gemme: " + e.message;
        statusEl.className = "unsaved";
    }
}
document.getElementById('btn-save-all').addEventListener('click', saveAll);

// ==========================================
// BACKUP
// ==========================================
document.getElementById('btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ sounds, texts }, null, 2)], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `babyro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
});

document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            if (data.sounds) sounds = data.sounds;
            if (data.texts) texts = Object.assign({}, DEFAULT_TEXTS, data.texts);
            renderAll();
            markDirty();
            alert("Backup indlæst. Tryk 'Gem og udgiv ændringer' for at gøre den live.");
        } catch (err) {
            alert("Filen kunne ikke læses: " + err.message);
        }
    };
    reader.readAsText(file);
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm("Nulstil ALT indhold til standard? Dine ændringer går tabt.")) return;
    sounds = JSON.parse(JSON.stringify(DEFAULT_SOUNDS));
    texts = JSON.parse(JSON.stringify(DEFAULT_TEXTS));
    renderAll();
    markDirty();
});

// ==========================================
// FILER PÅ CLOUDFLARE
// ==========================================
const tokenInput = document.getElementById('worker-token');
const tokenStatus = document.getElementById('token-status');

document.getElementById('btn-save-token').addEventListener('click', () => {
    const val = tokenInput.value.trim();
    if (!val) { tokenStatus.textContent = "Skriv nøglen først."; tokenStatus.className = "upload-info error"; return; }
    sessionStorage.setItem('babyRoWorkerToken', val);
    tokenStatus.textContent = "✔ Nøglen er gemt for denne session";
    tokenStatus.className = "upload-info done";
    loadFiles();
});

function formatBytes(b) {
    if (!b) return "";
    return b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.round(b / 1024) + " KB";
}

async function loadFiles() {
    const wrap = document.getElementById('files-list');
    const token = getToken();
    if (!token) { wrap.innerHTML = '<p class="muted">Gem din nøgle øverst først.</p>'; return; }

    wrap.innerHTML = '<p class="muted">Henter...</p>';
    try {
        const res = await fetch(`${WORKER_URL}/files`, { headers: { Authorization: 'Bearer ' + token } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Fejl ${res.status}`);
        if (!data.files.length) { wrap.innerHTML = '<p class="muted">Ingen filer uploadet endnu.</p>'; return; }

        wrap.innerHTML = data.files.map(f => `
            <div class="variant">
                <div class="row" style="align-items:center;">
                    <div class="field" style="margin-bottom:0;">
                        <span>${esc(f.name)} &middot; ${formatBytes(f.size)}</span>
                        <input type="text" value="${esc(f.url)}" readonly>
                    </div>
                </div>
                <div class="upload-row">
                    <button class="preview-btn" data-file-act="copy" data-url="${esc(f.url)}">Kopiér adresse</button>
                    <button class="preview-btn" data-file-act="play" data-url="${esc(f.url)}">&#9654; Afspil</button>
                    <button class="preview-btn" data-file-act="del" data-name="${esc(f.name)}">Slet</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        wrap.innerHTML = `<p class="upload-info error">${esc(err.message)}</p>`;
    }
}

document.getElementById('btn-refresh-files').addEventListener('click', loadFiles);

document.getElementById('files-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-file-act]');
    if (!btn) return;
    const act = btn.dataset.fileAct;

    if (act === 'copy') {
        navigator.clipboard.writeText(btn.dataset.url);
        btn.textContent = "Kopieret!";
        setTimeout(() => { btn.textContent = "Kopiér adresse"; }, 1500);
    }
    if (act === 'play') {
        new Audio(btn.dataset.url).play().catch(() => alert("Kunne ikke afspille filen."));
    }
    if (act === 'del') {
        const name = btn.dataset.name;
        if (!confirm(`Slet filen "${name}" permanent?\n\nHusk at fjerne adressen fra dine lydkort bagefter.`)) return;
        try {
            const res = await fetch(`${WORKER_URL}/lyde/${encodeURIComponent(name)}`, {
                method: 'DELETE', headers: { Authorization: 'Bearer ' + getToken() }
            });
            if (!res.ok) throw new Error("Kunne ikke slette filen.");
            loadFiles();
        } catch (err) { alert(err.message); }
    }
});

// ==========================================
// FANER
// ==========================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        window.scrollTo(0, 0);
    });
});

function renderAll() {
    if (tokenInput && getToken()) { tokenInput.value = getToken(); tokenStatus.textContent = '✔ Nøgle aktiv'; tokenStatus.className = 'upload-info done'; }
    renderSounds();
    renderGeneral();
    renderSleep();
    renderLeaps();
    fillStaticFields();
}

// ==========================================
// LOGIN-PORT
// ==========================================
async function loadExisting() {
    try {
        const [s, t] = await Promise.all([
            db.collection("content").doc("sounds").get(),
            db.collection("content").doc("texts").get()
        ]);
        if (s.exists && Array.isArray(s.data().categories) && s.data().categories.length) sounds = s.data().categories;
        if (t.exists && t.data()) texts = Object.assign({}, DEFAULT_TEXTS, t.data());
    } catch (e) {
        console.log("Kunne ikke hente gemt indhold — starter fra standardindhold.", e);
    }
    renderAll();
    markClean();
}

if (auth) {
    document.getElementById('btn-admin-login').addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(err => alert("Login fejl: " + err.message));
    });
    document.getElementById('btn-logout').addEventListener('click', () => auth.signOut());
    document.getElementById('btn-gate-logout').addEventListener('click', () => auth.signOut());

    auth.onAuthStateChanged(async (user) => {
        const gate = document.getElementById('gate');
        const admin = document.getElementById('admin');
        const gateText = document.getElementById('gate-text');
        const loginBtn = document.getElementById('btn-admin-login');
        const gateLogout = document.getElementById('btn-gate-logout');

        if (!user) {
            gate.style.display = 'flex';
            admin.style.display = 'none';
            gateText.textContent = "Log ind med din administrator-konto for at redigere appen.";
            loginBtn.style.display = 'block';
            gateLogout.style.display = 'none';
            return;
        }

        const email = (user.email || "").toLowerCase();
        const isAdmin = ADMIN_EMAILS.map(a => a.toLowerCase()).includes(email);

        if (!isAdmin) {
            gate.style.display = 'flex';
            admin.style.display = 'none';
            gateText.textContent = `${email} har ikke adgang til admin. Log ud og brug din administrator-konto.`;
            loginBtn.style.display = 'none';
            gateLogout.style.display = 'block';
            return;
        }

        gate.style.display = 'none';
        admin.style.display = 'block';
        document.getElementById('admin-user').textContent = "Logget ind som " + email;
        await loadExisting();
    });
} else {
    document.getElementById('gate-text').textContent = "Firebase er ikke sat op. Udfyld firebase-config.js først.";
}
