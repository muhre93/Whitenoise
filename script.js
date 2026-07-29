// ==================================================
// BabyRo v2 — script.js
// ==================================================

// ==========================================
// 1. GLOBALE VARIABLER & LOKAL PROFIL
// ==========================================
let currentUserId = null;
let isGuest = true;
let babyName = localStorage.getItem('babyRoName') || "Baby";
let babyGender = localStorage.getItem('babyRoGender') || "neutral"; // 'dreng' | 'pige' | 'neutral'
let babyDueDate = localStorage.getItem('babyRoDueDate') || "";      // "YYYY-MM-DD"
let localSleepLogs = loadLocalLogs();

// ---------- Dato-hjælpere ----------
// Loggen gemmes med ISO-nøgler (YYYY-MM-DD), så den altid kan sorteres korrekt.
function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function dateKeyOffset(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function formatDateDK(isoKey) {
    const [y, m, d] = isoKey.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const str = dt.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function weekdayShort(isoKey) {
    const [y, m, d] = isoKey.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('da-DK', { weekday: 'short' }).replace('.', '');
}

// Indlæser loggen og konverterer gamle danske dato-nøgler ("29.7.2026") til ISO
function loadLocalLogs() {
    let logs = {};
    try { logs = JSON.parse(localStorage.getItem('babyRoLogs')) || {}; } catch (e) { logs = {}; }
    const out = {};
    Object.keys(logs).forEach(key => {
        let newKey = key;
        if (key.includes('.')) {
            const parts = key.split('.');
            if (parts.length === 3) {
                newKey = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
            }
        }
        if (!out[newKey]) {
            out[newKey] = logs[key];
        } else {
            out[newKey].sessions = (out[newKey].sessions || []).concat(logs[key].sessions || []);
            out[newKey].total = (out[newKey].total || 0) + (logs[key].total || 0);
        }
    });
    return out;
}

function saveLogsLocally() {
    localStorage.setItem('babyRoLogs', JSON.stringify(localSleepLogs));
}

// ==========================================
// 2. FIREBASE OPSÆTNING
// ==========================================
// VIGTIGT: Indsæt din egen config herunder. ALLE værdier skal stå i "anførselstegn"!
// (En manglende " her får HELE appen til at gå i stå.)
const firebaseConfig = {
  apiKey: "AIzaSyAiev2iHG8I31LSe-oBL7yjQMiDtVYEQHM",
  authDomain: "babyro-b320c.firebaseapp.com",
  projectId: "babyro-b320c",
  storageBucket: "babyro-b320c.firebasestorage.app",
  messagingSenderId: "260945437474",
  appId: "1:260945437474:web:f670ae0502e1843125fb7b",
  measurementId: "G-9HT4SHH5BR"
  };

let auth = null;
let db = null;

if (typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
    } catch (e) {
        console.log("Firebase kunne ikke starte. Appen kører videre i offline-tilstand.", e);
    }
}

// ==========================================
// 3. PROFIL: NAVN, KØN, TERMIN & TEMA
// ==========================================
function updateBabyNameInUI() {
    document.querySelectorAll('.b-name').forEach(span => span.textContent = babyName);
}

function applyGenderTheme() {
    document.body.classList.remove('theme-dreng', 'theme-pige');
    if (babyGender === 'dreng') document.body.classList.add('theme-dreng');
    if (babyGender === 'pige') document.body.classList.add('theme-pige');
    // Marker de rigtige knapper som valgt (både i overlay og på profil-siden)
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.getAttribute('data-gender') === babyGender);
    });
}

// Gemmer ALTID lokalt — og i skyen, hvis man er logget ind
async function persistProfile() {
    localStorage.setItem('babyRoName', babyName);
    localStorage.setItem('babyRoGender', babyGender);
    localStorage.setItem('babyRoDueDate', babyDueDate);

    if (!isGuest && currentUserId && db) {
        try {
            await db.collection("users").doc(currentUserId).set({
                babyName: babyName,
                babyGender: babyGender,
                babyDueDate: babyDueDate
            }, { merge: true });
        } catch (e) {
            console.log("Kunne ikke gemme profil i skyen:", e);
        }
    }

    updateBabyNameInUI();
    applyGenderTheme();
    renderLeapStatus();
}

