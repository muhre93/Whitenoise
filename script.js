document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('global-audio-player');
    const playButtons = document.querySelectorAll('.play-btn');
    const stopButton = document.getElementById('stop-all');
    const timerSelect = document.getElementById('timer-select');
    const timeDisplay = document.getElementById('time-elapsed');
    
    let timeoutId = null;
    let currentlyPlayingBtn = null;
    
    // Variabler til at holde styr på spilletid
    let elapsedSeconds = 0;
    let intervalId = null;

    function resetAllButtons() {
        playButtons.forEach(btn => {
            btn.textContent = 'Afspil';
            btn.classList.remove('playing');
        });
    }

    // --- Stopur funktioner ---
    function startStopwatch() {
        clearInterval(intervalId); // Sørg for at slette gamle tællere
        intervalId = setInterval(() => {
            elapsedSeconds++;
            updateDisplay();
        }, 1000); // Kører hvert sekund
    }

    function stopStopwatch() {
        clearInterval(intervalId);
    }

    function resetStopwatch() {
        clearInterval(intervalId);
        elapsedSeconds = 0;
        updateDisplay();
    }

    function updateDisplay() {
        // Omregner sekunder til Timer:Minutter:Sekunder format
        const h = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(elapsedSeconds % 60).padStart(2, '0');
        timeDisplay.textContent = `Spilletid: ${h}:${m}:${s}`;
    }
    // --------------------------

    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            const selectElement = document.getElementById(`variant-${category}`);
            const audioSrc = selectElement.value;

            // Stop lyden hvis man klikker på knappen igen
            if (currentlyPlayingBtn === this && !audioPlayer.paused) {
                audioPlayer.pause();
                resetAllButtons();
                clearTimer();
                stopStopwatch();
                currentlyPlayingBtn = null;
                return;
            }

            // Start forfra med ny lyd
            resetAllButtons();
            audioPlayer.src = audioSrc;
            
            audioPlayer.play().then(() => {
                this.textContent = 'Pause';
                this.classList.add('playing');
                currentlyPlayingBtn = this;
                
                resetStopwatch();
                startStopwatch();
                setupTimer(); 
            }).catch(error => {
                console.error("Lyden kunne ikke afspilles:", error);
                alert("Lyden kunne ikke afspilles. Tjek at lydfilerne ligger i 'lyde'-mappen og er navngivet korrekt.");
            });
        });
    });

    stopButton.addEventListener('click', () => {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        resetAllButtons();
        clearTimer();
        resetStopwatch();
        currentlyPlayingBtn = null;
    });

    // --- Nedtælling Timer funktion ---
    function setupTimer() {
        clearTimer();
        
        // Henter værdien i minutter (fra vores HTML)
        const minutes = parseInt(timerSelect.value);
        
        // Hvis værdien er større end 0, starter vi en nedtælling
        if (minutes > 0) {
            const milliseconds = minutes * 60 * 1000; // Omregner minutter til millisekunder
            
            timeoutId = setTimeout(() => {
                audioPlayer.pause();
                resetAllButtons();
                stopStopwatch();
                currentlyPlayingBtn = null;
                console.log("Timeren slukkede automatisk for lyden.");
            }, milliseconds);
        }
    }

    function clearTimer() {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    }

    timerSelect.addEventListener('change', () => {
        if (!audioPlayer.paused) {
            setupTimer();
        }
    });
});
