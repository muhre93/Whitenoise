// ==================================================
// BabyRo v3 — script.js
// Indhold (lyde + tekster) hentes fra Firestore, hvis du
// har gemt noget via admin.html. Ellers bruges defaults.js.
// ==================================================

// ==========================================
// 1. GLOBALE VARIABLER
// ==========================================
let SOUNDS = JSON.parse(JSON.stringify(DEFAULT_SOUNDS));
let TEXTS = JSON.parse(JSON.stringify(DEFAULT_TEXTS));

let currentUserId = null;
let isGuest = true;
let babyName = localStorage.getItem('babyRoName') || "Baby";
let babyGender = localStorage.getItem('babyRoGender') || "neutral";
let babyDueDate = localStorage.getItem('babyRoDueDate') || "";
let localSleepLogs = loadLocalLogs();

// ==========================================
// 2. FIREBASE
// ==========================================
let auth = null;
let db = null;

if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
    } catch (e) {
        console.log("Firebase kunne ikke starte. Appen kører videre offline.", e);
    }
}

// ==========================================
// 3. DATO-HJÆLPERE
// ==========================================
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

function loadLocalLogs() {
    let logs = {};
    try { logs = JSON.parse(localStorage.getItem('babyRoLogs')) || {}; } catch (e) { logs = {}; }
    const out = {};
    Object.keys(logs).forEach(key => {
        let newKey = key;
        if (key.includes('.')) {
            const parts = key.split('.');
            if (parts.length === 3) newKey = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
        }
        if (!out[newKey]) out[newKey] = logs[key];
        else {
            out[newKey].sessions = (out[newKey].sessions || []).concat(logs[key].sessions || []);
            out[newKey].total = (out[newKey].total || 0) + (logs[key].total || 0);
        }
    });
    return out;
}
function saveLogsLocally() { localStorage.setItem('babyRoLogs', JSON.stringify(localSleepLogs)); }

// ==========================================
// 4. INDHOLD: HENT FRA ADMIN & TEGN OP
// ==========================================
function t(key) {
    const raw = TEXTS[key];
    if (typeof raw !== 'string') return '';
    return raw.replaceAll('{navn}', babyName);
}
function fill(id, key) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = t(key);
}

async function loadContentFromCloud() {
    if (!db) return;
    try {
        const [soundDoc, textDoc] = await Promise.all([
            db.collection("content").doc("sounds").get(),
            db.collection("content").doc("texts").get()
        ]);
        if (soundDoc.exists && Array.isArray(soundDoc.data().categories) && soundDoc.data().categories.length) {
            SOUNDS = soundDoc.data().categories;
        }
        if (textDoc.exists && textDoc.data()) {
            TEXTS = Object.assign({}, DEFAULT_TEXTS, textDoc.data());
        }
    } catch (e) {
        console.log("Kunne ikke hente indhold fra admin — bruger standardindhold.", e);
    }
    renderSounds();
    renderTexts();
}

function renderSounds() {
    const grid = document.getElementById('sound-grid');
    const smartSelect = document.getElementById('smart-sound-select');
    if (!grid) return;

    grid.innerHTML = SOUNDS.map(cat => `
        <div class="sound-card">
            <div class="card-icon">${cat.icon || '🔊'}</div>
            <h3>${cat.title || ''}</h3>
            <select class="sound-variant" id="variant-${cat.id}">
                ${(cat.variants || []).map(v => `<option value="${v.url}">${v.label}</option>`).join('')}
            </select>
            <button class="play-btn" data-category="${cat.id}">Afspil</button>
        </div>
    `).join('');

    if (smartSelect) {
        const prev = smartSelect.value;
        smartSelect.innerHTML = SOUNDS.map(cat => `<option value="${cat.id}">${cat.icon || ''} ${cat.title}</option>`).join('');
        if (prev && SOUNDS.some(c => c.id === prev)) smartSelect.value = prev;
    }
    currentlyPlayingId = null;
}

