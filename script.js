// Vi importerer Firebase direkte via internettet
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 🔴 INDSÆT DINE FIREBASE NØGLER HER (TRIN 4)
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
// Start Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Globale variabler
let currentUserId = null;
let babyName = "Baby";

// Find HTML elementer til Login
const loginOverlay = document.getElementById('login-overlay');
const btnGoogleLogin = document.getElementById('btn-google-login');
const nameSetupOverlay = document.getElementById('name-setup-overlay');
const babyNameInput = document.getElementById('baby-name-input');
const btnSaveName = document.getElementById('btn-save-name');
const btnLogout = document.getElementById('btn-logout');

// ==========================================
// 1. FIREBASE AUTHENTICATION (LOGIN)
// ==========================================

btnGoogleLogin.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(error => {
        alert("Fejl ved login: " + error.message);
    });
});

btnLogout.addEventListener('click', () => {
    signOut(auth);
});

// Lytter efter om man er logget ind eller ud
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        loginOverlay.style.display = 'none'; // Skjul login skærm
        
        // Tjek om brugeren allerede har indtastet barnets navn i databasen
        const userDocRef = doc(db, "users", currentUserId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().babyName) {
            babyName = userDoc.data().babyName;
            updateBabyNameInUI();
            loadLogsFromFirebase(); // Hent alle sovetider fra skyen
        } else {
            // Hvis der ikke findes et navn, vis navne-skærmen
            nameSetupOverlay.style.display = 'flex';
        }
    } else {
        // Hvis man er logget ud
        currentUserId = null;
        loginOverlay.style.display = 'flex';
        document.getElementById('today-log-list').innerHTML = "";
        document.getElementById('history-container').innerHTML = "";
    }
});

btnSaveName.addEventListener('click', async () => {
    const inputName = babyNameInput.value.trim();
    if (inputName.length > 0) {
        babyName = inputName;
        // Gem navnet og en tom start-log i Firebase
        await setDoc(doc(db, "users", currentUserId), { 
            babyName: babyName,
            sleepLogs: {} // Vi opretter et tomt objekt til søvntider
        }, { merge: true });
        
        nameSetupOverlay.style.display = 'none';
        updateBabyNameInUI();
        loadLogsFromFirebase();
    }
});

function updateBabyNameInUI() {
    // Finder alle steder i HTML hvor vi har sat <span class="b-name">
    const nameSpans = document.querySelectorAll('.b-name');
    nameSpans.forEach(span => {
        span.textContent = babyName;
    });
}


// ==========================================
// 2. SØVNLOG & FIREBASE DATABASE LOGIK
// ==========================================
let localSleepLogs = {}; // Vi holder en lokal kopi, mens siden kører

async function loadLogsFromFirebase() {
    const userDocRef = doc(db, "users", currentUserId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists() && userDoc.data().sleepLogs) {
        localSleepLogs = userDoc.data().sleepLogs;
    } else {
        localSleepLogs = {};
    }
    renderTodayLog();
    renderHistory();
}

