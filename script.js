// ==========================================
// 1. SIKKER TAB NAVIGATION (Starter altid først)
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
        
        if(btn && view) {
            btn.addEventListener('click', () => {
                tabs.forEach(t => {
                    document.getElementById(t.viewId)?.classList.remove('active-view');
                    document.getElementById(t.id)?.classList.remove('active');
                });
                view.classList.add('active-view');
                btn.classList.add('active');
                window.scrollTo(0, 0); 
            });
        }
    });
});

// GLOBALE VARIABLER
let currentUserId = null;
let isGuest = true; 
let babyName = "Baby";
let localSleepLogs = JSON.parse(localStorage.getItem('babyRoLogs')) || {}; 

// ==========================================
// 2. FIREBASE OPSÆTNING
// ==========================================
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

// Tjekker om Firebase er loadet fra HTML'en
if (typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
    } catch(e) {
        console.log("Firebase fejl. Appen kører bare videre i offline-tilstand.");
    }
}

// ==========================================
// 3. TEMA (NATTILSTAND)
// ==========================================
const btnThemeToggle = document.getElementById('btn-theme-toggle');
if(btnThemeToggle) {
    if(localStorage.getItem('babyRoTheme') === 'dark') {
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

function updateBabyNameInUI() {
    document.querySelectorAll('.b-name').forEach(span => span.textContent = babyName);
}

// ==========================================
// 4. SØVNUR LOGIK
// ==========================================
const timeDisplay = document.getElementById('time-elapsed');
const btnPauseTime = document.getElementById('btn-pause-time');
let elapsedSeconds = 0;
let intervalId = null;
let sessionStartTime = null; 
let isUrPaused = false; 

function startStopwatch() {
    if (sessionStartTime === null) sessionStartTime = new Date();
    clearInterval(intervalId);
    intervalId = setInterval(() => { elapsedSeconds++; updateDisplay(); }, 1000); 
}
function stopStopwatch() { clearInterval(intervalId); }
function resetStopwatch() {
    stopStopwatch(); elapsedSeconds = 0; sessionStartTime = null; 
    isUrPaused = false; 
    if(btnPauseTime) {
        btnPauseTime.textContent = 'Pause ur'; 
        btnPauseTime.style.background = ''; btnPauseTime.style.color = '';
    }
    updateDisplay();
}
function updateDisplay() {
    if(!timeDisplay) return;
    const h = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(elapsedSeconds % 60).padStart(2, '0');
    timeDisplay.textContent = `${h}:${m}:${s}`;
}

if(btnPauseTime) {
    btnPauseTime.addEventListener('click', () => {
        if (elapsedSeconds === 0 && sessionStartTime === null) return;
        if (!isUrPaused) {
            stopStopwatch(); isUrPaused = true;
            btnPauseTime.textContent = 'Start ur'; btnPauseTime.style.background = '#8DA399'; btnPauseTime.style.color = 'white';
        } else {
            startStopwatch(); isUrPaused = false;
            btnPauseTime.textContent = 'Pause ur'; btnPauseTime.style.background = ''; btnPauseTime.style.color = '';
        }
    });
}

// ==========================================
// 5. LYDAFSPILLER & 5-MIN FADE OUT
// ==========================================
const audioPlayer = document.getElementById('global-audio-player');
const playButtons = document.querySelectorAll('.play-btn');
const stopButton = document.getElementById('stop-all');
const timerSelect = document.getElementById('timer-select');
let currentlyPlayingBtn = null;
let timeoutId = null;
let fadeInterval = null;

function resetAllButtons() { playButtons.forEach(btn => { btn.textContent = 'Afspil'; btn.classList.remove('playing'); }); }

playButtons.forEach(button => {
    button.addEventListener('click', function() {
        const category = this.getAttribute('data-category');
        const selectBox = document.getElementById(`variant-${category}`);
        if(!selectBox || !audioPlayer) return;

        if (currentlyPlayingBtn === this) {
            clearTimer(); 
            audioPlayer.pause(); resetAllButtons(); currentlyPlayingBtn = null; return;
        }

        clearTimer();
        resetAllButtons(); audioPlayer.src = selectBox.value;
        this.textContent = 'Pause lyd'; this.classList.add('playing'); currentlyPlayingBtn = this;
        
        if (isUrPaused && btnPauseTime) {
            isUrPaused = false; btnPauseTime.textContent = 'Pause ur'; btnPauseTime.style.background = ''; btnPauseTime.style.color = '';
        }

        startStopwatch(); setupTimer(); 
        audioPlayer.play().catch(e => console.log("Lyd tester"));
    });
});

if(stopButton) {
    stopButton.addEventListener('click', () => {
        clearTimer();
        if(audioPlayer) audioPlayer.pause(); 
        resetAllButtons(); currentlyPlayingBtn = null;
    });
}

function setupTimer() {
    clearTimer();
    if(!timerSelect) return;
    const minutes = parseInt(timerSelect.value);
    if (minutes > 0) {
        const totalMs = minutes * 60 * 1000;
        const fadeDurationMs = (minutes <= 2) ? 30000 : 300000; 

        timeoutId = setTimeout(() => {
            fadeOutAudio(fadeDurationMs);
        }, totalMs - fadeDurationMs); 
    }
}

function fadeOutAudio(durationMs) {
    if(!audioPlayer) return;
    let volume = 1.0;
    const steps = 100; 
    const stepTimeMs = durationMs / steps;
    const volumeDrop = 1.0 / steps;

    fadeInterval = setInterval(() => {
        volume -= volumeDrop;
        if (volume <= 0.05) {
            clearTimer(); 
            audioPlayer.pause();
            resetAllButtons();
            currentlyPlayingBtn = null;
        } else {
            audioPlayer.volume = volume;
        }
    }, stepTimeMs); 
}

function clearTimer() { 
    if (timeoutId !== null) { clearTimeout(timeoutId); timeoutId = null; } 
    if (fadeInterval !== null) { clearInterval(fadeInterval); fadeInterval = null; }
    if(audioPlayer) audioPlayer.volume = 1.0; 
}
if(timerSelect) timerSelect.addEventListener('change', () => { if (currentlyPlayingBtn !== null) setupTimer(); });

// ==========================================
// 6. PROFIL & FIREBASE LOGIK
// ==========================================
const btnGoogleLogin = document.getElementById('btn-google-login');
const btnLogout = document.getElementById('btn-logout');
const guestSection = document.getElementById('profile-guest-section');
const loggedInSection = document.getElementById('profile-logged-in-section');
const btnUpdateName = document.getElementById('btn-update-name');
const profileNameInput = document.getElementById('profile-name-input');
const guestWarning = document.getElementById('guest-warning');

// Setup vinduet ved første besøg
const nameSetupOverlay = document.getElementById('name-setup-overlay');
const btnSaveName = document.getElementById('btn-save-name');
const babyNameInput = document.getElementById('baby-name-input');

if (auth) {
    if(btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(err => alert("Login fejl: " + err.message));
        });
    }

    if(btnLogout) {
        btnLogout.addEventListener('click', () => {
            if(confirm("Er du sikker på, at du vil logge ud?")) auth.signOut();
        });
    }

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            isGuest = false;
            currentUserId = user.uid;
            
            if(guestSection) guestSection.style.display = 'none';
            if(loggedInSection) loggedInSection.style.display = 'block';
            if(guestWarning) guestWarning.style.display = 'none';
            
            const userDocRef = db.collection("users").doc(currentUserId);
            const userDoc = await userDocRef.get();
            
            if (userDoc.exists && userDoc.data().babyName) {
                babyName = userDoc.data().babyName;
                if(profileNameInput) profileNameInput.value = babyName;
                updateBabyNameInUI();
                
                if(userDoc.data().sleepLogs) {
                    localSleepLogs = userDoc.data().sleepLogs;
                    localStorage.setItem('babyRoLogs', JSON.stringify(localSleepLogs));
                }
            } else {
                if(nameSetupOverlay) nameSetupOverlay.style.display = 'flex';
            }
            renderTodayLog();
            renderHistory();
        } else {
            isGuest = true;
            currentUserId = null;
            babyName = "Baby";
            if(profileNameInput) profileNameInput.value = "";
            updateBabyNameInUI();
            
            if(guestSection) guestSection.style.display = 'block';
            if(loggedInSection) loggedInSection.style.display = 'none';
            if(guestWarning) guestWarning.style.display = 'block';
            
            localSleepLogs = JSON.parse(localStorage.getItem('babyRoLogs')) || {};
            renderTodayLog();
            renderHistory();
        }
    });

    if(btnSaveName) {
        btnSaveName.addEventListener('click', async () => {
            const inputName = babyNameInput.value.trim();
            if (inputName.length > 0) {
                babyName = inputName;
                await db.collection("users").doc(currentUserId).set({ babyName: babyName }, { merge: true });
                if(nameSetupOverlay) nameSetupOverlay.style.display = 'none';
                if(profileNameInput) profileNameInput.value = babyName;
                updateBabyNameInUI();
            }
        });
    }

    if(btnUpdateName) {
        btnUpdateName.addEventListener('click', async () => {
            const inputName = profileNameInput.value.trim();
            if (inputName.length > 0) {
                babyName = inputName;
                await db.collection("users").doc(currentUserId).set({ babyName: babyName }, { merge: true });
                updateBabyNameInUI();
                alert("Oplysninger er gemt!");
            }
        });
    }
}

