document.addEventListener('DOMContentLoaded', () => {
    // Faneblad logik
    const tabPlayer = document.getElementById('nav-player');
    const tabHistory = document.getElementById('nav-history');
    const viewPlayer = document.getElementById('view-player');
    const viewHistory = document.getElementById('view-history');

    tabPlayer.addEventListener('click', () => {
        viewPlayer.style.display = 'block';
        viewHistory.style.display = 'none';
        tabPlayer.classList.add('active');
        tabHistory.classList.remove('active');
    });

    tabHistory.addEventListener('click', () => {
        viewPlayer.style.display = 'none';
        viewHistory.style.display = 'block';
        tabHistory.classList.add('active');
        tabPlayer.classList.remove('active');
        renderHistory(); // Opdaterer listen når fanen åbnes
    });

    // Lydafspiller og Timer variabler
    const audioPlayer = document.getElementById('global-audio-player');
    const playButtons = document.querySelectorAll('.play-btn');
    const stopButton = document.getElementById('stop-all');
    const timerSelect = document.getElementById('timer-select');
    const timeDisplay = document.getElementById('time-elapsed');
    
    let timeoutId = null;
    let currentlyPlayingBtn = null;
    let elapsedSeconds = 0;
    let intervalId = null;

    // --- Stopur Funktioner ---
    function startStopwatch() {
        clearInterval(intervalId);
        intervalId = setInterval(() => {
            elapsedSeconds++;
            updateDisplay();
        }, 1000); 
    }

    function stopStopwatch() { clearInterval(intervalId); }

    function resetStopwatch() {
        stopStopwatch();
        elapsedSeconds = 0;
        updateDisplay();
    }

    function updateDisplay() {
        const h = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(elapsedSeconds % 60).padStart(2, '0');
        timeDisplay.textContent = `Spilletid: ${h}:${m}:${s}`;
    }

    // --- Lydkontrol Funktioner ---
    function resetAllButtons() {
        playButtons.forEach(btn => {
            btn.textContent = 'Afspil';
            btn.classList.remove('playing');
        });
    }

    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            const selectElement = document.getElementById(`variant-${category}`);
            const audioSrc = selectElement.value;

            // Hvis vi trykker pause på den lyd, der allerede kører
            if (currentlyPlayingBtn === this) {
                audioPlayer.pause();
                resetAllButtons();
                clearTimer();
                stopStopwatch(); // Vi pauser uret, men nulstiller det IKKE!
                currentlyPlayingBtn = null;
                return;
            }

            // Start eller skift lyd
            resetAllButtons();
            audioPlayer.src = audioSrc;
            this.textContent = 'Pause';
            this.classList.add('playing');
            currentlyPlayingBtn = this;
            
            // Hvis vi skifter lyd eller starter efter pause, tæller uret bare videre
            startStopwatch();
            setupTimer(); 
            
            audioPlayer.play().catch(() => console.log("Lyd tester uden filer."));
        });
    });

    stopButton.addEventListener('click', () => {
        audioPlayer.pause();
        resetAllButtons();
        clearTimer();
        stopStopwatch();
        currentlyPlayingBtn = null;
    });

    // --- Nedtælling (Auto-sluk) ---
    function setupTimer() {
        clearTimer();
        const minutes = parseInt(timerSelect.value);
        if (minutes > 0) {
            timeoutId = setTimeout(() => {
                audioPlayer.pause();
                resetAllButtons();
                stopStopwatch(); // Stopper tiden, så det ikke tæller videre, mens baby vågner
                currentlyPlayingBtn = null;
            }, minutes * 60 * 1000);
        }
    }

    function clearTimer() {
        if (timeoutId !== null) { clearTimeout(timeoutId); timeoutId = null; }
    }

    timerSelect.addEventListener('change', () => {
        if (currentlyPlayingBtn !== null) setupTimer();
    });

    // --- SØVNLOG & HISTORIK FUNKTIONER ---
    
    // Formatér sekunder til pæn tekst (f.eks. "1 t 15 min")
    function formatTimeText(totalSeconds) {
        if (totalSeconds < 60) return `${totalSeconds} sek`;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        let text = "";
        if (h > 0) text += `${h} t `;
        if (m > 0 || h > 0) text += `${m} min`;
        return text.trim();
    }

    // Gem i browserens LocalStorage
    function saveSleepSession() {
        if (elapsedSeconds < 10) return alert("Tiden er for kort til at gemme (under 10 sek).");

        const nu = new Date();
        const datoStreng = nu.toLocaleDateString('da-DK'); // F.eks. 29.07.2026
        const tidStreng = nu.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });

        let logs = JSON.parse(localStorage.getItem('babyRoLogs')) || {};

        if (!logs[datoStreng]) {
            logs[datoStreng] = { sessions: [], total: 0 };
        }

        logs[datoStreng].sessions.push({
            time: tidStreng,
            durationSec: elapsedSeconds,
            durationText: formatTimeText(elapsedSeconds)
        });
        
        logs[datoStreng].total += elapsedSeconds;

        localStorage.setItem('babyRoLogs', JSON.stringify(logs));
        
        renderTodayLog();
        resetStopwatch(); // Nulstil klokken efter vi har gemt
    }

    // Opdater sidebar-boksen "Dagens Søvn"
    function renderTodayLog() {
        const nu = new Date();
        const datoStreng = nu.toLocaleDateString('da-DK');
        document.getElementById('today-date-text').textContent = `Dato: ${datoStreng}`;

        const logs = JSON.parse(localStorage.getItem('babyRoLogs')) || {};
        const todayData = logs[datoStreng];
        const listEl = document.getElementById('today-log-list');
        const totalEl = document.getElementById('today-total-time');

        listEl.innerHTML = ""; // Ryd listen

        if (!todayData || todayData.sessions.length === 0) {
            listEl.innerHTML = "<li>Ingen lure gemt endnu i dag.</li>";
            totalEl.textContent = "0 min";
            return;
        }

        todayData.sessions.forEach(session => {
            const li = document.createElement('li');
            li.innerHTML = `<span>Kl. ${session.time}</span> <span>${session.durationText}</span>`;
            listEl.appendChild(li);
        });

        totalEl.textContent = formatTimeText(todayData.total);
    }

    // Opdater "Søvnmønster" fanen med alle tidligere dage
    function renderHistory() {
        const container = document.getElementById('history-container');
        const logs = JSON.parse(localStorage.getItem('babyRoLogs')) || {};
        
        container.innerHTML = "";
        const dates = Object.keys(logs).reverse(); // Nyeste dage øverst

        if (dates.length === 0) {
            container.innerHTML = "<p>Du har ikke gemt noget søvnhistorik endnu.</p>";
            return;
        }

        dates.forEach(date => {
            const dayData = logs[date];
            let listHtml = "";
            
            dayData.sessions.forEach(session => {
                listHtml += `<li>Kl. ${session.time} - Spilletid: ${session.durationText}</li>`;
            });

            const cardHtml = `
                <div class="history-day-card">
                    <h3>Dato: ${date}</h3>
                    <ul>${listHtml}</ul>
                    <div class="day-total">Samlet sovetid: ${formatTimeText(dayData.total)}</div>
                </div>
            `;
            container.innerHTML += cardHtml;
        });
    }

    // Knapper til loggen
    document.getElementById('btn-save-log').addEventListener('click', saveSleepSession);
    
    document.getElementById('btn-reset-time').addEventListener('click', () => {
        if(confirm("Er du sikker på, du vil nulstille uret uden at gemme?")) {
            resetStopwatch();
        }
    });

    document.getElementById('clear-history-btn').addEventListener('click', () => {
        if(confirm("Er du helt sikker på, du vil slette ALLE tidligere gemte dage? Dette kan ikke fortrydes.")) {
            localStorage.removeItem('babyRoLogs');
            renderHistory();
            renderTodayLog();
        }
    });

    // Start med at vise dagens log i sidebaren
    renderTodayLog();
});