// ==========================================
// 4. SØVNUR LOGIK
// ==========================================
let elapsedSeconds = 0;
let intervalId = null;
let sessionStartTime = null;
let isUrPaused = false;

const timeDisplay = document.getElementById('time-elapsed');
const btnPauseTime = document.getElementById('btn-pause-time');

function startStopwatch() {
    if (sessionStartTime === null) sessionStartTime = new Date();
    clearInterval(intervalId);
    intervalId = setInterval(() => { elapsedSeconds++; updateDisplay(); }, 1000);
}
function stopStopwatch() { clearInterval(intervalId); }
function resetStopwatch() {
    stopStopwatch(); elapsedSeconds = 0; sessionStartTime = null;
    isUrPaused = false;
    if (btnPauseTime) {
        btnPauseTime.textContent = 'Pause ur';
        btnPauseTime.style.background = ''; btnPauseTime.style.color = '';
    }
    updateDisplay();
}
function updateDisplay() {
    if (!timeDisplay) return;
    const h = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(elapsedSeconds % 60).padStart(2, '0');
    timeDisplay.textContent = `${h}:${m}:${s}`;
}

if (btnPauseTime) {
    btnPauseTime.addEventListener('click', () => {
        if (elapsedSeconds === 0 && sessionStartTime === null) return;
        if (!isUrPaused) {
            stopStopwatch(); isUrPaused = true;
            btnPauseTime.textContent = 'Start ur'; btnPauseTime.style.background = 'var(--accent-green)'; btnPauseTime.style.color = 'white';
        } else {
            startStopwatch(); isUrPaused = false;
            btnPauseTime.textContent = 'Pause ur'; btnPauseTime.style.background = ''; btnPauseTime.style.color = '';
        }
    });
}

// ==========================================
// 5. LYDAFSPILLER & BLØD FADE OUT
// ==========================================
const audioPlayer = document.getElementById('global-audio-player');
const playButtons = document.querySelectorAll('.play-btn[data-category]');
const stopButton = document.getElementById('stop-all');
const timerSelect = document.getElementById('timer-select');
let currentlyPlayingBtn = null;
let timeoutId = null;
let fadeInterval = null;

function resetAllButtons() { playButtons.forEach(btn => { btn.textContent = 'Afspil'; btn.classList.remove('playing'); }); }

function stopAllSound() {
    clearTimer();
    if (audioPlayer) audioPlayer.pause();
    resetAllButtons();
    currentlyPlayingBtn = null;
}

playButtons.forEach(button => {
    button.addEventListener('click', function () {
        const category = this.getAttribute('data-category');
        const selectBox = document.getElementById(`variant-${category}`);
        if (!selectBox || !audioPlayer) return;

        if (currentlyPlayingBtn === this) {
            stopAllSound();
            return;
        }

        clearTimer();
        resetAllButtons();
        audioPlayer.src = selectBox.value;
        this.textContent = 'Pause lyd'; this.classList.add('playing'); currentlyPlayingBtn = this;

        if (isUrPaused && btnPauseTime) {
            isUrPaused = false; btnPauseTime.textContent = 'Pause ur'; btnPauseTime.style.background = ''; btnPauseTime.style.color = '';
        }

        startStopwatch(); setupTimer();
        audioPlayer.play().catch(e => console.log("Lyden kunne ikke afspilles (mangler filen?):", selectBox.value));
    });
});

if (stopButton) stopButton.addEventListener('click', stopAllSound);

function setupTimer() {
    clearTimer();
    if (!timerSelect) return;
    const minutes = parseInt(timerSelect.value);
    if (minutes > 0) {
        const totalMs = minutes * 60 * 1000;
        const fadeDurationMs = (minutes <= 2) ? 30000 : 300000; // 30 sek. i test, ellers 5 min.
        timeoutId = setTimeout(() => {
            fadeOutAudio(fadeDurationMs);
        }, Math.max(0, totalMs - fadeDurationMs));
    }
}