async function saveLogsToFirebase() {
    if (currentUserId && !isGuest && db) {
        await db.collection("users").doc(currentUserId).set({ sleepLogs: localSleepLogs }, { merge: true });
    }
}

// ==========================================
// 7. LOKAL LOG & SLETNING
// ==========================================
function formatTimeText(totalSecs) {
    if (totalSecs === 0) return `0:00 min`;
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const secString = String(s).padStart(2, '0');
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${secString} t`;
    return `${m}:${secString} min`; 
}

const btnSaveLog = document.getElementById('btn-save-log');
if(btnSaveLog) {
    btnSaveLog.addEventListener('click', () => {
        if (elapsedSeconds === 0) {
            alert("Søvnuret er på nul. Start uret først.");
            return;
        }

        const endTime = new Date();
        const startTime = sessionStartTime || new Date(endTime.getTime() - (elapsedSeconds * 1000));
        const datoStreng = endTime.toLocaleDateString('da-DK'); 
        const startStreng = startTime.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
        const slutStreng = endTime.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });

        if (!localSleepLogs[datoStreng]) { localSleepLogs[datoStreng] = { sessions: [], total: 0 }; }

        localSleepLogs[datoStreng].sessions.push({
            timeDisplay: `Kl. ${startStreng} - ${slutStreng}`, 
            durationText: formatTimeText(elapsedSeconds),
            durationSec: elapsedSeconds 
        });
        
        localSleepLogs[datoStreng].total += elapsedSeconds;
        
        localStorage.setItem('babyRoLogs', JSON.stringify(localSleepLogs));
        saveLogsToFirebase();
        
        clearTimer();
        if(audioPlayer) audioPlayer.pause(); 
        resetAllButtons(); currentlyPlayingBtn = null;
        resetStopwatch();
        
        renderTodayLog();
        renderHistory();
        document.getElementById('nav-history')?.click();
    });
}

window.deleteLogEntry = function(dateStr, index) {
    if(confirm(`Er du sikker på, du vil slette denne søvntid for ${babyName}?`)) {
        if(localSleepLogs[dateStr]) {
            const sessionSecs = localSleepLogs[dateStr].sessions[index].durationSec || 0; 
            localSleepLogs[dateStr].total -= sessionSecs;
            if(localSleepLogs[dateStr].total < 0) localSleepLogs[dateStr].total = 0;
            localSleepLogs[dateStr].sessions.splice(index, 1);
            if(localSleepLogs[dateStr].sessions.length === 0) delete localSleepLogs[dateStr];
            
            localStorage.setItem('babyRoLogs', JSON.stringify(localSleepLogs));
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
    if(!listEl || !totalEl) return;

    const nu = new Date();
    const datoStreng = nu.toLocaleDateString('da-DK');
    if(dateText) dateText.textContent = `Dato: ${datoStreng}`;

    const todayData = localSleepLogs[datoStreng];
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
                    <button class="delete-btn" onclick="deleteLogEntry('${datoStreng}', ${index})">❌</button>
                </div>
            </li>
        `;
    });
    totalEl.textContent = formatTimeText(todayData.total);
}

function renderHistory() {
    const container = document.getElementById('history-container');
    if(!container) return;
    
    container.innerHTML = "";

    const dates = Object.keys(localSleepLogs).reverse(); 
    if (dates.length === 0) {
        container.innerHTML = `<div class="empty-state" style="text-align:center; padding: 20px;">Brug afspilleren og tryk "Gem lur" for at starte loggen.</div>`;
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
                <h3>${date}</h3>
                <ul>${listHtml}</ul>
                <div class="day-total">Dagens total: ${formatTimeText(dayData.total)}</div>
            </div>
        `;
    });
}

const btnResetTime = document.getElementById('btn-reset-time');
if(btnResetTime) {
    btnResetTime.addEventListener('click', () => {
        if(confirm("Vil du nulstille uret uden at gemme?")) resetStopwatch();
    });
}

// Sørger for loggen indlæses med det samme på skærmen
document.addEventListener('DOMContentLoaded', () => {
    renderTodayLog();
    renderHistory();
});
