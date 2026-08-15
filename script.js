// ==================================================
// BabyRo v5 — script.js (kerne)
// ==================================================

let SOUNDS = JSON.parse(JSON.stringify(DEFAULT_SOUNDS));
let TEXTS = JSON.parse(JSON.stringify(DEFAULT_TEXTS));

let currentUserId = null;
let currentEmail = "";
let isGuest = true;

// Aktivt barn
let childId = null;
let childList = [];                 // [{id, name, gender, ...}]
let babyName = "Baby";
let babyGender = "neutral";
let babyDueDate = "";
let babyBirthDate = "";
let birthInfo = {};
let inviteCode = "";

// Data for det aktive barn
let localSleepLogs = {};            // { 'YYYY-MM-DD': {sessions,total} }
let growthData = { measurements: [], customTypes: [] };
let careData = {};                  // { 'YYYY-MM': [entries] }
let milestones = [];

// ==========================================
// FIREBASE
// ==========================================
let auth = null, db = null;
if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
    } catch (e) { console.log("Firebase kunne ikke starte:", e); }
}

// ==========================================
// DATO-HJÆLPERE
// ==========================================
function isoKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function todayKey() { return isoKey(new Date()); }
function monthKey(dateKeyOrDate) {
    if (typeof dateKeyOrDate === 'string') return dateKeyOrDate.slice(0, 7);
    return isoKey(dateKeyOrDate).slice(0, 7);
}
function dateKeyOffset(daysAgo) {
    const d = new Date(); d.setDate(d.getDate() - daysAgo); return isoKey(d);
}
function keyToDate(key) { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); }
function formatDateDK(key) {
    const s = keyToDate(key).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function weekdayShort(key) { return keyToDate(key).toLocaleDateString('da-DK', { weekday: 'short' }).replace('.', ''); }
function shortDate(key) { return keyToDate(key).toLocaleDateString('da-DK', { day: 'numeric', month: 'numeric' }); }
function clockFromMs(ms) { return new Date(ms).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }); }

