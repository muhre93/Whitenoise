document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('global-audio-player');
    const playButtons = document.querySelectorAll('.play-btn');
    const stopButton = document.getElementById('stop-all');
    const timerSelect = document.getElementById('timer-select');
    const timeDisplay = document.getElementById('time-elapsed');
    
    let timeoutId = null;
    let currentlyPlayingBtn = null;
    
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
        clearInterval(intervalId);
        elapsedSeconds = 0;
        updateDisplay();
    }

    function updateDisplay() {
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

            // Stop lyden hvis man klikker på den knap, der allerede spiller
            if (currentlyPlayingBtn === this) {
                audioPlayer.pause();
                resetAllButtons();
                clearTimer();
                stopStopwatch();
                currentlyPlayingBtn = null;
                return;
            }

            resetAllButtons();
            audioPlayer.src = audioSrc;
            this.textContent = 'Pause';
            this.classList.add('playing');
            
            // TJEKKER OM EN ANDEN LYD ALLEREDE SPILLEDE
            // Hvis currentlyPlayingBtn er null, betyder det at siden var helt stille.
            // Så skal stopuret og timeren starte forfra.
            // Hvis den IKKE er null, fortsætter uret bare med at tælle!
            if (currentlyPlayingBtn === null) {
                resetStopwatch();
                startStopwatch();
                setupTimer(); 
            }
            
            currentlyPlayingBtn = this;
            
            // Forsøger at afspille lyden i baggrunden
            audioPlayer.play().catch(error => {
                console.log("Lydfilen mangler, men vi starter stopuret alligevel så du kan teste siden.");
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
        
        const minutes = parseInt(timerSelect.value);
        
        if (minutes > 0) {
            const milliseconds = minutes * 60 * 1000; 
            
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
        if (currentlyPlayingBtn !== null) {
            setupTimer();
        }
    });
});