function fadeOutAudio(durationMs) {
    if (!audioPlayer) return;
    let volume = 1.0;
    const steps = 100;
    const stepTimeMs = durationMs / steps;
    const volumeDrop = 1.0 / steps;

    fadeInterval = setInterval(() => {
        volume -= volumeDrop;
        if (volume <= 0.05) {
            stopAllSound();
        } else {
            audioPlayer.volume = volume;
        }
    }, stepTimeMs);
}

function clearTimer() {
    if (timeoutId !== null) { clearTimeout(timeoutId); timeoutId = null; }
    if (fadeInterval !== null) { clearInterval(fadeInterval); fadeInterval = null; }
    if (audioPlayer) audioPlayer.volume = 1.0;
}
if (timerSelect) timerSelect.addEventListener('change', () => { if (currentlyPlayingBtn !== null) setupTimer(); });

// ==========================================
// 6. SMART-LYT (BABY MONITOR)
// ==========================================
const btnSmartListen = document.getElementById('btn-smart-listen');
const smartStatus = document.getElementById('smart-status');
const smartBox = document.querySelector('.smart-listen-box');
const smartSensitivity = document.getElementById('smart-sensitivity');
const smartSoundSelect = document.getElementById('smart-sound-select');
const micLevel = document.getElementById('mic-level');

let micStream = null;
let audioCtx = null;
let analyser = null;
let micBuffer = null;
let listening = false;
let loudFrames = 0;
let listenRAF = null;
let wakeLock = null;

function setSmartStatus(text) { if (smartStatus) smartStatus.textContent = text; }

async function startListening() {
    try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
        setSmartStatus("Kunne ikke få adgang til mikrofonen. Tjek tilladelser i browseren.");
        return;
    }
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(micStream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    micBuffer = new Uint8Array(analyser.fftSize);

    listening = true;
    loudFrames = 0;
    if (smartBox) smartBox.classList.add('listening');
    if (btnSmartListen) btnSmartListen.textContent = "Stop Smart-lyt";
    setSmartStatus("Lytter... alt er roligt. 💤");

    // Prøver at holde skærmen tændt, mens der lyttes
    try {
        if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    } catch (e) { /* ikke kritisk */ }

    listenLoop();
}

function stopListening() {
    listening = false;
    if (listenRAF) cancelAnimationFrame(listenRAF);
    if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
    if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
    if (smartBox) smartBox.classList.remove('listening');
    if (btnSmartListen) btnSmartListen.textContent = "Start Smart-lyt";
    if (micLevel) micLevel.style.width = "0%";
    setSmartStatus("Smart-lyt er slukket.");
}

function listenLoop() {
    if (!listening) return;

    // Hold pause i lyttet, mens der afspilles lyd (ellers hører den sig selv)
    if (audioPlayer && !audioPlayer.paused) {
        loudFrames = 0;
        if (micLevel) micLevel.style.width = "0%";
        setSmartStatus("Beroligende lyd kører 🎵 — lytter igen, når den stopper.");
    } else {
        analyser.getByteTimeDomainData(micBuffer);
        let sum = 0;
        for (let i = 0; i < micBuffer.length; i++) {
            const v = (micBuffer[i] - 128) / 128;
            sum += v * v;
        }
        const rms = Math.sqrt(sum / micBuffer.length);

        // Følsomhed 1-10: høj følsomhed = lav tærskel
        const sens = smartSensitivity ? parseInt(smartSensitivity.value) : 6;
        const threshold = 0.28 - (sens * 0.024); // sens 10 => 0.04, sens 1 => 0.256

        if (micLevel) micLevel.style.width = Math.min(100, Math.round(rms * 300)) + "%";

        if (rms > threshold) {
            loudFrames++;
        } else {
            loudFrames = Math.max(0, loudFrames - 2);
        }

        // Ca. 1,5-2 sekunders vedvarende lyd før der reageres (undgår falsk alarm ved et enkelt host)
        if (loudFrames > 90) {
            loudFrames = 0;
            triggerSoothingSound();
        } else if (loudFrames > 30) {
            setSmartStatus("Hører uro... 👂");
        } else {
            setSmartStatus("Lytter... alt er roligt. 💤");
        }
    }

    listenRAF = requestAnimationFrame(listenLoop);
}

