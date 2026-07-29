import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 🔴 INDSÆT DINE FIREBASE NØGLER HER
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// GLOBALE VARIABLER
let currentUserId = null;
let isGuest = true; 
let babyName = "Baby";
let localSleepLogs = JSON.parse(localStorage.getItem('babyRoLogs')) || {}; 

const btnAuthNav = document.getElementById('btn-auth-nav');
const nameSetupOverlay = document.getElementById('name-setup-overlay');
const btnSaveName = document.getElementById('btn-save-name');
const babyNameInput = document.getElementById('baby-name-input');
const guestWarning = document.getElementById('guest-warning');

// ==========================================
// 0. NATTILSTAND (Dark Mode)
// ==========================================
const btnThemeToggle = document.getElementById('btn-theme-toggle');

// Tjekker om brugeren tidligere har valgt dark mode
if(localStorage.getItem('babyRoTheme') === 'dark') {
    document.body.classList.add('dark-theme');
    btnThemeToggle.textContent = '☀️';
}

btnThemeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    if (document.body.classList.contains('dark-theme')) {
        localStorage.setItem('babyRoTheme', 'dark');
        btnThemeToggle.textContent = '☀️';
    } else {
        localStorage.setItem('babyRoTheme', 'light');
        btnThemeToggle.textContent = '🌙';
    }
});


// ==========================================
// 1. LOGIN LOGIK (Via Menu Knap)
// ==========================================
btnAuthNav.addEventListener('click', () => {
    if (isGuest) {
        // Hvis man ikke er logget ind, start Google login
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider).catch(err => alert("Login fejl: " + err.message));
    } else {
        // Hvis man allerede ER logget ind, spørg om man vil logge ud
        if(confirm(`Du er logget ind og gemmer ${babyName}s søvn i skyen. Vil du logge ud?`)) {
            signOut(auth);
        }
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        isGuest = false;
        currentUserId = user.uid;
        btnAuthNav.textContent = '👤 Profil'; // Skifter navn på menu-knappen
        guestWarning.style.display = 'none';  // Skjuler advarsel
        
        const userDocRef = doc(db, "users", currentUserId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().babyName) {
            babyName = userDoc.data().babyName;
            updateBabyNameInUI();
            
            if(userDoc.data().sleepLogs) {
                localSleepLogs = userDoc.data().sleepLogs;
                localStorage.setItem('babyRoLogs', JSON.stringify(localSleepLogs));
            }
            renderTodayLog();
            renderHistory();
        } else {
            nameSetupOverlay.style.display = 'flex';
        }
    } else {
        isGuest = true;
        currentUserId = null;
        babyName = "Baby";
        updateBabyNameInUI();
        btnAuthNav.textContent = '👤 Log ind'; 
        guestWarning.style.display = 'block'; 
        
        localSleepLogs = JSON.parse(localStorage.getItem('babyRoLogs')) || {};
        renderTodayLog();
        renderHistory();
    }
});

btnSaveName.addEventListener('click', async () => {
    const inputName = babyNameInput.value.trim();
    if (inputName.length > 0) {
        babyName = inputName;
        await setDoc(doc(db, "users", currentUserId), { babyName: babyName, sleepLogs: localSleepLogs }, { merge: true });
        nameSetupOverlay.style.display = 'none';
        updateBabyNameInUI();
    }
});

function updateBabyNameInUI() {
    document.querySelectorAll('.b-name').forEach(span => span.textContent = babyName);
}

// ==========================================
// 2. APP NAVIGATION
// ==========================================
const tabs = [
    { id: 'nav-player', viewId: 'view-player' },
    { id: 'nav-history', viewId: 'view-history' },
    { id: 'nav-sleep', viewId: 'view-sleep' },
    { id: 'nav-leaps', viewId: 'view-leaps' }
];

