document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. HÅNDTERING AF DE 4 FANEBLADE ---
    const tabs = [
        { btn: document.getElementById('nav-player'), view: document.getElementById('view-player') },
        { btn: document.getElementById('nav-history'), view: document.getElementById('view-history') },
        { btn: document.getElementById('nav-sleep'), view: document.getElementById('view-sleep') },
        { btn: document.getElementById('nav-leaps'), view: document.getElementById('view-leaps') }
    ];

    tabs.forEach(tab => {
        tab.btn.addEventListener('click', () => {
            tabs.forEach(t => {
                t.view.style.display = 'none';
                t.btn.classList.remove('active');
            });
            tab.view.style.display = 'block';
            tab.btn.classList.add('active');
            
            if (tab.btn.id === 'nav-history') {
                renderHistory();
            }
        });
    });

    // --- 2. VARIABLER TIL LYD OG TID ---
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

    // --- 3. STOPUR (SØVNUR) ---
    function startStopwatch() {
        if (sessionStartTime === null) {
            sessionStartTime = new Date();
        }
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
        sessionStartTime = null; 
        
        isUrPaused = false;
        btnPauseTime.textContent = 'Pause';
        btnPauseTime.style.backgroundColor = '';
        btnPauseTime.style.color = '';
        
        updateDisplay();
    }

    function updateDisplay() {
        const h = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(elapsedSeconds % 60).padStart(2, '0');
        timeDisplay.textContent = `Søvnur: ${h}:${m}:${s}`;
    }

    // --- PAUSE-KNAP LOGIK ---
    btnPauseTime.addEventListener('click', () => {
        if (elapsedSeconds === 0 && sessionStartTime === null) return;
        
        if (!isUrPaused) {
            stopStopwatch();
            isUrPaused = true;
            btnPauseTime.textContent = 'Start';
            btnPauseTime.style.backgroundColor = '#a4b5a8'; 
            btnPauseTime.style.color = 'white';
        } else {
            startStopwatch();
            isUrPaused = false;
            btnPauseTime.textContent = 'Pause';
            btnPauseTime.style.backgroundColor = '';
            btnPauseTime.style.color = '';
        }
    });

    // --- 4. LYDAFSPILLER ---
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

            if (currentlyPlayingBtn === this) {
                audioPlayer.pause();
                resetAllButtons();
                clearTimer();
                currentlyPlayingBtn = null;
                return;
            }

            resetAllButtons();
            audioPlayer.src = audioSrc;
            
            this.textContent = 'Pause lyd';
            this.classList.add('playing');
            currentlyPlayingBtn = this;
            
            if (isUrPaused) {
                isUrPaused = false;
                btnPauseTime.textContent = 'Pause';
                btnPauseTime.style.backgroundColor = '';
                btnPauseTime.style.color = '';
            }

            startStopwatch(); 
            setupTimer(); 
            
            audioPlayer.play().catch(() => console.log("Lyd tester"));
        });
    });

    stopButton.addEventListener('click', () => {
        audioPlayer.pause();
        resetAllButtons();
        clearTimer();
        currentlyPlayingBtn = null;
    });

    // --- 5. AUTOMATISK SLUK TIMER ---
    function setupTimer() {
        clearTimer();
        const minutes = parseInt(timerSelect.value);
        if (minutes > 0) {
            timeoutId = setTimeout(() => {
                audioPlayer.pause();
                resetAllButtons();
                currentlyPlayingBtn = null;
            }, minutes * 60 * 1000);
        }
    }
    function clearTimer() { if (timeoutId !== null) { clearTimeout(timeoutId); timeoutId = null; } }
    timerSelect.addEventListener('change', () => { if (currentlyPlayingBtn !== null) setupTimer(); });

    // --- 6. SØVNLOG & HISTORIK ---
    function formatTimeText(totalSecs) {
        if (totalSecs === 0) return `0:00 min`;
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        const secString = String(s).padStart(2, '0');
        
        if (h > 0) {
            const minString = String(m).padStart(2, '0');
            return `${h}:${minString}:${secString} t`; 
        } else {
            return `${m}:${secString} min`; 
        }
    }

    function saveSleepSession() {
        if (elapsedSeconds === 0) {
            alert("Søvnuret er på nul. Start uret først for at gemme en tid.");
            return;
        }

        const endTime = new Date();
        const startTime = sessionStartTime || new Date(endTime.getTime() - (elapsedSeconds * 1000));

        const datoStreng = endTime.toLocaleDateString('da-DK'); 
        const startStreng = startTime.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
        const slutStreng = endTime.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });

        let logs = JSON.parse(localStorage.getItem('babyRoLogs')) || {};
        if (!logs[datoStreng]) { logs[datoStreng] = { sessions: [], total: 0 }; }

        logs[datoStreng].sessions.push({
            timeDisplay: `Kl. ${startStreng} - ${slutStreng}`, 
            durationText: formatTimeText(elapsedSeconds),
            durationSec: elapsedSeconds 
        });
        
        logs[datoStreng].total += elapsedSeconds;
        localStorage.setItem('babyRoLogs', JSON.stringify(logs));
        
        audioPlayer.pause();
        resetAllButtons();
        clearTimer();
        currentlyPlayingBtn = null;
        
        renderTodayLog();
        resetStopwatch();
    }

    // Gør slette-funktionen global, så HTML-knapperne kan finde den
    window.deleteLogEntry = function(dateStr, index) {
        if(confirm("Er du sikker på, at du vil slette denne specifikke søvntid?")) {
            let logs = JSON.parse(localStorage.getItem('babyRoLogs')) || {};
            
            if(logs[dateStr]) {
                const session = logs[dateStr].sessions[index];
                const sessionSecs = session.durationSec || 0; 
                
                // Trækker tiden fra dagens total
                logs[dateStr].total -= sessionSecs;
                if(logs[dateStr].total < 0) logs[dateStr].total = 0;
                
                // Fjerner den specifikke linje
                logs[dateStr].sessions.splice(index, 1);
                
                // Hvis der ikke er flere tider den dag, sletter vi hele dagen fra hukommelsen
                if(logs[dateStr].sessions.length === 0) {
                    delete logs[dateStr];
                }
                
                localStorage.setItem('babyRoLogs', JSON.stringify(logs));
                
                // Opdaterer begge skærme med det samme
                renderTodayLog();
                renderHistory();
            }
        }
    };

    function renderTodayLog() {
        const nu = new Date();
        const datoStreng = nu.toLocaleDateString('da-DK');
        document.getElementById('today-date-text').textContent = `Dato: ${datoStreng}`;

        const logs = JSON.parse(localStorage.getItem('babyRoLogs')) || {};
        const todayData = logs[datoStreng];
        const listEl = document.getElementById('today-log-list');
        const totalEl = document.getElementById('today-total-time');

        listEl.innerHTML = "";

        if (!todayData || todayData.sessions.length === 0) {
            listEl.innerHTML = "<li>Ingen lure gemt endnu i dag.</li>";
            totalEl.textContent = "0:00 min";
            return;
        }

        // Forsiden (Dagens Søvn) har nu også sletteknappen!
        todayData.sessions.forEach((session, index) => {
            const li = document.createElement('li');
            const displayText = session.timeDisplay ? session.timeDisplay : `Kl. ${session.time}`;
            li.innerHTML = `
                <span>${displayText}</span> 
                <div style="display:flex; align-items:center;">
                    <span>${session.durationText}</span>
                    <button class="delete-btn" onclick="deleteLogEntry('${datoStreng}', ${index})" title="Slet tid">❌</button>
                </div>
            `;
            listEl.appendChild(li);
        });

        totalEl.textContent = formatTimeText(todayData.total);
    }

    function renderHistory() {
        const container = document.getElementById('history-container');
        const logs = JSON.parse(localStorage.getItem('babyRoLogs')) || {};
        
        container.innerHTML = "";
        const dates = Object.keys(logs).reverse(); 

        if (dates.length === 0) {
            container.innerHTML = "<p>Du har ikke gemt noget søvnhistorik endnu.</p>";
            return;
        }

        dates.forEach(date => {
            const dayData = logs[date];
            let listHtml = "";
            
            // Historik-fanen har stadig sletteknappen
            dayData.sessions.forEach((session, index) => {
                const displayText = session.timeDisplay ? session.timeDisplay : `Kl. ${session.time}`;
                listHtml += `
                    <li>
                        <span>${displayText} - Søvnur: ${session.durationText}</span>
                        <button class="delete-btn" onclick="deleteLogEntry('${date}', ${index})" title="Slet tid">❌</button>
                    </li>
                `;
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

    document.getElementById('btn-save-log').addEventListener('click', saveSleepSession);
    
    document.getElementById('btn-reset-time').addEventListener('click', () => {
        if(confirm("Vil du nulstille uret uden at gemme?")) {
            resetStopwatch();
        }
    });

    document.getElementById('clear-history-btn').addEventListener('click', () => {
        if(confirm("Er du HELT sikker på, at du vil slette AL tidligere historik permanent?")) {
            localStorage.removeItem('babyRoLogs');
            renderHistory();
            renderTodayLog();
        }
    });

    renderTodayLog();
});