function triggerSoothingSound() {
    const category = smartSoundSelect ? smartSoundSelect.value : 'noise';
    const btn = document.querySelector(`.play-btn[data-category="${category}"]`);
    setSmartStatus(`Uro registreret! Starter beroligende lyd... 🎵`);
    if (btn && currentlyPlayingBtn === null) btn.click();
}

if (btnSmartListen) {
    btnSmartListen.addEventListener('click', () => {
        if (listening) stopListening(); else startListening();
    });
}

// ==========================================
// 7. TEMA (NATTILSTAND)
// ==========================================
const btnThemeToggle = document.getElementById('btn-theme-toggle');
if (btnThemeToggle) {
    if (localStorage.getItem('babyRoTheme') === 'dark') {
        document.body.classList.add('dark-theme');
        btnThemeToggle.textContent = 'Skift til Dagstilstand ☀️';
    }
    btnThemeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('babyRoTheme', 'dark');
            btnThemeToggle.textContent = 'Skift til Dagstilstand ☀️';
        } else {
            localStorage.setItem('babyRoTheme', 'light');
            btnThemeToggle.textContent = 'Skift til Nattilstand 🌙';
        }
    });
}

// ==========================================
// 8. LOG: GEM, SLET & VIS
// ==========================================
function formatTimeText(totalSecs) {
    if (!totalSecs || totalSecs <= 0) return `0:00 min`;
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const secString = String(s).padStart(2, '0');
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${secString} t`;
    return `${m}:${secString} min`;
}
function formatShort(totalSecs) {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.round((totalSecs % 3600) / 60);
    if (h > 0) return `${h}t ${m}m`;
    return `${m}m`;
}

async function saveLogsToFirebase() {
    if (currentUserId && !isGuest && db) {
        try {
            await db.collection("users").doc(currentUserId).set({ sleepLogs: localSleepLogs }, { merge: true });
        } catch (e) {
            console.log("Kunne ikke gemme log i skyen:", e);
        }
    }
}

// Fletter lokal log og sky-log uden at miste eller duplikere lure
function mergeLogs(cloudLogs, localLogs) {
    const merged = {};
    const allDates = new Set([...Object.keys(cloudLogs || {}), ...Object.keys(localLogs || {})]);
    allDates.forEach(date => {
        const cloudSessions = (cloudLogs && cloudLogs[date] && cloudLogs[date].sessions) || [];
        const localSessions = (localLogs && localLogs[date] && localLogs[date].sessions) || [];
        const seen = new Set();
        const sessions = [];
        [...cloudSessions, ...localSessions].forEach(s => {
            const key = `${s.timeDisplay}|${s.durationSec}`;
            if (!seen.has(key)) { seen.add(key); sessions.push(s); }
        });
        const total = sessions.reduce((sum, s) => sum + (s.durationSec || 0), 0);
        if (sessions.length > 0) merged[date] = { sessions, total };
    });
    return merged;
}

const btnSaveLog = document.getElementById('btn-save-log');
if (btnSaveLog) {
    btnSaveLog.addEventListener('click', () => {
        if (elapsedSeconds === 0) {
            alert("Søvnuret er på nul. Start uret først (tryk Afspil på en lyd, eller Start ur).");
            return;
        }

        const endTime = new Date();
        const startTime = sessionStartTime || new Date(endTime.getTime() - (elapsedSeconds * 1000));
        const dateKey = todayKey();
        const startStreng = startTime.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
        const slutStreng = endTime.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });

        if (!localSleepLogs[dateKey]) { localSleepLogs[dateKey] = { sessions: [], total: 0 }; }

        localSleepLogs[dateKey].sessions.push({
            timeDisplay: `Kl. ${startStreng} - ${slutStreng}`,
            durationText: formatTimeText(elapsedSeconds),
            durationSec: elapsedSeconds
        });
        localSleepLogs[dateKey].total += elapsedSeconds;

        saveLogsLocally();
        saveLogsToFirebase();

        stopAllSound();
        resetStopwatch();

        renderTodayLog();
        renderHistory();
        document.getElementById('nav-history')?.click();
    });
}

window.deleteLogEntry = function (dateKey, index) {
    if (confirm(`Er du sikker på, du vil slette denne søvntid for ${babyName}?`)) {
        if (localSleepLogs[dateKey] && localSleepLogs[dateKey].sessions[index]) {
            const sessionSecs = localSleepLogs[dateKey].sessions[index].durationSec || 0;
            localSleepLogs[dateKey].total = Math.max(0, localSleepLogs[dateKey].total - sessionSecs);
            localSleepLogs[dateKey].sessions.splice(index, 1);
            if (localSleepLogs[dateKey].sessions.length === 0) delete localSleepLogs[dateKey];

            saveLogsLocally();
            saveLogsToFirebase();
            renderTodayLog();
            renderHistory();
        }
    }
};

function renderTodayLog() {
    const listEl = document.getElementById('today-log-list');
    const totalEl = document.getElementById('today-total-time');
    const dateText = document.getElementById('today-date-text');
    if (!listEl || !totalEl) return;

    const dateKey = todayKey();
    if (dateText) dateText.textContent = formatDateDK(dateKey);

    const todayData = localSleepLogs[dateKey];
    listEl.innerHTML = "";

    if (!todayData || todayData.sessions.length === 0) {
        listEl.innerHTML = `<li>Ingen lure gemt endnu i dag.</li>`;
        totalEl.textContent = "0:00 min";
        return;
    }

    todayData.sessions.forEach((session, index) => {
        listEl.innerHTML += `
            <li>
                <span>${session.timeDisplay}</span>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span>${session.durationText}</span>
                    <button class="delete-btn" onclick="deleteLogEntry('${dateKey}', ${index})">❌</button>
                </div>
            </li>
        `;
    });
    totalEl.textContent = formatTimeText(todayData.total);
}

function renderHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;

    container.innerHTML = "";
    renderStats();

    // Sorterer datoerne korrekt: nyeste øverst
    const dates = Object.keys(localSleepLogs).sort().reverse();
    if (dates.length === 0) {
        container.innerHTML = `<div class="empty-state">Brug afspilleren og tryk "Gem lur" for at starte loggen.</div>`;
        return;
    }

    dates.forEach(date => {
        const dayData = localSleepLogs[date];
        let listHtml = "";
        dayData.sessions.forEach((session, index) => {
            listHtml += `
                <li>
                    <span>${session.timeDisplay}</span>
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <strong>${session.durationText}</strong>
                        <button class="delete-btn" onclick="deleteLogEntry('${date}', ${index})">❌</button>
                    </div>
                </li>
            `;
        });

        container.innerHTML += `
            <div class="history-day-card">
                <h3>${formatDateDK(date)}</h3>
                <ul>${listHtml}</ul>
                <div class="day-total">Dagens total: ${formatTimeText(dayData.total)}</div>
            </div>
        `;
    });
}

// Søjlediagram over de sidste 7 dage
function renderStats() {
    const el = document.getElementById('stats-bars');
    if (!el) return;
    el.innerHTML = "";

    const days = [];
    let maxTotal = 0;
    for (let i = 6; i >= 0; i--) {
        const key = dateKeyOffset(i);
        const total = (localSleepLogs[key] && localSleepLogs[key].total) || 0;
        if (total > maxTotal) maxTotal = total;
        days.push({ key, total, isToday: i === 0 });
    }

    days.forEach(day => {
        const heightPct = maxTotal > 0 ? Math.max(3, Math.round((day.total / maxTotal) * 100)) : 3;
        el.innerHTML += `
            <div class="stats-col ${day.isToday ? 'today' : ''}">
                <span class="stats-value">${day.total > 0 ? formatShort(day.total) : ''}</span>
                <div class="stats-bar" style="height:${heightPct}%"></div>
                <span class="stats-day">${weekdayShort(day.key)}</span>
            </div>
        `;
    });
}

// ==========================================
// 9. TIGERSPRING-BEREGNER
// ==========================================
const LEAPS = [
    { nr: 1, start: 4, end: 5 },
    { nr: 2, start: 7, end: 9 },
    { nr: 3, start: 11, end: 12 },
    { nr: 4, start: 14, end: 19 },
    { nr: 5, start: 22, end: 26 },
    { nr: 6, start: 33, end: 37 },
    { nr: 7, start: 41, end: 46 },
    { nr: 8, start: 50, end: 55 },
    { nr: 9, start: 59, end: 64 },
    { nr: 10, start: 70, end: 76 }
];

function renderLeapStatus() {
    const textEl = document.getElementById('leap-status-text');
    if (!textEl) return;
    document.querySelectorAll('.leap-card').forEach(c => c.classList.remove('active-leap'));

    if (!babyDueDate) {
        textEl.innerHTML = `Indtast terminsdatoen under <strong>Profil</strong>, så viser BabyRo automatisk, hvilket spring <span class="b-name">${babyName}</span> er i – eller hvornår det næste kommer.`;
        return;
    }

    const due = new Date(babyDueDate + "T00:00:00");
    const weeks = Math.floor((Date.now() - due.getTime()) / (7 * 24 * 60 * 60 * 1000));

    if (weeks < 0) {
        textEl.textContent = `Der er ca. ${Math.abs(weeks)} uger til termin. Det første spring kommer omkring uge 4-5 efter termin. 💛`;
        return;
    }

    const current = LEAPS.find(l => weeks >= l.start && weeks <= l.end);
    const next = LEAPS.find(l => l.start > weeks);

    let msg = `${babyName} er ca. <strong>${weeks} uger</strong> (regnet fra termin). `;
    if (current) {
        msg += `Lige nu er I sandsynligvis midt i <strong>Spring ${current.nr}</strong> (uge ${current.start}-${current.end}) – se det fremhævede kort herunder. Hold ud, der er en solskinsperiode på vej! ⭐`;
        document.getElementById(`leap-${current.nr}`)?.classList.add('active-leap');
    } else if (next) {
        msg += `I er i en rolig periode. Næste spring er <strong>Spring ${next.nr}</strong>, som typisk begynder omkring uge ${next.start} – altså om ca. ${next.start - weeks} uge${next.start - weeks === 1 ? '' : 'r'}. ☀️`;
        document.getElementById(`leap-${next.nr}`)?.classList.add('active-leap');
    } else {
        msg += `Alle 10 tigerspring er overstået – godt klaret! 🎉 Udviklingen fortsætter naturligvis, men de store mentale spring er nu bag jer.`;
    }
    textEl.innerHTML = msg;
}

// ==========================================
// 10. PROFIL-UI (VIRKER OGSÅ SOM GÆST)
// ==========================================
const btnGoogleLogin = document.getElementById('btn-google-login');
const btnLogout = document.getElementById('btn-logout');
const guestSection = document.getElementById('profile-guest-section');
const loggedInSection = document.getElementById('profile-logged-in-section');
const btnUpdateName = document.getElementById('btn-update-name');
const profileNameInput = document.getElementById('profile-name-input');
const profileDueDateInput = document.getElementById('profile-duedate-input');
const guestWarning = document.getElementById('guest-warning');
const loggedInEmail = document.getElementById('logged-in-email');

const nameSetupOverlay = document.getElementById('name-setup-overlay');
const btnSaveName = document.getElementById('btn-save-name');
const babyNameInput = document.getElementById('baby-name-input');

// Kønsknapper (både i overlay og på profil-siden)
document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        babyGender = btn.getAttribute('data-gender');
        persistProfile();
    });
});

// Velkomst-overlay: Gem navn (virker BÅDE som gæst og logget ind)
if (btnSaveName) {
    btnSaveName.addEventListener('click', () => {
        const inputName = babyNameInput.value.trim();
        if (inputName.length > 0) {
            babyName = inputName;
            persistProfile();
            if (nameSetupOverlay) nameSetupOverlay.style.display = 'none';
            if (profileNameInput) profileNameInput.value = babyName;
        } else {
            babyNameInput.focus();
        }
    });
}

// Profil-siden: Gem oplysninger
if (btnUpdateName) {
    btnUpdateName.addEventListener('click', () => {
        const inputName = profileNameInput.value.trim();
        if (inputName.length > 0) babyName = inputName;
        if (profileDueDateInput && profileDueDateInput.value) babyDueDate = profileDueDateInput.value;
        persistProfile();
        alert("Oplysningerne er gemt! ✅");
    });
}

function refreshProfileInputs() {
    if (profileNameInput) profileNameInput.value = (babyName !== "Baby") ? babyName : "";
    if (profileDueDateInput) profileDueDateInput.value = babyDueDate || "";
}

// ==========================================
// 11. LOGIN / LOGOUT (FIREBASE)
// ==========================================
if (auth) {
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(err => alert("Login fejl: " + err.message));
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm("Er du sikker på, at du vil logge ud?")) auth.signOut();
        });
    }

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            isGuest = false;
            currentUserId = user.uid;

            if (guestSection) guestSection.style.display = 'none';
            if (loggedInSection) loggedInSection.style.display = 'block';
            if (guestWarning) guestWarning.style.display = 'none';
            if (loggedInEmail) loggedInEmail.textContent = user.email || "";

            try {
                const userDoc = await db.collection("users").doc(currentUserId).get();
                const data = userDoc.exists ? userDoc.data() : {};

                // Profil: Skyen vinder, hvis den har noget – ellers skubbes det lokale op
                if (data.babyName) babyName = data.babyName;
                if (data.babyGender) babyGender = data.babyGender;
                if (data.babyDueDate) babyDueDate = data.babyDueDate;

                // Log: Flet sky + lokal, så INTET går tabt ved login
                localSleepLogs = mergeLogs(data.sleepLogs || {}, localSleepLogs);
                saveLogsLocally();
                await persistProfile();
                await saveLogsToFirebase();

                if (!data.babyName && babyName === "Baby") {
                    if (nameSetupOverlay) nameSetupOverlay.style.display = 'flex';
                }
            } catch (e) {
                console.log("Kunne ikke hente data fra skyen:", e);
            }
        } else {
            isGuest = true;
            currentUserId = null;

            if (guestSection) guestSection.style.display = 'block';
            if (loggedInSection) loggedInSection.style.display = 'none';
            if (guestWarning) guestWarning.style.display = 'block';

            // Behold de lokale oplysninger — de forsvinder IKKE, fordi man logger ud
            babyName = localStorage.getItem('babyRoName') || "Baby";
            babyGender = localStorage.getItem('babyRoGender') || "neutral";
            babyDueDate = localStorage.getItem('babyRoDueDate') || "";
            localSleepLogs = loadLocalLogs();
        }

        updateBabyNameInUI();
        applyGenderTheme();
        refreshProfileInputs();
        renderTodayLog();
        renderHistory();
        renderLeapStatus();
    });
}

// ==========================================
// 12. TABS & OPSTART
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Tab-navigation
    const tabs = [
        { id: 'nav-player', viewId: 'view-player' },
        { id: 'nav-history', viewId: 'view-history' },
        { id: 'nav-sleep', viewId: 'view-sleep' },
        { id: 'nav-leaps', viewId: 'view-leaps' },
        { id: 'nav-profile', viewId: 'view-profile' }
    ];
    tabs.forEach(tab => {
        const btn = document.getElementById(tab.id);
        const view = document.getElementById(tab.viewId);
        if (btn && view) {
            btn.addEventListener('click', () => {
                tabs.forEach(t => {
                    document.getElementById(t.viewId)?.classList.remove('active-view');
                    const v = document.getElementById(t.viewId);
                    if (v) v.style.display = 'none';
                    document.getElementById(t.id)?.classList.remove('active');
                });
                view.classList.add('active-view');
                view.style.display = 'block';
                btn.classList.add('active');
                window.scrollTo(0, 0);
            });
        }
    });
    // Sørger for at forsiden vises korrekt fra start
    const playerView = document.getElementById('view-player');
    if (playerView) playerView.style.display = 'block';

    // Første besøg (også som gæst): Vis velkomst-overlay, hvis der intet navn er gemt
    if (!localStorage.getItem('babyRoName') && nameSetupOverlay) {
        nameSetupOverlay.style.display = 'flex';
    }

    updateBabyNameInUI();
    applyGenderTheme();
    refreshProfileInputs();
    renderTodayLog();
    renderHistory();
    renderLeapStatus();
});