function renderTexts() {
    document.title = TEXTS.appTitle + " - Beroligende Lyde";
    fill('txt-app-title', 'appTitle');
    fill('txt-app-subtitle', 'appSubtitle');

    const navMap = { 'nav-player': 'navPlayer', 'nav-history': 'navHistory', 'nav-sleep': 'navSleep', 'nav-leaps': 'navLeaps', 'nav-profile': 'navProfile' };
    Object.keys(navMap).forEach(id => { const el = document.getElementById(id); if (el) el.textContent = t(navMap[id]); });

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
    fill('txt-stats-title', 'statsTitle');
    fill('guest-warning', 'guestWarning');

    fill('txt-sleep-title', 'sleepTitle');
    fill('txt-sleep-sub', 'sleepSub');
    const sleepEl = document.getElementById('sleep-cards');
    if (sleepEl) {
        sleepEl.innerHTML = (TEXTS.sleepCards || []).map(c => `
            <div class="info-card">
                <h3>${(c.title || '').replaceAll('{navn}', babyName)}</h3>
                ${(c.body || '').replaceAll('{navn}', babyName)}
            </div>
        `).join('');
    }

    fill('txt-leap-title', 'leapTitle');
    fill('txt-leap-sub', 'leapSub');
    fill('txt-leap-status-title', 'leapStatusTitle');
    fill('txt-leap-intro-title', 'leapIntroTitle');
    fill('txt-leap-intro-body', 'leapIntroBody');
    fill('txt-leap-outro-title', 'leapOutroTitle');
    fill('txt-leap-outro-body', 'leapOutroBody');

    const leapEl = document.getElementById('leap-cards');
    if (leapEl) {
        leapEl.innerHTML = (TEXTS.leapCards || []).map(c => `
            <div class="info-card leap-card" id="leap-${c.nr}">
                <h3><span class="leap-badge">Spring ${c.nr}</span> Uge ${c.from}-${c.to}: ${(c.title || '').replaceAll('{navn}', babyName)}</h3>
                ${(c.body || '').replaceAll('{navn}', babyName)}
            </div>
        `).join('');
    }

    fill('txt-profile-title', 'profileTitle');
    renderLeapStatus();
}

// ==========================================
// 5. SØVNUR
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
    stopStopwatch(); elapsedSeconds = 0; sessionStartTime = null; isUrPaused = false;
    if (btnPauseTime) { btnPauseTime.textContent = 'Pause ur'; btnPauseTime.style.background = ''; btnPauseTime.style.color = ''; }
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
// 6. LYDAFSPILLER
// ==========================================
const audioPlayer = document.getElementById('global-audio-player');
const soundGrid = document.getElementById('sound-grid');
const stopButton = document.getElementById('stop-all');
const timerSelect = document.getElementById('timer-select');
let currentlyPlayingId = null;
let timeoutId = null;
let fadeInterval = null;

function resetAllButtons() {
    document.querySelectorAll('.play-btn[data-category]').forEach(btn => { btn.textContent = 'Afspil'; btn.classList.remove('playing'); });
}
function stopAllSound() {
    clearTimer();
    if (audioPlayer) audioPlayer.pause();
    resetAllButtons();
    currentlyPlayingId = null;
}

// Klik håndteres på hele grid'et, så det også virker for lyde tilføjet i admin
if (soundGrid) {
    soundGrid.addEventListener('click', (e) => {
        const button = e.target.closest('.play-btn[data-category]');
        if (!button) return;
        const category = button.getAttribute('data-category');
        const selectBox = document.getElementById(`variant-${category}`);
        if (!selectBox || !audioPlayer) return;

        if (currentlyPlayingId === category) { stopAllSound(); return; }

        clearTimer();
        resetAllButtons();
        audioPlayer.src = selectBox.value;
        button.textContent = 'Pause lyd';
        button.classList.add('playing');
        currentlyPlayingId = category;

        if (isUrPaused && btnPauseTime) {
            isUrPaused = false; btnPauseTime.textContent = 'Pause ur'; btnPauseTime.style.background = ''; btnPauseTime.style.color = '';
        }
        startStopwatch(); setupTimer();
        audioPlayer.play().catch(() => console.log("Lyden kunne ikke afspilles:", selectBox.value));
    });

    // Skift variant midt i afspilningen
    soundGrid.addEventListener('change', (e) => {
        if (!e.target.classList.contains('sound-variant')) return;
        const category = e.target.id.replace('variant-', '');
        if (currentlyPlayingId === category && audioPlayer) {
            audioPlayer.src = e.target.value;
            audioPlayer.play().catch(() => {});
        }
    });
}

