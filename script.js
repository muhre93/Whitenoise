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
let isGuest = false;
let babyName = "Baby";
let localSleepLogs = {}; 

// ELEMENTER
const loginOverlay = document.getElementById('login-overlay');
const btnGoogleLogin = document.getElementById('btn-google-login');
const btnGuestLogin = document.getElementById('btn-guest-login');
const nameSetupOverlay = document.getElementById('name-setup-overlay');
const btnSaveName = document.getElementById('btn-save-name');
const babyNameInput = document.getElementById('baby-name-input');
const btnLogout = document.getElementById('btn-logout');
const btnForceLogin = document.getElementById('btn-force-login');

// ==========================================
// 1. LOGIN & GÆSTETILSTAND
// ==========================================
btnGoogleLogin.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(err => alert("Login fejl: " + err.message));
});

btnGuestLogin.addEventListener('click', () => {
    isGuest = true;
    currentUserId = null;
    babyName = "Baby"; // Standard navn i gæstetilstand
    updateBabyNameInUI();
    loginOverlay.style.display = 'none';
    btnLogout.style.display = 'none';
    btnForceLogin.style.display = 'block'; // Vis en knap til at logge ind senere
    renderHistory();
});

btnLogout.addEventListener('click', () => signOut(auth));
btnForceLogin.addEventListener('click', () => location.reload()); // Genindlæser siden for at vise login-skærm

onAuthStateChanged(auth, async (user) => {
    if (user) {
        isGuest = false;
        currentUserId = user.uid;
        loginOverlay.style.display = 'none';
        btnLogout.style.display = 'block';
        btnForceLogin.style.display = 'none';
        
        const userDocRef = doc(db, "users", currentUserId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().babyName) {
            babyName = userDoc.data().babyName;
            updateBabyNameInUI();
            loadLogsFromFirebase();
        } else {
            nameSetupOverlay.style.display = 'flex';
        }
    } else {
        if (!isGuest) {
            loginOverlay.style.display = 'flex';
        }
    }
});

btnSaveName.addEventListener('click', async () => {
    const inputName = babyNameInput.value.trim();
    if (inputName.length > 0) {
        babyName = inputName;
        await setDoc(doc(db, "users", currentUserId), { babyName: babyName, sleepLogs: {} }, { merge: true });
        nameSetupOverlay.style.display = 'none';
        updateBabyNameInUI();
        loadLogsFromFirebase();
    }
});

function updateBabyNameInUI() {
    document.querySelectorAll('.b-name').forEach(span => span.textContent = babyName);
}

// ==========================================
// 2. APP NAVIGATION (Bottom Menu)
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
        view.classList.add('active-view');
        btn.classList.add('active');
        window.scrollTo(0, 0); // Scroll til toppen ved sideskift
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
// 5. DATABASE (GEM OG VIS LOG)
// ==========================================
async function loadLogsFromFirebase() {
    if(isGuest) return; // Gæster henter ikke data
    const userDocRef = doc(db, "users", currentUserId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists() && userDoc.data().sleepLogs) {
        localSleepLogs = userDoc.data().sleepLogs;
    } else {
        localSleepLogs = {};
    }
    renderHistory();
}

async function saveLogsToFirebase() {
    if (currentUserId) {
        await setDoc(doc(db, "users", currentUserId), { sleepLogs: localSleepLogs }, { merge: true });
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

document.getElementById('btn-save-log').addEventListener('click', () => {
    // Tjek om man er gæst!
    if(isGuest) {
        alert("Opret en gratis profil ved at logge ind med Google for at gemme søvntider!");
        return;
    }

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
    
    saveLogsToFirebase();
    
    audioPlayer.pause(); resetAllButtons(); clearTimer(); currentlyPlayingBtn = null;
    resetStopwatch();
    
    // Vis loggen med det samme, så brugeren kan se at den er gemt
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
            saveLogsToFirebase(); 
        }
    }
};

function renderHistory() {
    const container = document.getElementById('history-container');
    container.innerHTML = "";
    
    if(isGuest) {
        container.innerHTML = `
            <div style="text-align:center; padding: 40px 20px;">
                <h3 style="color:#a4b5a8; margin-bottom:10px;">Gæstetilstand</h3>
                <p style="color:#7a7a7a;">Du er ikke logget ind. Log ind med Google for at gemme ${babyName}s sovetider.</p>
            </div>
        `;
        return;
    }

    const dates = Object.keys(localSleepLogs).reverse(); 
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