tabs.forEach(tab => {
    const btn = document.getElementById(tab.id);
    const view = document.getElementById(tab.viewId);
    
    btn.addEventListener('click', () => {
        tabs.forEach(t => {
            document.getElementById(t.viewId).classList.remove('active-view');
            document.getElementById(t.id).classList.remove('active');
        });
        // Fjerner også active class fra auth-knappen for en sikkerheds skyld
        btnAuthNav.classList.remove('active'); 
        
        view.classList.add('active-view');
        btn.classList.add('active');
    });
});

// ==========================================
// 3. SØVNUR LOGIK
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
    isUrPaused = false; btnPauseTime.textContent = 'Pause ur'; 
    btnPauseTime.style.background = ''; btnPauseTime.style.color = '';
    updateDisplay();
}
function updateDisplay() {
    const h = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(elapsedSeconds % 60).padStart(2, '0');
    timeDisplay.textContent = `${h}:${m}:${s}`;
}

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

// ==========================================
// 4. LYDAFSPILLER
// ==========================================
const audioPlayer = document.getElementById('global-audio-player');
const playButtons = document.querySelectorAll('.play-btn');
const stopButton = document.getElementById('stop-all');
const timerSelect = document.getElementById('timer-select');
let currentlyPlayingBtn = null;
let timeoutId = null;

function resetAllButtons() { playButtons.forEach(btn => { btn.textContent = 'Afspil'; btn.classList.remove('playing'); }); }

playButtons.forEach(button => {
    button.addEventListener('click', function() {
        const category = this.getAttribute('data-category');
        const audioSrc = document.getElementById(`variant-${category}`).value;

        if (currentlyPlayingBtn === this) {
            audioPlayer.pause(); resetAllButtons(); clearTimer(); currentlyPlayingBtn = null; return;
        }

        resetAllButtons(); audioPlayer.src = audioSrc;
        this.textContent = 'Pause lyd'; this.classList.add('playing'); currentlyPlayingBtn = this;
        
        if (isUrPaused) {
            isUrPaused = false; btnPauseTime.textContent = 'Pause ur'; btnPauseTime.style.background = ''; btnPauseTime.style.color = '';
        }

        startStopwatch(); setupTimer(); 
        audioPlayer.play().catch(() => console.log("Lyd spiller"));
    });
});

stopButton.addEventListener('click', () => {
    audioPlayer.pause(); resetAllButtons(); clearTimer(); currentlyPlayingBtn = null;
});

function setupTimer() {
    clearTimer();
    const minutes = parseInt(timerSelect.value);
    if (minutes > 0) {
        timeoutId = setTimeout(() => {
            audioPlayer.pause(); resetAllButtons(); currentlyPlayingBtn = null;
        }, minutes * 60 * 1000);
    }
}
function clearTimer() { if (timeoutId !== null) { clearTimeout(timeoutId); timeoutId = null; } }
timerSelect.addEventListener('change', () => { if (currentlyPlayingBtn !== null) setupTimer(); });

// ==========================================
// 5. DATABASE (GEM OG VIS LOG FOR ALLE)
// ==========================================

async function saveLogsToFirebase() {
    if (currentUserId && !isGuest) {
        await setDoc(doc(db, "users", currentUserId), { sleepLogs: localSleepLogs }, { merge: true });
    }
}

function formatTimeText(totalSecs) {
    if (totalSecs === 0) return `0:00 min`;
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const secString = String(s).padStart(2, '0');
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${secString} t`;
    return `${m}:${secString} min`; 
}

document.getElementById('btn-save-log').addEventListener('click', () => {
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
    
    audioPlayer.pause(); resetAllButtons(); clearTimer(); currentlyPlayingBtn = null;
    resetStopwatch();
    
    renderTodayLog();
    renderHistory();
    document.getElementById('nav-history').click();
});

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
    const nu = new Date();
    const datoStreng = nu.toLocaleDateString('da-DK');
    document.getElementById('today-date-text').textContent = `Dato: ${datoStreng}`;

    const todayData = localSleepLogs[datoStreng];
    const listEl = document.getElementById('today-log-list');
    const totalEl = document.getElementById('today-total-time');

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

document.getElementById('btn-reset-time').addEventListener('click', () => {
    if(confirm("Vil du nulstille uret uden at gemme?")) resetStopwatch();
});