if (stopButton) stopButton.addEventListener('click', stopAllSound);

function setupTimer() {
    clearTimer();
    if (!timerSelect) return;
    const minutes = parseInt(timerSelect.value);
    if (minutes > 0) {
        const totalMs = minutes * 60 * 1000;
        const fadeDurationMs = (minutes <= 2) ? 30000 : 300000;
        timeoutId = setTimeout(() => fadeOutAudio(fadeDurationMs), Math.max(0, totalMs - fadeDurationMs));
    }
}
function fadeOutAudio(durationMs) {
    if (!audioPlayer) return;
    let volume = 1.0;
    const steps = 100;
    fadeInterval = setInterval(() => {
        volume -= 1.0 / steps;
        if (volume <= 0.05) stopAllSound();
        else audioPlayer.volume = volume;
    }, durationMs / steps);
}
function clearTimer() {
    if (timeoutId !== null) { clearTimeout(timeoutId); timeoutId = null; }
    if (fadeInterval !== null) { clearInterval(fadeInterval); fadeInterval = null; }
    if (audioPlayer) audioPlayer.volume = 1.0;
}
if (timerSelect) timerSelect.addEventListener('change', () => { if (currentlyPlayingId !== null) setupTimer(); });

// ==========================================
// 7. SMART-LYT (skærmen må gerne slukke)
// ==========================================
const btnSmartListen = document.getElementById('btn-smart-listen');
const smartStatus = document.getElementById('smart-status');
const smartBox = document.querySelector('.smart-listen-box');
const smartSensitivity = document.getElementById('smart-sensitivity');
const smartSoundSelect = document.getElementById('smart-sound-select');
const micLevel = document.getElementById('mic-level');

let micStream = null, audioCtx = null, analyser = null, micBuffer = null;
let listening = false, loudFrames = 0, listenTimerId = null;

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

    // setInterval i stedet for requestAnimationFrame, så den også kører
    // videre, når skærmen slukker eller fanen er i baggrunden.
    listenTimerId = setInterval(listenTick, 100);
}

function stopListening() {
    listening = false;
    if (listenTimerId) { clearInterval(listenTimerId); listenTimerId = null; }
    if (micStream) { micStream.getTracks().forEach(tr => tr.stop()); micStream = null; }
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
    if (smartBox) smartBox.classList.remove('listening');
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
    for (let i = 0; i < micBuffer.length; i++) {
        const v = (micBuffer[i] - 128) / 128;
        sum += v * v;
    }
    const rms = Math.sqrt(sum / micBuffer.length);

    const sens = smartSensitivity ? parseInt(smartSensitivity.value) : 6;
    const threshold = 0.28 - (sens * 0.024);

    if (micLevel) micLevel.style.width = Math.min(100, Math.round(rms * 300)) + "%";

    if (rms > threshold) loudFrames++;
    else loudFrames = Math.max(0, loudFrames - 2);

    // ca. 1,5 sekunds vedvarende lyd (15 x 100 ms) før der reageres
    if (loudFrames > 15) {
        loudFrames = 0;
        triggerSoothingSound();
    } else if (loudFrames > 5) {
        setSmartStatus("Hører uro... 👂");
    } else {
        setSmartStatus("Lytter... alt er roligt. 💤");
    }
}

function triggerSoothingSound() {
    const category = smartSoundSelect ? smartSoundSelect.value : (SOUNDS[0] && SOUNDS[0].id);
    const btn = document.querySelector(`.play-btn[data-category="${category}"]`);
    setSmartStatus("Uro registreret! Starter beroligende lyd... 🎵");
    if (btn && currentlyPlayingId === null) btn.click();
}

