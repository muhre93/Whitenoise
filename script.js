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
    let isUrPaused = false; // Holder styr på om søvnuret er sat på pause

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

    function stopStopwatch() { 
        clearInterval(intervalId); 
    }

    function resetStopwatch() {
        stopStopwatch();
        elapsedSeconds = 0;
        sessionStartTime = null; 
        
        // Nulstil også pauseknappen visuelt
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
        // Gør ingenting hvis uret ikke er startet endnu
        if (elapsedSeconds === 0 && sessionStartTime === null) return;
        
        if (!isUrPaused) {
            // Hvis det kører, sæt på pause
            stopStopwatch();
            isUrPaused = true;
            btnPauseTime.textContent = 'Start';
            btnPauseTime.style.backgroundColor = '#a4b5a8'; // Skifter til grøn når den er klar til start
            btnPauseTime.style.color = 'white';
        } else {
            // Hvis det er pauset, genoptag
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
            
            // Hvis uret er manuelt pauset med den nye knap, fjerner vi pausen, fordi afspil er trykket
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

    function clearTimer() {
        if (timeoutId !== null) { clearTimeout(timeoutId); timeoutId = null; }
    }

    timerSelect.addEventListener('change', () => {
        if (currentlyPlayingBtn !== null) setupTimer();
    });

    // --- 6. SØVNLOG & HISTORIK ---
    
    // NYT TIDSFORMAT (Vise minutter:sekunder, f.eks 2:51 min)
    function formatTimeText(totalSecs) {
        if (totalSecs === 0) return `0:00 min`;
        
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        
        // Sørger for at sekunder altid står med to tal, f.eks "05" og ikke bare "5"
        const secString = String(s).padStart(2, '0');
        
        if (h > 0) {
            const minString = String(m).padStart(2, '0');
            return `${h}:${minString}:${secString} t`; // f.eks 1:15:30 t
        } else {
            return `${m}:${secString} min`; // f.eks 2:51 min
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
            durationText: formatTimeText(elapsedSeconds)
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

        todayData.sessions.forEach(session => {
            const li = document.createElement('li');
            const displayText = session.timeDisplay ? session.timeDisplay : `Kl. ${session.time}`;
            li.innerHTML = `<span>${displayText}</span> <span>${session.durationText}</span>`;
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
            dayData.sessions.forEach(session => {
                const displayText = session.timeDisplay ? session.timeDisplay : `Kl. ${session.time}`;
                listHtml += `<li>${displayText} - Søvnur: ${session.durationText}</li>`;
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
        if(confirm("Vil du slette al tidligere historik permanent?")) {
            localStorage.removeItem('babyRoLogs');
            renderHistory();
            renderTodayLog();
        }
    });

    renderTodayLog();
});