async function saveLogsToFirebase() {
    if (currentUserId) {
        const userDocRef = doc(db, "users", currentUserId);
        await setDoc(userDocRef, { sleepLogs: localSleepLogs }, { merge: true });
        renderTodayLog();
        renderHistory();
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

function saveSleepSession() {
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
    
    // Gem til Firebase Databasen!
    saveLogsToFirebase();
    
    audioPlayer.pause();
    resetAllButtons();
    clearTimer();
    currentlyPlayingBtn = null;
    resetStopwatch();
}


window.deleteLogEntry = function(dateStr, index) {
    if(confirm(`Er du sikker på, du vil slette denne søvntid for ${babyName}?`)) {
        if(localSleepLogs[dateStr]) {
            const sessionSecs = localSleepLogs[dateStr].sessions[index].durationSec || 0; 
            localSleepLogs[dateStr].total -= sessionSecs;
            if(localSleepLogs[dateStr].total < 0) localSleepLogs[dateStr].total = 0;
            
            localSleepLogs[dateStr].sessions.splice(index, 1);
            if(localSleepLogs[dateStr].sessions.length === 0) {
                delete localSleepLogs[dateStr];
            }
            saveLogsToFirebase(); // Opdater skyen
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
        listEl.innerHTML = `<li>Ingen lure gemt for ${babyName} i dag.</li>`;
        totalEl.textContent = "0:00 min";
        return;
    }

    todayData.sessions.forEach((session, index) => {
        listEl.innerHTML += `
            <li>
                <span>${session.timeDisplay}</span> 
                <div style="display:flex; align-items:center;">
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
        container.innerHTML = "<p>Der er ikke gemt noget søvnhistorik endnu.</p>";
        return;
    }

    dates.forEach(date => {
        const dayData = localSleepLogs[date];
        let listHtml = "";
        dayData.sessions.forEach((session, index) => {
            listHtml += `
                <li>
                    <span>${session.timeDisplay} - Søvnur: ${session.durationText}</span>
                    <button class="delete-btn" onclick="deleteLogEntry('${date}', ${index})">❌</button>
                </li>
            `;
        });
        
        container.innerHTML += `
            <div class="history-day-card">
                <h3>Dato: ${date}</h3>
                <ul>${listHtml}</ul>
                <div class="day-total">Samlet sovetid: ${formatTimeText(dayData.total)}</div>
            </div>
        `;
    });
}

// ==========================================
// 3. FANEBLADE, LYD OG SØVNUR LOGIK (Fra før)
// ==========================================
const tabs = [
    { btn: document.getElementById('nav-player'), view: document.getElementById('view-player') },
    { btn: document.getElementById('nav-history'), view: document.getElementById('view-history') },
    { btn: document.getElementById('nav-sleep'), view: document.getElementById('view-sleep') },
    { btn: document.getElementById('nav-leaps'), view: document.getElementById('view-leaps') }
];

tabs.forEach(tab => {
    tab.btn.addEventListener('click', () => {
        tabs.forEach(t => { t.view.style.display = 'none'; t.btn.classList.remove('active'); });
        tab.view.style.display = 'block'; tab.btn.classList.add('active');
        if (tab.btn.id === 'nav-history') renderHistory();
    });
});

const audioPlayer = document.getElementById('global-audio-player');
const playButtons = document.querySelectorAll('.play-btn');
const stopButton = document.getElementById('stop-all');
const timerSelect = document.getElementById('timer-select');
const timeDisplay = document.getElementById('time-elapsed');
const btnPauseTime = document.getElementById('btn-pause-time');

let timeoutId = null;
let currentlyPlayingBtn = null;
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
    isUrPaused = false; btnPauseTime.textContent = 'Pause'; btnPauseTime.style.backgroundColor = ''; btnPauseTime.style.color = '';
    updateDisplay();
}
function updateDisplay() {
    const h = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(elapsedSeconds % 60).padStart(2, '0');
    timeDisplay.textContent = `Søvnur: ${h}:${m}:${s}`;
}

btnPauseTime.addEventListener('click', () => {
    if (elapsedSeconds === 0 && sessionStartTime === null) return;
    if (!isUrPaused) {
        stopStopwatch(); isUrPaused = true;
        btnPauseTime.textContent = 'Start'; btnPauseTime.style.backgroundColor = '#a4b5a8'; btnPauseTime.style.color = 'white';
    } else {
        startStopwatch(); isUrPaused = false;
        btnPauseTime.textContent = 'Pause'; btnPauseTime.style.backgroundColor = ''; btnPauseTime.style.color = '';
    }
});

function resetAllButtons() { playButtons.forEach(btn => { btn.textContent = 'Afspil'; btn.classList.remove('playing'); }); }

playButtons.forEach(button => {
    button.addEventListener('click', function() {
        const category = this.getAttribute('data-category');
        const audioSrc = document.getElementById(`variant-${category}`).value;

        if (currentlyPlayingBtn === this) {
            audioPlayer.pause(); resetAllButtons(); clearTimer(); currentlyPlayingBtn = null; return;
        }

        resetAllButtons();
        audioPlayer.src = audioSrc;
        this.textContent = 'Pause lyd'; this.classList.add('playing'); currentlyPlayingBtn = this;
        
        if (isUrPaused) {
            isUrPaused = false; btnPauseTime.textContent = 'Pause'; btnPauseTime.style.backgroundColor = ''; btnPauseTime.style.color = '';
        }

        startStopwatch(); setupTimer(); 
        audioPlayer.play().catch(() => console.log("Lyd tester"));
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

document.getElementById('btn-save-log').addEventListener('click', saveSleepSession);
document.getElementById('btn-reset-time').addEventListener('click', () => {
    if(confirm("Vil du nulstille uret uden at gemme?")) resetStopwatch();
});