if (btnSmartListen) {
    btnSmartListen.addEventListener('click', () => { if (listening) stopListening(); else startListening(); });
}

// ==========================================
// 8. TEMA & PROFIL
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
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.getAttribute('data-gender') === babyGender);
    });
}

async function persistProfile() {
    localStorage.setItem('babyRoName', babyName);
    localStorage.setItem('babyRoGender', babyGender);
    localStorage.setItem('babyRoDueDate', babyDueDate);

    if (!isGuest && currentUserId && db) {
        try {
            await db.collection("users").doc(currentUserId).set({
                babyName, babyGender, babyDueDate
            }, { merge: true });
        } catch (e) { console.log("Kunne ikke gemme profil i skyen:", e); }
    }
    applyGenderTheme();
    renderTexts();
}

// ==========================================
// 9. LOG
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
    return h > 0 ? `${h}t ${m}m` : `${m}m`;
}

async function saveLogsToFirebase() {
    if (currentUserId && !isGuest && db) {
        try { await db.collection("users").doc(currentUserId).set({ sleepLogs: localSleepLogs }, { merge: true }); }
        catch (e) { console.log("Kunne ikke gemme log i skyen:", e); }
    }
}

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

        if (!localSleepLogs[dateKey]) localSleepLogs[dateKey] = { sessions: [], total: 0 };
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
    if (!confirm(`Er du sikker på, du vil slette denne søvntid for ${babyName}?`)) return;
    if (localSleepLogs[dateKey] && localSleepLogs[dateKey].sessions[index]) {
        const secs = localSleepLogs[dateKey].sessions[index].durationSec || 0;
        localSleepLogs[dateKey].total = Math.max(0, localSleepLogs[dateKey].total - secs);
        localSleepLogs[dateKey].sessions.splice(index, 1);
        if (localSleepLogs[dateKey].sessions.length === 0) delete localSleepLogs[dateKey];
        saveLogsLocally();
        saveLogsToFirebase();
        renderTodayLog();
        renderHistory();
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
            </li>`;
    });
    totalEl.textContent = formatTimeText(todayData.total);
}

function renderHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;
    container.innerHTML = "";
    renderStats();

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
                </li>`;
        });
        container.innerHTML += `
            <div class="history-day-card">
                <h3>${formatDateDK(date)}</h3>
                <ul>${listHtml}</ul>
                <div class="day-total">Dagens total: ${formatTimeText(dayData.total)}</div>
            </div>`;
    });
}

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
            </div>`;
    });
}

// ==========================================
// 10. TIGERSPRING-BEREGNER
// ==========================================
function renderLeapStatus() {
    const textEl = document.getElementById('leap-status-text');
    if (!textEl) return;
    document.querySelectorAll('.leap-card').forEach(c => c.classList.remove('active-leap'));

    const leaps = (TEXTS.leapCards || []).slice().sort((a, b) => a.from - b.from);

    if (!babyDueDate) {
        textEl.innerHTML = `Indtast terminsdatoen under <strong>Profil</strong>, så viser BabyRo automatisk, hvilket spring ${babyName} er i – eller hvornår det næste kommer.`;
        return;
    }
    const due = new Date(babyDueDate + "T00:00:00");
    const weeks = Math.floor((Date.now() - due.getTime()) / (7 * 24 * 60 * 60 * 1000));

    if (weeks < 0) {
        textEl.textContent = `Der er ca. ${Math.abs(weeks)} uger til termin. Det første spring kommer omkring uge ${leaps[0] ? leaps[0].from : 4} efter termin. 💛`;
        return;
    }
    const current = leaps.find(l => weeks >= l.from && weeks <= l.to);
    const next = leaps.find(l => l.from > weeks);

    let msg = `${babyName} er ca. <strong>${weeks} uger</strong> (regnet fra termin). `;
    if (current) {
        msg += `Lige nu er I sandsynligvis midt i <strong>Spring ${current.nr}</strong> (uge ${current.from}-${current.to}) – se det fremhævede kort herunder. Hold ud, der er en solskinsperiode på vej! ⭐`;
        document.getElementById(`leap-${current.nr}`)?.classList.add('active-leap');
    } else if (next) {
        const diff = next.from - weeks;
        msg += `I er i en rolig periode. Næste spring er <strong>Spring ${next.nr}</strong>, som typisk begynder omkring uge ${next.from} – altså om ca. ${diff} uge${diff === 1 ? '' : 'r'}. ☀️`;
        document.getElementById(`leap-${next.nr}`)?.classList.add('active-leap');
    } else {
        msg += `Alle tigerspring er overstået – godt klaret! 🎉`;
    }
    textEl.innerHTML = msg;
}

// ==========================================
// 11. PROFIL-UI
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

document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.addEventListener('click', () => { babyGender = btn.getAttribute('data-gender'); persistProfile(); });
});

if (btnSaveName) {
    btnSaveName.addEventListener('click', () => {
        const inputName = babyNameInput.value.trim();
        if (!inputName) { babyNameInput.focus(); return; }
        babyName = inputName;
        persistProfile();
        if (nameSetupOverlay) nameSetupOverlay.style.display = 'none';
        if (profileNameInput) profileNameInput.value = babyName;
    });
}

if (btnUpdateName) {
    btnUpdateName.addEventListener('click', () => {
        const inputName = profileNameInput.value.trim();
        if (inputName) babyName = inputName;
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
// 12. LOGIN / LOGOUT
// ==========================================
if (auth) {
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(err => alert("Login fejl: " + err.message));
        });
    }
    if (btnLogout) {
        btnLogout.addEventListener('click', () => { if (confirm("Er du sikker på, at du vil logge ud?")) auth.signOut(); });
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
                if (data.babyName) babyName = data.babyName;
                if (data.babyGender) babyGender = data.babyGender;
                if (data.babyDueDate) babyDueDate = data.babyDueDate;

                localSleepLogs = mergeLogs(data.sleepLogs || {}, localSleepLogs);
                saveLogsLocally();
                await persistProfile();
                await saveLogsToFirebase();

                if (!data.babyName && babyName === "Baby" && nameSetupOverlay) nameSetupOverlay.style.display = 'flex';
            } catch (e) { console.log("Kunne ikke hente data fra skyen:", e); }
        } else {
            isGuest = true;
            currentUserId = null;
            if (guestSection) guestSection.style.display = 'block';
            if (loggedInSection) loggedInSection.style.display = 'none';
            if (guestWarning) guestWarning.style.display = 'block';
            babyName = localStorage.getItem('babyRoName') || "Baby";
            babyGender = localStorage.getItem('babyRoGender') || "neutral";
            babyDueDate = localStorage.getItem('babyRoDueDate') || "";
            localSleepLogs = loadLocalLogs();
        }

        applyGenderTheme();
        refreshProfileInputs();
        renderTexts();
        renderTodayLog();
        renderHistory();
    });
}

// ==========================================
// 13. TABS & OPSTART
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
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
        if (!btn || !view) return;
        btn.addEventListener('click', () => {
            tabs.forEach(tt => {
                const v = document.getElementById(tt.viewId);
                if (v) { v.classList.remove('active-view'); v.style.display = 'none'; }
                document.getElementById(tt.id)?.classList.remove('active');
            });
            view.classList.add('active-view');
            view.style.display = 'block';
            btn.classList.add('active');
            window.scrollTo(0, 0);
        });
    });
    const playerView = document.getElementById('view-player');
    if (playerView) playerView.style.display = 'block';

    if (!localStorage.getItem('babyRoName') && nameSetupOverlay) nameSetupOverlay.style.display = 'flex';

    applyGenderTheme();
    refreshProfileInputs();
    renderSounds();
    renderTexts();
    renderTodayLog();
    renderHistory();
    loadContentFromCloud();
});