function alderIMdr(atMs) {
    if (!babyBirthDate) return null;
    const b = new Date(babyBirthDate + "T00:00:00");
    return ((atMs ? new Date(atMs) : new Date()) - b) / (1000 * 60 * 60 * 24 * 30.4375);
}
function alderTekst() {
    const m = alderIMdr();
    if (m == null) return "";
    if (m < 1) return `${Math.round(m * 30.4375)} dage`;
    if (m < 24) {
        const hele = Math.floor(m), dage = Math.round((m - hele) * 30.4375);
        return dage > 0 ? `${hele} mdr. og ${dage} dage` : `${hele} måneder`;
    }
    return `${Math.floor(m / 12)} år og ${Math.round(m % 12)} mdr.`;
}
function minTekst(min) {
    min = Math.max(0, Math.round(min));
    const t = Math.floor(min / 60), m = min % 60;
    if (t > 0 && m > 0) return `${t} t ${m} min`;
    if (t > 0) return `${t} time${t > 1 ? 'r' : ''}`;
    return `${m} min`;
}
function formatTimeText(secs) {
    if (!secs || secs <= 0) return `0:00 min`;
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} t`;
    return `${m}:${String(s).padStart(2, '0')} min`;
}
function formatShort(secs) {
    const h = Math.floor(secs / 3600), m = Math.round((secs % 3600) / 60);
    return h > 0 ? `${h}t ${m}m` : `${m}m`;
}
function esc(s) {
    return String(s == null ? "" : s).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

// ==========================================
// DATALAG — gæst bruger localStorage, konto bruger Firestore
// ==========================================
function gaestNoegle(hvad) { return 'babyRo_' + hvad; }

function gaestLaes(hvad, fallback) {
    try { return JSON.parse(localStorage.getItem(gaestNoegle(hvad))) ?? fallback; }
    catch (e) { return fallback; }
}
function gaestSkriv(hvad, data) {
    localStorage.setItem(gaestNoegle(hvad), JSON.stringify(data));
}

// --- SØVN ---
async function gemSoevnMaaned(ym) {
    if (isGuest || !childId || !db) { gaestSkriv('sleep', localSleepLogs); return; }
    const days = {};
    Object.keys(localSleepLogs).forEach(k => { if (k.startsWith(ym)) days[k] = localSleepLogs[k]; });
    try { await db.collection("children").doc(childId).collection("sleep").doc(ym).set({ days }); }
    catch (e) { console.log("Kunne ikke gemme søvn:", e); }
}

// --- VÆKST ---
async function gemVaekstData() {
    if (isGuest || !childId || !db) { gaestSkriv('growth', growthData); return true; }
    try { await db.collection("children").doc(childId).collection("data").doc("growth").set(growthData); return true; }
    catch (e) { alert("Kunne ikke gemme: " + e.message); return false; }
}

// --- PLEJE ---
async function gemPlejeMaaned(ym) {
    if (isGuest || !childId || !db) { gaestSkriv('care', careData); return true; }
    try { await db.collection("children").doc(childId).collection("care").doc(ym).set({ entries: careData[ym] || [] }); return true; }
    catch (e) { alert("Kunne ikke gemme: " + e.message); return false; }
}

// --- MILEPÆLE ---
async function gemMilepael(m) {
    if (isGuest || !childId || !db) { gaestSkriv('milestones', milestones); return true; }
    try { await db.collection("children").doc(childId).collection("milestones").doc(m.id).set(m); return true; }
    catch (e) { alert("Kunne ikke gemme: " + e.message); return false; }
}
async function sletMilepaelData(id) {
    if (isGuest || !childId || !db) { gaestSkriv('milestones', milestones); return true; }
    try { await db.collection("children").doc(childId).collection("milestones").doc(id).delete(); return true; }
    catch (e) { alert("Kunne ikke slette: " + e.message); return false; }
}

// ==========================================
// INDHOLD
// ==========================================
function t(key) {
    const raw = TEXTS[key];
    return typeof raw === 'string' ? raw.replaceAll('{navn}', babyName) : '';
}
function fill(id, key) { const el = document.getElementById(id); if (el) el.innerHTML = t(key); }

async function loadContentFromCloud() {
    if (!db) return;
    try {
        const [s, x] = await Promise.all([
            db.collection("content").doc("sounds").get(),
            db.collection("content").doc("texts").get()
        ]);
        if (s.exists && Array.isArray(s.data().categories) && s.data().categories.length) SOUNDS = s.data().categories;
        if (x.exists && x.data()) TEXTS = Object.assign({}, DEFAULT_TEXTS, x.data());
    } catch (e) { console.log("Bruger standardindhold.", e); }
    renderSounds();
    renderTexts();
}

function renderSounds() {
    const grid = document.getElementById('sound-grid');
    const sel = document.getElementById('smart-sound-select');
    if (!grid) return;
    grid.innerHTML = SOUNDS.map(c => `
        <div class="sound-card">
            <div class="card-icon">${c.icon || '🔊'}</div>
            <h3>${esc(c.title)}</h3>
            <select class="sound-variant" id="variant-${c.id}">
                ${(c.variants || []).map(v => `<option value="${esc(v.url)}">${esc(v.label)}</option>`).join('')}
            </select>
            <button class="play-btn" data-category="${c.id}">Afspil</button>
        </div>`).join('');
    if (sel) {
        const prev = sel.value;
        sel.innerHTML = SOUNDS.map(c => `<option value="${c.id}">${c.icon || ''} ${esc(c.title)}</option>`).join('');
        if (prev && SOUNDS.some(c => c.id === prev)) sel.value = prev;
    }
    currentlyPlayingId = null;
}

function renderTexts() {
    document.title = TEXTS.appTitle + " — " + babyName;
    fill('txt-app-title', 'appTitle');
    fill('txt-app-subtitle', 'appSubtitle');
    document.querySelectorAll('.b-name').forEach(el => el.textContent = babyName);

    fill('txt-timer-label', 'timerLabel');
    fill('txt-autostop-label', 'autoStopLabel');
    const stopBtn = document.getElementById('stop-all');
    if (stopBtn) stopBtn.textContent = t('stopAllLabel');
    fill('txt-today-title', 'todayBoxTitle');
    fill('txt-smart-title', 'smartTitle');
    fill('txt-smart-desc', 'smartDesc');
    fill('txt-smart-sound-label', 'smartSoundLabel');
    fill('txt-smart-sens-label', 'smartSensitivityLabel');
    fill('txt-history-title', 'historyTitle');
    fill('txt-history-sub', 'historySub');
    fill('guest-warning', 'guestWarning');
    fill('txt-sleep-title', 'sleepTitle');
    fill('txt-sleep-sub', 'sleepSub');

    const sleepEl = document.getElementById('sleep-cards');
    if (sleepEl) sleepEl.innerHTML = (TEXTS.sleepCards || []).map(c =>
        `<div class="info-card"><h3>${(c.title || '').replaceAll('{navn}', babyName)}</h3>${(c.body || '').replaceAll('{navn}', babyName)}</div>`).join('');

    fill('txt-leap-title', 'leapTitle');
    fill('txt-leap-sub', 'leapSub');
    fill('txt-leap-status-title', 'leapStatusTitle');
    fill('txt-leap-intro-title', 'leapIntroTitle');
    fill('txt-leap-intro-body', 'leapIntroBody');
    fill('txt-leap-outro-title', 'leapOutroTitle');
    fill('txt-leap-outro-body', 'leapOutroBody');

    const leapEl = document.getElementById('leap-cards');
    if (leapEl) leapEl.innerHTML = (TEXTS.leapCards || []).map(c =>
        `<div class="info-card leap-card" id="leap-${c.nr}">
            <h3><span class="leap-badge">Spring ${c.nr}</span> Uge ${c.from}-${c.to}: ${(c.title || '').replaceAll('{navn}', babyName)}</h3>
            ${(c.body || '').replaceAll('{navn}', babyName)}
        </div>`).join('');

    fill('txt-profile-title', 'profileTitle');
    renderLeapStatus();
}

// ==========================================
// SØVNUR — start / pause / fortsæt
// ==========================================
let elapsedSeconds = 0, intervalId = null, sessionStartTime = null, urKoerer = false;
const timeDisplay = document.getElementById('time-elapsed');
const btnPauseTime = document.getElementById('btn-pause-time');

function updateDisplay() {
    if (!timeDisplay) return;
    const h = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(elapsedSeconds % 60).padStart(2, '0');
    timeDisplay.textContent = `${h}:${m}:${s}`;
}
function opdaterUrKnap() {
    if (!btnPauseTime) return;
    if (urKoerer) { btnPauseTime.textContent = '⏸ Pause ur'; btnPauseTime.classList.remove('running'); }
    else { btnPauseTime.textContent = elapsedSeconds > 0 ? '▶ Fortsæt ur' : '▶ Start ur'; btnPauseTime.classList.add('running'); }
}
function startStopwatch() {
    if (sessionStartTime === null) sessionStartTime = new Date();
    clearInterval(intervalId);
    intervalId = setInterval(() => { elapsedSeconds++; updateDisplay(); }, 1000);
    urKoerer = true; opdaterUrKnap();
}
function stopStopwatch() { clearInterval(intervalId); urKoerer = false; opdaterUrKnap(); }
function resetStopwatch() { stopStopwatch(); elapsedSeconds = 0; sessionStartTime = null; updateDisplay(); opdaterUrKnap(); }

if (btnPauseTime) btnPauseTime.addEventListener('click', () => { urKoerer ? stopStopwatch() : startStopwatch(); });
document.getElementById('btn-reset-time')?.addEventListener('click', () => {
    if (confirm("Vil du nulstille uret uden at gemme?")) resetStopwatch();
});

// ==========================================
// LYDAFSPILLER
// ==========================================
const audioPlayer = document.getElementById('global-audio-player');
const soundGrid = document.getElementById('sound-grid');
const timerSelect = document.getElementById('timer-select');
let currentlyPlayingId = null, timeoutId = null, fadeInterval = null;

function resetAllButtons() {
    document.querySelectorAll('.play-btn[data-category]').forEach(b => { b.textContent = 'Afspil'; b.classList.remove('playing'); });
}
function stopAllSound() {
    clearTimer();
    if (audioPlayer) audioPlayer.pause();
    resetAllButtons();
    currentlyPlayingId = null;
}
if (soundGrid) {
    soundGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.play-btn[data-category]');
        if (!btn) return;
        const cat = btn.getAttribute('data-category');
        const sel = document.getElementById(`variant-${cat}`);
        if (!sel || !audioPlayer) return;
        if (currentlyPlayingId === cat) { stopAllSound(); return; }
        clearTimer(); resetAllButtons();
        audioPlayer.src = sel.value;
        btn.textContent = 'Pause lyd'; btn.classList.add('playing');
        currentlyPlayingId = cat;
        if (!urKoerer) startStopwatch();
        setupTimer();
        audioPlayer.play().catch(() => console.log("Kunne ikke afspille:", sel.value));
    });
    soundGrid.addEventListener('change', (e) => {
        if (!e.target.classList.contains('sound-variant')) return;
        const cat = e.target.id.replace('variant-', '');
        if (currentlyPlayingId === cat && audioPlayer) {
            audioPlayer.src = e.target.value;
            audioPlayer.play().catch(() => {});
        }
    });
}
document.getElementById('stop-all')?.addEventListener('click', stopAllSound);

function setupTimer() {
    clearTimer();
    if (!timerSelect) return;
    const min = parseInt(timerSelect.value);
    if (min > 0) {
        const fadeMs = (min <= 2) ? 30000 : 300000;
        timeoutId = setTimeout(() => fadeOutAudio(fadeMs), Math.max(0, min * 60000 - fadeMs));
    }
}
function fadeOutAudio(ms) {
    if (!audioPlayer) return;
    let v = 1.0;
    fadeInterval = setInterval(() => {
        v -= 0.01;
        if (v <= 0.05) stopAllSound(); else audioPlayer.volume = v;
    }, ms / 100);
}
function clearTimer() {
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
    if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null; }
    if (audioPlayer) audioPlayer.volume = 1.0;
}
if (timerSelect) timerSelect.addEventListener('change', () => { if (currentlyPlayingId) setupTimer(); });

// ==========================================
// SMART-LYT
// ==========================================
const btnSmartListen = document.getElementById('btn-smart-listen');
const smartStatus = document.getElementById('smart-status');
const smartBox = document.querySelector('.smart-listen-box');
const smartSensitivity = document.getElementById('smart-sensitivity');
const smartSoundSelect = document.getElementById('smart-sound-select');
const micLevel = document.getElementById('mic-level');
let micStream = null, audioCtx = null, analyser = null, micBuffer = null;
let listening = false, loudFrames = 0, listenTimerId = null;

function setSmartStatus(txt) { if (smartStatus) smartStatus.textContent = txt; }

async function startListening() {
    try { micStream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { setSmartStatus("Kunne ikke få adgang til mikrofonen. Tjek tilladelser."); return; }
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = audioCtx.createMediaStreamSource(micStream);
    analyser = audioCtx.createAnalyser(); analyser.fftSize = 1024;
    src.connect(analyser);
    micBuffer = new Uint8Array(analyser.fftSize);
    listening = true; loudFrames = 0;
    smartBox?.classList.add('listening');
    if (btnSmartListen) btnSmartListen.textContent = "Stop Smart-lyt";
    setSmartStatus("Lytter... alt er roligt. 💤");
    listenTimerId = setInterval(listenTick, 100);
}
function stopListening() {
    listening = false;
    if (listenTimerId) { clearInterval(listenTimerId); listenTimerId = null; }
    if (micStream) { micStream.getTracks().forEach(tr => tr.stop()); micStream = null; }
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
    smartBox?.classList.remove('listening');
    if (btnSmartListen) btnSmartListen.textContent = "Start Smart-lyt";
    if (micLevel) micLevel.style.width = "0%";
    setSmartStatus("Smart-lyt er slukket.");
}
function listenTick() {
    if (!listening || !analyser) return;
    if (audioPlayer && !audioPlayer.paused) {
        loudFrames = 0;
        if (micLevel) micLevel.style.width = "0%";
        setSmartStatus("Beroligende lyd kører 🎵 — lytter igen, når den stopper.");
        return;
    }
    analyser.getByteTimeDomainData(micBuffer);
    let sum = 0;
    for (let i = 0; i < micBuffer.length; i++) { const v = (micBuffer[i] - 128) / 128; sum += v * v; }
    const rms = Math.sqrt(sum / micBuffer.length);
    const sens = smartSensitivity ? parseInt(smartSensitivity.value) : 6;
    if (micLevel) micLevel.style.width = Math.min(100, Math.round(rms * 300)) + "%";
    if (rms > 0.28 - sens * 0.024) loudFrames++; else loudFrames = Math.max(0, loudFrames - 2);
    if (loudFrames > 15) { loudFrames = 0; triggerSoothingSound(); }
    else if (loudFrames > 5) setSmartStatus("Hører uro... 👂");
    else setSmartStatus("Lytter... alt er roligt. 💤");
}
function triggerSoothingSound() {
    const cat = smartSoundSelect ? smartSoundSelect.value : (SOUNDS[0] && SOUNDS[0].id);
    const btn = document.querySelector(`.play-btn[data-category="${cat}"]`);
    setSmartStatus("Uro registreret! Starter beroligende lyd... 🎵");
    if (btn && currentlyPlayingId === null) btn.click();
}
if (btnSmartListen) btnSmartListen.addEventListener('click', () => { listening ? stopListening() : startListening(); });

// ==========================================
// TEMA
// ==========================================
const btnThemeToggle = document.getElementById('btn-theme-toggle');
if (btnThemeToggle) {
    if (localStorage.getItem('babyRoTheme') === 'dark') {
        document.body.classList.add('dark-theme');
        btnThemeToggle.textContent = 'Skift til Dagstilstand ☀️';
    }
    btnThemeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const dark = document.body.classList.contains('dark-theme');
        localStorage.setItem('babyRoTheme', dark ? 'dark' : 'light');
        btnThemeToggle.textContent = dark ? 'Skift til Dagstilstand ☀️' : 'Skift til Nattilstand 🌙';
    });
}
function applyGenderTheme() {
    document.body.classList.remove('theme-dreng', 'theme-pige');
    if (babyGender === 'dreng') document.body.classList.add('theme-dreng');
    if (babyGender === 'pige') document.body.classList.add('theme-pige');
    document.querySelectorAll('.gender-btn').forEach(b =>
        b.classList.toggle('selected', b.getAttribute('data-gender') === babyGender));
}

// ==========================================
// SØVNLOG: GEM
// ==========================================
document.getElementById('btn-save-log')?.addEventListener('click', async () => {
    if (elapsedSeconds === 0) { alert("Søvnuret er på nul. Tryk 'Start ur' eller afspil en lyd først."); return; }
    const end = new Date();
    const start = sessionStartTime || new Date(end.getTime() - elapsedSeconds * 1000);
    const key = todayKey();
    if (!localSleepLogs[key]) localSleepLogs[key] = { sessions: [], total: 0 };
    localSleepLogs[key].sessions.push({
        timeDisplay: `Kl. ${clockFromMs(start.getTime())} - ${clockFromMs(end.getTime())}`,
        durationText: formatTimeText(elapsedSeconds),
        durationSec: elapsedSeconds,
        startMs: start.getTime(),
        endMs: end.getTime()
    });
    localSleepLogs[key].total += elapsedSeconds;

    await gemSoevnMaaned(monthKey(key));
    stopAllSound(); resetStopwatch();
    renderTodayLog(); renderPlanCard();
    if (typeof renderLogPage === 'function') renderLogPage();
    if (typeof planlaegNaesteSoevn === 'function') planlaegNaesteSoevn();
    visFane('nav-history');
    vaelgUnderfane('history', 'sub-overview');
});

window.deleteLogEntry = async function (key, index) {
    if (!confirm(`Slet denne søvntid for ${babyName}?`)) return;
    if (localSleepLogs[key]?.sessions[index]) {
        localSleepLogs[key].total = Math.max(0, localSleepLogs[key].total - (localSleepLogs[key].sessions[index].durationSec || 0));
        localSleepLogs[key].sessions.splice(index, 1);
        if (!localSleepLogs[key].sessions.length) delete localSleepLogs[key];
        await gemSoevnMaaned(monthKey(key));
        renderTodayLog(); renderPlanCard();
        if (typeof renderLogPage === 'function') renderLogPage();
    }
};

function renderTodayLog() {
    const listEl = document.getElementById('today-log-list');
    const totalEl = document.getElementById('today-total-time');
    const dateText = document.getElementById('today-date-text');
    if (!listEl || !totalEl) return;
    const key = todayKey();
    if (dateText) dateText.textContent = formatDateDK(key);
    const data = localSleepLogs[key];
    listEl.innerHTML = "";
    if (!data || !data.sessions.length) {
        listEl.innerHTML = `<li>Ingen lure gemt endnu i dag.</li>`;
        totalEl.textContent = "0:00 min";
        return;
    }
    data.sessions.forEach((s, i) => {
        listEl.innerHTML += `<li><span>${esc(s.timeDisplay)}</span>
            <div style="display:flex;align-items:center;gap:10px;">
                <span>${esc(s.durationText)}</span>
                <button class="delete-btn" onclick="deleteLogEntry('${key}', ${i})">❌</button>
            </div></li>`;
    });
    totalEl.textContent = formatTimeText(data.total);
}

// ==========================================
// DAGENS PLAN
// ==========================================
function sidsteLur() {
    let seneste = null;
    [todayKey(), dateKeyOffset(1)].forEach(key => {
        (localSleepLogs[key]?.sessions || []).forEach(s => {
            if (s.endMs && (!seneste || s.endMs > seneste.endMs)) seneste = s;
        });
    });
    return seneste;
}

function naesteSoevnTid() {
    const fase = soevnFaseForAlder(alderIMdr());
    const sidste = sidsteLur();
    if (!fase || !sidste || !sidste.endMs) return null;
    return {
        fase, vaagenSiden: sidste.endMs,
        tidligst: sidste.endMs + fase.vaageMin * 60000,
        senest: sidste.endMs + fase.vaageMax * 60000
    };
}

function renderPlanCard() {
    const card = document.getElementById('plan-card');
    if (!card) return;
    const alder = alderIMdr(), fase = soevnFaseForAlder(alder);
    const iDag = localSleepLogs[todayKey()] || { sessions: [], total: 0 };

    document.getElementById('plan-total').textContent = formatShort(iDag.total);
    document.getElementById('plan-naps').textContent = iDag.sessions.length;
    document.getElementById('plan-target').textContent = fase ? `${fase.soevnMin}-${fase.soevnMax} t` : '–';

    const sidsteMad = typeof sidsteMaaltid === 'function' ? sidsteMaaltid() : null;
    document.getElementById('plan-feed').textContent = sidsteMad
        ? minTekst((Date.now() - sidsteMad.ts) / 60000) : '–';

    const bar = document.getElementById('plan-bar-fill');
    if (bar && fase) {
        bar.style.width = Math.min(100, (iDag.total / 3600 / fase.soevnMax) * 100) + '%';
        bar.classList.toggle('full', iDag.total / 3600 >= fase.soevnMin);
    }

    const phaseEl = document.getElementById('plan-phase');
    const labelEl = document.getElementById('plan-label');
    const timeEl = document.getElementById('plan-time');
    const subEl = document.getElementById('plan-sub');
    const noteEl = document.getElementById('plan-note');

    if (!babyBirthDate) {
        phaseEl.textContent = "";
        labelEl.textContent = "Næste søvn"; timeEl.textContent = "–";
        subEl.innerHTML = 'Indtast <strong>fødselsdato</strong> under Profil, så regner BabyRo vågetider og næste sovetid ud.';
        noteEl.textContent = ""; return;
    }
    phaseEl.textContent = `${alderTekst()} · ${fase.navn}`;

    const naeste = naesteSoevnTid();
    if (!naeste) {
        labelEl.textContent = "Næste søvn"; timeEl.textContent = "–";
        subEl.innerHTML = `Vågetid i denne alder er <strong>${minTekst(fase.vaageMin)}-${minTekst(fase.vaageMax)}</strong>. Gem en lur, så regnes næste sovetid ud.`;
        noteEl.textContent = `Typisk ${fase.lure} lure om dagen i denne alder.`;
        return;
    }

    const nu = Date.now();
    const vaagen = Math.round((nu - naeste.vaagenSiden) / 60000);
    card.classList.remove('plan-now');

    if (nu < naeste.tidligst) {
        labelEl.textContent = "Næste søvnvindue åbner";
        timeEl.textContent = clockFromMs(naeste.tidligst);
        subEl.innerHTML = `Om <strong>${minTekst((naeste.tidligst - nu) / 60000)}</strong>. ${esc(babyName)} har været vågen i ${minTekst(vaagen)}.`;
        noteEl.textContent = `Vinduet er åbent fra ${clockFromMs(naeste.tidligst)} til ${clockFromMs(naeste.senest)}. Ram det, og putningen bliver meget lettere.`;
    } else if (nu <= naeste.senest) {
        card.classList.add('plan-now');
        labelEl.textContent = "Søvnvinduet er åbent nu 💤";
        timeEl.textContent = `Luk senest ${clockFromMs(naeste.senest)}`;
        subEl.innerHTML = `${esc(babyName)} har været vågen i <strong>${minTekst(vaagen)}</strong> — det er tid til at putte.`;
        noteEl.textContent = "Kig efter tegn: gnider øjne, kigger væk, gaber, bliver fjern. Start putterutinen nu.";
    } else {
        labelEl.textContent = "Vinduet er lukket";
        timeEl.textContent = `${minTekst((nu - naeste.senest) / 60000)} over`;
        subEl.innerHTML = `${esc(babyName)} har været vågen i <strong>${minTekst(vaagen)}</strong>, hvor ${minTekst(fase.vaageMax)} er det typiske maksimum.`;
        noteEl.textContent = "Et overtræt barn har sværere ved at falde i søvn, ikke lettere. Dæmp lys og lyd, og prøv en rolig putning nu.";
    }
}

// ==========================================
// TIGERSPRING
// ==========================================
function renderLeapStatus() {
    const el = document.getElementById('leap-status-text');
    if (!el) return;
    document.querySelectorAll('.leap-card').forEach(c => c.classList.remove('active-leap'));
    const leaps = (TEXTS.leapCards || []).slice().sort((a, b) => a.from - b.from);
    if (!babyDueDate) {
        el.innerHTML = `Indtast terminsdatoen under <strong>Profil</strong>, så viser BabyRo automatisk, hvilket spring ${esc(babyName)} er i.`;
        return;
    }
    const weeks = Math.floor((Date.now() - new Date(babyDueDate + "T00:00:00").getTime()) / (7 * 86400000));
    if (weeks < 0) {
        el.textContent = `Der er ca. ${Math.abs(weeks)} uger til termin. Det første spring kommer omkring uge ${leaps[0]?.from || 4}. 💛`;
        return;
    }
    const cur = leaps.find(l => weeks >= l.from && weeks <= l.to);
    const next = leaps.find(l => l.from > weeks);
    let msg = `${esc(babyName)} er ca. <strong>${weeks} uger</strong> (fra termin). `;
    if (cur) {
        msg += `I er sandsynligvis midt i <strong>Spring ${cur.nr}</strong> (uge ${cur.from}-${cur.to}). Hold ud — der er en solskinsperiode på vej! ⭐`;
        document.getElementById(`leap-${cur.nr}`)?.classList.add('active-leap');
    } else if (next) {
        const d = next.from - weeks;
        msg += `I er i en rolig periode. Næste er <strong>Spring ${next.nr}</strong> om ca. ${d} uge${d === 1 ? '' : 'r'}. ☀️`;
        document.getElementById(`leap-${next.nr}`)?.classList.add('active-leap');
    } else msg += `Alle tigerspring er overstået — godt klaret! 🎉`;
    el.innerHTML = msg;
}

// ==========================================
// DATA-EKSPORT
// ==========================================
document.getElementById('btn-export-data')?.addEventListener('click', () => {
    const data = { babyName, babyGender, babyBirthDate, babyDueDate, birthInfo, sleepLogs: localSleepLogs, growth: growthData, care: careData, milestones };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `babyro-${babyName.toLowerCase()}-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
});

