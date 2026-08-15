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
    const s = keyToDate(key).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function weekdayShort(key) { return keyToDate(key).toLocaleDateString(locale(), { weekday: 'short' }).replace('.', ''); }
function shortDate(key) { return keyToDate(key).toLocaleDateString(locale(), { day: 'numeric', month: 'numeric' }); }
function clockFromMs(ms) { return new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }); }

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
    const en = (typeof SPROG !== 'undefined' && SPROG === 'en');
    if (t > 0 && m > 0) return en ? `${t} h ${m} min` : `${t} t ${m} min`;
    if (t > 0) return en ? `${t} hour${t > 1 ? 's' : ''}` : `${t} time${t > 1 ? 'r' : ''}`;
    return `${m} min`;
}
function formatTimeText(secs) {
    if (!secs || secs <= 0) return `0:00 min`;
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    const en = (typeof SPROG !== 'undefined' && SPROG === 'en');
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${en ? 'h' : 't'}`;
    return `${m}:${String(s).padStart(2, '0')} min`;
}
function formatShort(secs) {
    const h = Math.floor(secs / 3600), m = Math.round((secs % 3600) / 60);
    const en = (typeof SPROG !== 'undefined' && SPROG === 'en');
    return h > 0 ? `${h}${en ? 'h' : 't'} ${m}m` : `${m}m`;
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
// Artiklerne under Viden findes både på dansk (dine egne fra admin)
// og engelsk (den indbyggede oversættelse)
function indhold(key) {
    if (typeof SPROG !== 'undefined' && SPROG === 'en' &&
        typeof INDHOLD_EN !== 'undefined' && INDHOLD_EN[key] !== undefined) {
        return INDHOLD_EN[key];
    }
    return TEXTS[key];
}

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
            <button class="play-btn" data-category="${c.id}">${T('play')}</button>
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

    fill('txt-smart-title', 'smartTitle');
    fill('txt-smart-desc', 'smartDesc');
    const hs = document.getElementById('txt-history-sub'); if (hs) hs.textContent = T('historySub');
    const gw = document.getElementById('guest-warning'); if (gw) gw.innerHTML = T('guestWarning');

    const sleepTitleEl = document.getElementById('txt-sleep-title');
    if (sleepTitleEl) sleepTitleEl.textContent = String(indhold('sleepTitle') || '').replaceAll('{navn}', babyName);
    const sleepSubEl = document.getElementById('txt-sleep-sub');
    if (sleepSubEl) sleepSubEl.textContent = String(indhold('sleepSub') || '').replaceAll('{navn}', babyName);

    const sleepEl = document.getElementById('sleep-cards');
    if (sleepEl) sleepEl.innerHTML = (indhold('sleepCards') || []).map(c =>
        `<div class="info-card"><h3>${(c.title || '').replaceAll('{navn}', babyName)}</h3>${(c.body || '').replaceAll('{navn}', babyName)}</div>`).join('');

    ['txt-leap-title:leapTitle', 'txt-leap-sub:leapSub', 'txt-leap-status-title:leapStatusTitle',
     'txt-leap-intro-title:leapIntroTitle', 'txt-leap-intro-body:leapIntroBody',
     'txt-leap-outro-title:leapOutroTitle', 'txt-leap-outro-body:leapOutroBody'].forEach(par => {
        const [id, key] = par.split(':');
        const el = document.getElementById(id);
        if (el) el.innerHTML = String(indhold(key) || '').replaceAll('{navn}', babyName);
    });

    const leapEl = document.getElementById('leap-cards');
    if (leapEl) leapEl.innerHTML = (indhold('leapCards') || []).map(c =>
        `<div class="info-card leap-card" id="leap-${c.nr}">
            <h3><span class="leap-badge">${T('leapWord')} ${c.nr}</span> ${T('weekWord')} ${c.from}-${c.to}: ${(c.title || '').replaceAll('{navn}', babyName)}</h3>
            ${(c.body || '').replaceAll('{navn}', babyName)}
        </div>`).join('');

    renderLeapStatus();
}

// ==========================================
// SØVNUR — start / pause / fortsæt
//
// VIGTIGT: Uret tæller IKKE sekunder ét ad gangen.
// Det regner altid ud fra rigtige klokkeslæt. Derfor
// bliver det ved med at køre, selv om siden opdateres,
// telefonen låses, eller browseren sætter fanen på pause.
// ==========================================
const UR_NOEGLE = 'babyRoUr';

let urStart = null;        // hvornår den nuværende kørsel begyndte (ms)
let urOpsparet = 0;        // sekunder fra tidligere kørsler
let sessionStartTime = null;
let urKoerer = false;
let visInterval = null;

const timeDisplay = document.getElementById('time-elapsed');
const btnPauseTime = document.getElementById('btn-pause-time');

function forloebetSek() {
    return Math.floor(urOpsparet + (urKoerer && urStart ? (Date.now() - urStart) / 1000 : 0));
}

function gemUr() {
    if (!urKoerer && urOpsparet === 0 && !sessionStartTime) {
        localStorage.removeItem(UR_NOEGLE);
        return;
    }
    localStorage.setItem(UR_NOEGLE, JSON.stringify({
        urStart, urOpsparet, urKoerer,
        sessionStart: sessionStartTime ? sessionStartTime.getTime() : null,
        barn: childId
    }));
}

function gendanUr() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(UR_NOEGLE)); } catch (e) {}
    if (!d) { opdaterUrKnap(); return; }

    urOpsparet = d.urOpsparet || 0;
    urKoerer = !!d.urKoerer;
    urStart = d.urStart || null;
    sessionStartTime = d.sessionStart ? new Date(d.sessionStart) : null;

    // Er uret løbet i mere end et døgn, er det glemt at blive stoppet
    if (forloebetSek() > 86400) { nulstilUr(); return; }

    updateDisplay();
    opdaterUrKnap();
    if (urKoerer) startVisning();
}

function startVisning() {
    clearInterval(visInterval);
    visInterval = setInterval(() => {
        updateDisplay();
        if (typeof renderPlanCard === 'function') renderPlanCard();
    }, 1000);
}

function updateDisplay() {
    if (!timeDisplay) return;
    const sek = forloebetSek();
    const h = String(Math.floor(sek / 3600)).padStart(2, '0');
    const m = String(Math.floor((sek % 3600) / 60)).padStart(2, '0');
    const s = String(sek % 60).padStart(2, '0');
    timeDisplay.textContent = `${h}:${m}:${s}`;
}

function opdaterUrKnap() {
    if (!btnPauseTime) return;
    if (urKoerer) { btnPauseTime.textContent = T('btnPause'); btnPauseTime.classList.remove('running'); }
    else { btnPauseTime.textContent = forloebetSek() > 0 ? T('btnResume') : T('btnStart'); btnPauseTime.classList.add('running'); }
    document.body.classList.toggle('ur-koerer', urKoerer);
}

function startStopwatch() {
    if (urKoerer) return;
    const nu = Date.now();
    if (sessionStartTime === null) sessionStartTime = new Date(nu);
    else if (urOpsparet > 0) {
        // Efter en pause: ryk starttidspunktet frem, så de viste
        // klokkeslæt altid passer med den viste varighed
        sessionStartTime = new Date(nu - urOpsparet * 1000);
    }
    urStart = nu;
    urKoerer = true;
    startVisning();
    updateDisplay();
    opdaterUrKnap();
    gemUr();
    if (typeof renderPlanCard === 'function') renderPlanCard();
}

function stopStopwatch() {
    if (urKoerer && urStart) urOpsparet += (Date.now() - urStart) / 1000;
    urKoerer = false;
    urStart = null;
    clearInterval(visInterval);
    updateDisplay();
    opdaterUrKnap();
    gemUr();
    if (typeof renderPlanCard === 'function') renderPlanCard();
}

function nulstilUr() {
    clearInterval(visInterval);
    urKoerer = false; urStart = null; urOpsparet = 0; sessionStartTime = null;
    localStorage.removeItem(UR_NOEGLE);
    updateDisplay();
    opdaterUrKnap();
    if (typeof renderPlanCard === 'function') renderPlanCard();
}
const resetStopwatch = nulstilUr;

if (btnPauseTime) btnPauseTime.addEventListener('click', () => { urKoerer ? stopStopwatch() : startStopwatch(); });
document.getElementById('btn-reset-time')?.addEventListener('click', () => {
    if (forloebetSek() === 0) return;
    if (confirm(T('resetConfirm'))) nulstilUr();
});

// Når siden kommer frem igen, indhentes den tid der er gået
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        updateDisplay();
        opdaterUrKnap();
        if (urKoerer) startVisning();
    }
});
window.addEventListener('pageshow', () => { updateDisplay(); opdaterUrKnap(); });

// ==========================================
// LYDAFSPILLER
// ==========================================
const audioPlayer = document.getElementById('global-audio-player');
const soundGrid = document.getElementById('sound-grid');
const timerSelect = document.getElementById('timer-select');
let currentlyPlayingId = null, timeoutId = null, fadeInterval = null;

function resetAllButtons() {
    document.querySelectorAll('.play-btn[data-category]').forEach(b => { b.textContent = T('play'); b.classList.remove('playing'); });
}
// Stopper KUN lyden. Søvnuret kører ubemærket videre —
// man slukker tit lyden, længe før barnet vågner.
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
        btn.textContent = T('pauseSound'); btn.classList.add('playing');
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

// Pæne knapper i stedet for en rullemenu
document.querySelectorAll('.as-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.as-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (timerSelect) timerSelect.value = btn.dataset.min;
        localStorage.setItem('babyRoAutoStop', btn.dataset.min);
        if (currentlyPlayingId) setupTimer();
    });
});
(function gendanAutoStop() {
    const gemt = localStorage.getItem('babyRoAutoStop');
    if (!gemt) return;
    const knap = document.querySelector(`.as-btn[data-min="${gemt}"]`);
    if (!knap) return;
    document.querySelectorAll('.as-btn').forEach(b => b.classList.remove('active'));
    knap.classList.add('active');
    if (timerSelect) timerSelect.value = gemt;
})();

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
    catch (e) { setSmartStatus(T('smartNoMic')); return; }
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = audioCtx.createMediaStreamSource(micStream);
    analyser = audioCtx.createAnalyser(); analyser.fftSize = 1024;
    src.connect(analyser);
    micBuffer = new Uint8Array(analyser.fftSize);
    listening = true; loudFrames = 0;
    smartBox?.classList.add('listening');
    if (btnSmartListen) btnSmartListen.textContent = T('smartStop');
    setSmartStatus(T('smartQuiet'));
    listenTimerId = setInterval(listenTick, 100);
}
function stopListening() {
    listening = false;
    if (listenTimerId) { clearInterval(listenTimerId); listenTimerId = null; }
    if (micStream) { micStream.getTracks().forEach(tr => tr.stop()); micStream = null; }
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
    smartBox?.classList.remove('listening');
    if (btnSmartListen) btnSmartListen.textContent = T('smartStart');
    if (micLevel) micLevel.style.width = "0%";
    setSmartStatus(T('smartOff'));
}
function listenTick() {
    if (!listening || !analyser) return;
    if (audioPlayer && !audioPlayer.paused) {
        loudFrames = 0;
        if (micLevel) micLevel.style.width = "0%";
        setSmartStatus(T('smartPlaying'));
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
    else if (loudFrames > 5) setSmartStatus(T('smartHears'));
    else setSmartStatus(T('smartQuiet'));
}
function triggerSoothingSound() {
    const cat = smartSoundSelect ? smartSoundSelect.value : (SOUNDS[0] && SOUNDS[0].id);
    const btn = document.querySelector(`.play-btn[data-category="${cat}"]`);
    setSmartStatus(T('smartTriggered'));
    if (btn && currentlyPlayingId === null) btn.click();
}
if (btnSmartListen) btnSmartListen.addEventListener('click', () => { listening ? stopListening() : startListening(); });

// ==========================================
// TEMA
// ==========================================
function opdaterTemaKnapper() {
    const dark = document.body.classList.contains('dark-theme');
    const stor = document.getElementById('btn-theme-toggle');
    const hjoerne = document.getElementById('btn-theme-corner');
    if (stor) stor.textContent = dark ? T('toDay') : T('toNight');
    if (hjoerne) {
        hjoerne.textContent = dark ? '☀️' : '🌙';
        hjoerne.title = dark ? 'Skift til dagstilstand' : 'Skift til nattilstand';
    }
}
function skiftTema() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('babyRoTheme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    opdaterTemaKnapper();
}
if (localStorage.getItem('babyRoTheme') === 'dark') document.body.classList.add('dark-theme');
document.getElementById('btn-theme-toggle')?.addEventListener('click', skiftTema);
document.getElementById('btn-theme-corner')?.addEventListener('click', skiftTema);
opdaterTemaKnapper();
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
    const elapsedSeconds = forloebetSek();
    if (elapsedSeconds === 0) { alert(T('timerZero')); return; }
    const end = new Date();
    // Starttidspunktet regnes altid ud fra den faktiske varighed,
    // så de viste klokkeslæt og minuttallet ikke kan komme ud af trit
    const start = new Date(end.getTime() - elapsedSeconds * 1000);
    const key = todayKey();
    if (!localSleepLogs[key]) localSleepLogs[key] = { sessions: [], total: 0 };
    localSleepLogs[key].sessions.push({
        timeDisplay: `${T('atClock')} ${clockFromMs(start.getTime())} - ${clockFromMs(end.getTime())}`,
        durationText: formatTimeText(elapsedSeconds),
        durationSec: elapsedSeconds,
        startMs: start.getTime(),
        endMs: end.getTime()
    });
    localSleepLogs[key].total += elapsedSeconds;

    await gemSoevnMaaned(monthKey(key));
    stopAllSound(); nulstilUr();
    renderTodayLog(); renderPlanCard();
    if (typeof renderLogPage === 'function') renderLogPage();
    if (typeof planlaegNaesteSoevn === 'function') planlaegNaesteSoevn();
    visFane('nav-history');
    vaelgUnderfane('history', 'sub-overview');
});

window.deleteLogEntry = async function (key, index, alleredeBekraeftet) {
    if (!alleredeBekraeftet && !confirm(`${T('deleteNap')}?`)) return;
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
        listEl.innerHTML = `<li>${T('todayNone')}</li>`;
        totalEl.textContent = "0:00 min";
        return;
    }
    data.sessions.forEach((s, i) => {
        listEl.innerHTML += `<li><span>${esc(s.timeDisplay)}</span>
            <div style="display:flex;align-items:center;gap:8px;">
                <span>${esc(s.durationText)}</span>
                <button class="mini-btn" onclick="aabnSoevnRet('${key}', ${i})" title="${T('editSleep')}">✏️</button>
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
    const clockEl = document.getElementById('plan-clock');
    if (clockEl) clockEl.textContent = '';

    if (!babyBirthDate) {
        phaseEl.textContent = "";
        labelEl.textContent = T('planNext'); timeEl.textContent = '–';
        subEl.innerHTML = T('planNoBirth');
        noteEl.textContent = ""; return;
    }
    phaseEl.textContent = alderTekst();

    // Kører uret, sover barnet lige nu — så er vågetiden irrelevant
    if (urKoerer || forloebetSek() > 0) {
        card.classList.remove('plan-now');
        card.classList.add('plan-sleeping');
        labelEl.textContent = urKoerer ? T('sleepingNow') : T('napPaused');
        timeEl.textContent = formatTimeText(forloebetSek());
        const slutTidligst = Date.now() + Math.max(0, (fase.vaageMin * 0) );
        subEl.innerHTML = sessionStartTime
            ? T('sleepingSince', { tid: clockFromMs(sessionStartTime.getTime()) })
            : T('napRunning');
        noteEl.textContent = urKoerer ? T('sleepingNote') : T('napPausedNote');
        return;
    }
    card.classList.remove('plan-sleeping');

    const naeste = naesteSoevnTid();
    if (!naeste) {
        labelEl.textContent = T('planNext'); timeEl.textContent = '–';
        subEl.innerHTML = `${T('wakeWindowIs')} <strong>${minTekst(fase.vaageMin)}–${minTekst(fase.vaageMax)}</strong>. ${T('planNoData')}`;
        noteEl.textContent = `${T('typically')} ${fase.lure} ${T('napsPerDayAge')}`;
        return;
    }

    const nu = Date.now();
    const vaagen = Math.round((nu - naeste.vaagenSiden) / 60000);
    card.classList.remove('plan-now');

    if (nu < naeste.tidligst) {
        labelEl.textContent = T('planOpensIn');
        timeEl.textContent = minTekst((naeste.tidligst - nu) / 60000);
        if (clockEl) clockEl.textContent = `${T('atClockWord')} ${clockFromMs(naeste.tidligst)}`;
        subEl.innerHTML = `${esc(babyName)} ${T('awakeFor')} <strong>${minTekst(vaagen)}</strong>.`;
        noteEl.textContent = `${T('windowOpenFrom')} ${clockFromMs(naeste.tidligst)} ${T('windowTo')} ${clockFromMs(naeste.senest)}. ${T('windowHit')}`;
    } else if (nu <= naeste.senest) {
        card.classList.add('plan-now');
        labelEl.textContent = T('planOpenNow');
        timeEl.textContent = minTekst((naeste.senest - nu) / 60000);
        if (clockEl) clockEl.textContent = `${T('planCloseBy')} ${clockFromMs(naeste.senest)}`;
        subEl.innerHTML = `${esc(babyName)} ${T('awakeFor')} <strong>${minTekst(vaagen)}</strong> ${T('timeToSettle')}`;
        noteEl.textContent = T('planNoteWindow');
    } else {
        labelEl.textContent = T('planClosed');
        timeEl.textContent = `${minTekst((nu - naeste.senest) / 60000)} ${T('planOver')}`;
        subEl.innerHTML = `${esc(babyName)} ${T('awakeFor')} <strong>${minTekst(vaagen)}</strong>, ${T('maxIs')} ${minTekst(fase.vaageMax)} ${T('isTypicalMax')}`;
        noteEl.textContent = T('planNoteLate');
    }
}