// ==========================================
// FANER
// ==========================================
const TABS = [
    { id: 'nav-player', viewId: 'view-player' },
    { id: 'nav-history', viewId: 'view-history' },
    { id: 'nav-care', viewId: 'view-care' },
    { id: 'nav-growth', viewId: 'view-growth' },
    { id: 'nav-know', viewId: 'view-know' },
    { id: 'nav-profile', viewId: 'view-profile' }
];

function opdaterAlt() {
    applyGenderTheme();
    if (typeof refreshProfileInputs === 'function') refreshProfileInputs();
    renderTexts();
    renderTodayLog();
    renderPlanCard();
    if (typeof renderChildBar === 'function') renderChildBar();
    if (typeof renderLogPage === 'function') renderLogPage();
    if (typeof renderCare === 'function') renderCare();
    if (typeof renderGrowth === 'function') renderGrowth();
    if (typeof renderMilestones === 'function') renderMilestones();
    if (typeof planlaegNaesteSoevn === 'function') planlaegNaesteSoevn();
}

function visFane(navId, husk) {
    const tab = TABS.find(t => t.id === navId) || TABS[0];
    TABS.forEach(tt => {
        const v = document.getElementById(tt.viewId);
        if (v) { v.classList.remove('active-view'); v.style.display = 'none'; }
        document.getElementById(tt.id)?.classList.remove('active');
    });
    const view = document.getElementById(tab.viewId);
    if (view) { view.classList.add('active-view'); view.style.display = 'block'; }
    document.getElementById(tab.id)?.classList.add('active');
    if (husk !== false) huskFane('main', tab.id);

    if (tab.id === 'nav-history' && typeof renderLogPage === 'function') renderLogPage();
    if (tab.id === 'nav-care' && typeof renderCare === 'function') renderCare();
    if (tab.id === 'nav-growth' && typeof renderGrowth === 'function') { renderGrowth(); renderMilestones(); }
}

document.addEventListener('DOMContentLoaded', () => {
    TABS.forEach(tab => {
        document.getElementById(tab.id)?.addEventListener('click', () => {
            visFane(tab.id);
            window.scrollTo(0, 0);
        });
    });

    // Vis den fane man var på sidst — ikke altid Lyde
    const gemt = huskedeFaner();
    visFane(gemt.main || 'nav-player', false);
    gendanFaner();

    renderSounds();
    opdaterUrKnap();
    loadContentFromCloud();
    setInterval(renderPlanCard, 60000);
});