// ==========================================
// TIGERSPRING
// ==========================================
function renderLeapStatus() {
    const el = document.getElementById('leap-status-text');
    if (!el) return;
    document.querySelectorAll('.leap-card').forEach(c => c.classList.remove('active-leap'));
    const leaps = (indhold('leapCards') || []).slice().sort((a, b) => a.from - b.from);
    if (!babyDueDate) {
        el.innerHTML = T('leapNoDue');
        return;
    }
    const weeks = Math.floor((Date.now() - new Date(babyDueDate + "T00:00:00").getTime()) / (7 * 86400000));
    if (weeks < 0) {
        el.innerHTML = T('leapBeforeDue', { uger: Math.abs(weeks), foerste: leaps[0]?.from || 4 });
        return;
    }
    const cur = leaps.find(l => weeks >= l.from && weeks <= l.to);
    const next = leaps.find(l => l.from > weeks);
    let msg = T('leapAge', { uger: weeks }) + ' ';
    if (cur) {
        msg += T('leapInNow', { nr: cur.nr, fra: cur.from, til: cur.to });
        document.getElementById(`leap-${cur.nr}`)?.classList.add('active-leap');
    } else if (next) {
        msg += T('leapNext', { nr: next.nr, uger: next.from - weeks });
        document.getElementById(`leap-${next.nr}`)?.classList.add('active-leap');
    } else msg += T('leapDone');
    el.innerHTML = msg;
}

// ==========================================
// DATA-EKSPORT
// ==========================================
// ==========================================
// FANER
// ==========================================
const TABS = [
    { id: 'nav-player', viewId: 'view-player' },
    { id: 'nav-care', viewId: 'view-care' },
    { id: 'nav-history', viewId: 'view-history' },
    { id: 'nav-growth', viewId: 'view-growth' },
    { id: 'nav-milestones', viewId: 'view-milestones' },
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
    if (typeof renderPlanForklaring === 'function') renderPlanForklaring();
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
    if (tab.id === 'nav-growth' && typeof renderGrowth === 'function') renderGrowth();
    if (tab.id === 'nav-milestones' && typeof renderMilestones === 'function') renderMilestones();
    if (tab.id === 'nav-know' && typeof renderPlanForklaring === 'function') renderPlanForklaring();
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
    gendanUr();
    loadContentFromCloud();
    setInterval(renderPlanCard, 60000);
});
